import app from '../app.js';
import http from 'http';
import { Server } from 'socket.io';

import IncidentModel from '../models/incident.model.js';
import MessageModel from '../models/message.model.js';
import OrganizationModel from '../models/organization.model.js';
import DirectMessageModel from '../models/directMessage.model.js';
import ChannelModel from '../models/channel.model.js';
import aiService from '../services/ai.service.js';

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(u => u.trim())
  : [
      "https://f1rr36mb-5173.inc1.devtunnels.ms",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:3002"
    ];

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Map of userId -> socketId to track online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] A user connected, socket id: ${socket.id}`);

  socket.on("register-user", (data) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsed.userId) {
        onlineUsers.set(parsed.userId, socket.id);
        socket.userId = parsed.userId;
        // Broadcast updated online users to everyone
        io.emit('online-users', Array.from(onlineUsers.keys()));
      }
    } catch (err) {
      console.error("[Socket] Register user error:", err);
    }
  });

  socket.on("join-org", (data) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      const { joinCode } = parsed;
      socket.join(`org:${joinCode}`);
      socket.joinCode = joinCode;
      console.log(`[Socket] User joined org room: org:${joinCode}`);
      socket.emit('joined-room', { joinCode });
    } catch (err) {
      console.error("[Socket] Join error:", err);
    }
  });

  socket.on("send-message", async (clientData) => {
    try {
      const data = typeof clientData === 'string' ? JSON.parse(clientData) : clientData;
      const joinCode = data.joinCode || socket.joinCode;

      if (!data.userId || !joinCode) {
        return socket.emit("error", "User ID and Join Code are required");
      }

      const org = await OrganizationModel.findOne({ organizationJoinCode: joinCode });
      if (!org) return socket.emit("error", "Organization not found");

      const newMessage = await MessageModel.create({
        content: data.message,
        sender: data.userId,
        incident: data.incidentId,
        channel: data.channelId,
        organization: org._id
      });

      const messagePayload = JSON.stringify({
        _id: newMessage._id,
        content: newMessage.content,
        sender: data.senderName || "Unknown",
        senderId: data.userId,
        tempId: data.tempId,
        incidentId: data.incidentId,
        channelId: data.channelId,
        createdAt: newMessage.createdAt,
        isAi: false
      });

      io.to(`org:${joinCode}`).emit("receive-message", messagePayload);

      // AI Integration - Support multiple triggers like @instaalert, @instalert, #InstaAlert
      const aiTriggerRegex = /(@instaalert|@instalert|#instaalert|#instalert)/gi;
      
      if (aiTriggerRegex.test(data.message)) {
        const prompt = data.message.replace(aiTriggerRegex, "").trim();
        
        let context = "";
        if (data.incidentId) {
            const incident = await IncidentModel.findById(data.incidentId);
            if (incident) {
                context = `Incident Context:\nTitle: ${incident.title}\nDescription: ${incident.description}\nStatus: ${incident.status}`;
            }
        } else if (data.channelId) {
            const channel = await ChannelModel.findById(data.channelId);
            if (channel) {
                context = `Channel Context: General discussion in ${channel.name}.`;
            }
        }

        const systemPrompt = `You are InstaAlert AI, a helpful assistant in a team chat. Answer the user's query clearly and concisely. ${context}`;
        
        // Wait for AI response without blocking the chat thread
        aiService.askAI(systemPrompt, prompt, { organizationId: org._id, endpoint: 'socket-chat' }).then(async (result) => {
            const answer = result.text;
            const aiMessage = await MessageModel.create({
                content: answer,
                senderName: "InstaAlert AI",
                isAi: true,
                incident: data.incidentId,
                channel: data.channelId,
                organization: org._id
            });

            const aiPayload = JSON.stringify({
                _id: aiMessage._id,
                content: aiMessage.content,
                sender: "InstaAlert AI",
                senderId: "ai",
                incidentId: data.incidentId,
                channelId: data.channelId,
                createdAt: aiMessage.createdAt,
                isAi: true
            });

            io.to(`org:${joinCode}`).emit("receive-message", aiPayload);
        }).catch(err => console.error("AI Error:", err));
      }

    } catch (error) {
      console.error("[Socket] Message error:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  socket.on("send-dm", async (clientData) => {
    try {
      const data = typeof clientData === 'string' ? JSON.parse(clientData) : clientData;
      const joinCode = data.joinCode || socket.joinCode;

      if (!data.senderId || !data.receiverId || !joinCode) {
        return socket.emit("error", "Sender ID, Receiver ID, and Join Code are required");
      }

      const org = await OrganizationModel.findOne({ organizationJoinCode: joinCode });
      if (!org) return socket.emit("error", "Organization not found");

      const newDm = await DirectMessageModel.create({
        content: data.message,
        sender: data.senderId,
        receiver: data.receiverId,
        organization: org._id
      });

      const dmPayload = JSON.stringify({
        _id: newDm._id,
        content: newDm.content,
        sender: data.senderName || "Unknown",
        senderId: data.senderId,
        receiverId: data.receiverId,
        tempId: data.tempId,
        createdAt: newDm.createdAt
      });

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-dm", dmPayload);
      }
      
      // Also send back to sender to confirm
      socket.emit("receive-dm", dmPayload);
    } catch (error) {
      console.error("[Socket] DM error:", error);
      socket.emit("error", "Failed to send DM");
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected, socket id: ${socket.id}`);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('online-users', Array.from(onlineUsers.keys()));
    }
  });
});

export {io, server};
