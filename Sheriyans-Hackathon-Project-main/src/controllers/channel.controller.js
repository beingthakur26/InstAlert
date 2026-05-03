import ChannelModel from "../models/channel.model.js";
import OrganizationModel from "../models/organization.model.js";
import MessageModel from "../models/message.model.js";
import Referer from "../models/referer.model.js";

export const getChannels = async (req, res) => {
    try {
        const userId = req.user._id;
        let { organizationId } = req.query;

        // If organizationId is missing or the string "undefined", look it up
        if (!organizationId || organizationId === "undefined") {
            const org = await OrganizationModel.findOne({ owner: userId });
            if (org) {
                organizationId = org._id;
            } else {
                const ref = await Referer.findOne({ referer: userId });
                if (ref) {
                    organizationId = ref.organization;
                }
            }
        }

        if (!organizationId || organizationId === "undefined") {
            console.log("[Channels] No organization found for user:", userId);
            return res.status(200).json({ channels: [] });
        }
        
        let channels = await ChannelModel.find({ organization: organizationId });

        // Ensure at least a "general" channel exists for every org
        if (channels.length === 0) {
            console.log("[Channels] Creating default general channel for org:", organizationId);
            const defaultChannel = await ChannelModel.create({
                name: "general",
                organization: organizationId
            });
            channels = [defaultChannel];
        }

        res.status(200).json({ channels });
    } catch (error) {
        console.error("Error fetching channels:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createChannel = async (req, res) => {
    try {
        const { name, organizationId } = req.body;
        const userId = req.user._id;

        if (!name || !organizationId) {
            return res.status(400).json({ error: "Name and organization ID are required" });
        }

        const org = await OrganizationModel.findById(organizationId);
        if (!org || org.owner.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Only the organization owner can create channels" });
        }

        const newChannel = await ChannelModel.create({
            name: name.toLowerCase().replace(/\s+/g, '-'),
            organization: organizationId
        });

        res.status(201).json({ message: "Channel created successfully", channel: newChannel });
    } catch (error) {
        console.error("Error creating channel:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getChannelMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const channel = await ChannelModel.findById(id);
        if (!channel) return res.status(404).json({ error: "Channel not found" });

        // Ensure user has access to organization
        const isOwner = await OrganizationModel.exists({ owner: userId, _id: channel.organization });
        const isMember = await Referer.exists({ referer: userId, organization: channel.organization });

        if (!isOwner && !isMember) {
            return res.status(403).json({ error: "No access to this channel" });
        }

        const messages = await MessageModel.find({ channel: id })
            .populate('sender', 'username email')
            .sort({ createdAt: 1 });

        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            content: msg.content,
            sender: msg.sender?.username || msg.senderName || "Unknown",
            senderId: msg.sender?._id,
            isAi: msg.isAi,
            createdAt: msg.createdAt,
            channelId: msg.channel,
        }));

        res.status(200).json({ messages: formattedMessages });

    } catch (error) {
        console.error("Error fetching channel messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};