import IncidentModel from "../models/incident.model.js";
import OrganizationModel from "../models/organization.model.js";
import Referer from "../models/referer.model.js";
import MessageModel from "../models/message.model.js";
import aiService from "../services/ai.service.js";
import { logActivity } from "../services/activity.service.js";
import ActivityModel from "../models/activity.model.js";
import notificationService from "../services/notification.service.js";

// Get all incidents for organizations the user belongs to
export const getIncidents = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find organizations the user belongs to
        const userReferers = await Referer.find({ referer: userId });
        
        // Also check if user is an organization owner
        const ownedOrgs = await OrganizationModel.find({ owner: userId });
        
        const orgIds = userReferers.map(ref => ref.organization);
        ownedOrgs.forEach(org => {
            if (!orgIds.some(id => id.toString() === org._id.toString())) {
                orgIds.push(org._id);
            }
        });

        if (orgIds.length === 0) {
            return res.status(200).json({
                message: "No incidents found",
                incidents: []
            });
        }

        const incidents = await IncidentModel.find({
            organization: { $in: orgIds }
        })
        .populate('assignees.user', 'username email')
        .populate('reporter', 'username email')
        .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Incidents fetched successfully",
            incidents
        });

    } catch (error) {
        console.error("Error fetching incidents:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Create a new incident
export const createIncident = async (req, res) => {
    try {
        const { title, description, organizationId, priority, type, location, assignees } = req.body;

        if (!title || !description || !organizationId) {
            return res.status(400).json({ error: "Title, description, and organization are required" });
        }

        // Verify organization ownership or membership
        const org = await OrganizationModel.findById(organizationId);
        if (!org) return res.status(404).json({ error: "Organization not found" });

        const isOwner = org.owner.toString() === req.user._id.toString();
        const isMember = await Referer.exists({ referer: req.user._id, organization: organizationId });

        if (!isOwner && !isMember) {
            return res.status(403).json({ error: "You do not have access to this organization" });
        }

        // Process assignees
        let finalAssignees = [];
        if (assignees && Array.isArray(assignees)) {
            finalAssignees = assignees.map(a => ({
                user: a.userId || a.user,
                role: a.role || "Lead"
            }));
        }

        const generateIncidentCode = async () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code;
            let exists = true;
            while (exists) {
                let segment = '';
                for (let i = 0; i < 6; i++) segment += chars.charAt(Math.floor(Math.random() * chars.length));
                code = 'INC-' + segment;
                exists = await IncidentModel.exists({ incident_code: code });
            }
            return code;
        };

        const incidentCode = await generateIncidentCode();

        const incident = await IncidentModel.create({ 
            title, 
            description, 
            organization: organizationId,
            incident_code: incidentCode,
            priority: priority || "Medium",
            type: type || "Alert",
            location,
            assignees: finalAssignees,
            reporter: req.user._id
        });

        await logActivity({
            user: req.user._id,
            organization: organizationId,
            action: "reported Incident",
            detail: `${incident.title}`,
            type: "incident",
            incident: incident._id
        });

        await notificationService.notifyAllChannels(organizationId, 'incident.created', {
            title: incident.title,
            priority: incident.priority,
            type: incident.type,
            id: incident._id,
        });

        res.status(201).json({ message: "Incident created successfully", incident });
    } catch (error) {
        console.error("Error creating incident:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
};

// Get single incident by ID
export const getIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const incident = await IncidentModel.findById(id)
            .populate('assignees.user', 'username email')
            .populate('reporter', 'username email');
        
        if (!incident) return res.status(404).json({ error: "Incident not found" });

        // Verify access to organization
        const organizationId = incident.organization;
        const org = await OrganizationModel.findById(organizationId);
        const isOwner = org && org.owner.toString() === userId.toString();
        const isMember = await Referer.exists({ referer: userId, organization: organizationId });
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isMember && !isAdmin) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.status(200).json({ message: "Incident fetched successfully", incident });
    } catch (error) {
        console.error("Error fetching incident:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Update an incident — organization owner or member can edit
export const updateIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, resolution, priority, type, location, assignees } = req.body;
        const userId = req.user._id;

        const incident = await IncidentModel.findById(id);
        if (!incident) return res.status(404).json({ error: "Incident not found" });

        const organizationId = incident.organization;
        const org = await OrganizationModel.findById(organizationId);
        const isOwner = org && org.owner.toString() === userId.toString();
        const isMember = await Referer.exists({ referer: userId, organization: organizationId });

        if (!isOwner && !isMember) {
            return res.status(403).json({ error: "Only organization members can edit incidents" });
        }

        if (title !== undefined) incident.title = title;
        if (description !== undefined) incident.description = description;
        if (priority !== undefined) incident.priority = priority;
        if (type !== undefined) incident.type = type;
        if (location !== undefined) incident.location = location;
        if (assignees !== undefined && Array.isArray(assignees)) {
            incident.assignees = assignees.map(a => ({
                user: a.userId || a.user,
                role: a.role || "Lead"
            }));
        }
        if (status !== undefined) {
            if (!["open", "in_progress", "closed", "monitoring"].includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }
            incident.status = status;
        }
        if (resolution !== undefined) incident.resolution = resolution;
        
        await incident.save();

        await logActivity({
            user: userId,
            organization: organizationId,
            action: "edited Incident",
            detail: `${incident.title}`,
            type: "incident",
            incident: incident._id
        });

        res.status(200).json({ message: "Incident updated successfully", incident });
    } catch (error) {
        console.error("Error updating incident:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
};

// Delete an incident — ONLY organization owner can delete
export const deleteIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const incident = await IncidentModel.findById(id);
        if (!incident) return res.status(404).json({ error: "Incident not found" });

        const organizationId = incident.organization;
        const org = await OrganizationModel.findById(organizationId);
        const isOwner = org && org.owner.toString() === userId.toString();

        if (!isOwner) {
            return res.status(403).json({ error: "Only the organization owner can delete incidents" });
        }

        await IncidentModel.findByIdAndDelete(id);

        await logActivity({
            user: userId,
            organization: organizationId,
            action: "deleted Incident",
            detail: `${incident.title}`,
            type: "incident",
            incident: incident._id
        });

        res.status(200).json({ message: "Incident deleted successfully" });
    } catch (error) {
        console.error("Error deleting incident:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
};

// Get all messages for an incident
export const getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const incident = await IncidentModel.findById(id);
        if (!incident) return res.status(404).json({ error: "Incident not found" });

        const organizationId = incident.organization;
        const isOwner = await OrganizationModel.exists({ owner: userId, _id: organizationId });
        const isMember = await Referer.exists({ referer: userId, organization: organizationId });
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isMember && !isAdmin) {
            return res.status(403).json({ error: "Access denied" });
        }

        const messages = await MessageModel.find({ incident: id })
            .populate('sender', 'username email')
            .sort({ createdAt: 1 });

        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            content: msg.content,
            sender: msg.sender?.username || "Unknown",
            senderId: msg.sender?._id,
            createdAt: msg.createdAt,
            incidentId: msg.incident,
        }));

        res.status(200).json({
            message: "Messages fetched successfully",
            messages: formattedMessages,
        });

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get all activities for an incident
export const getActivities = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const incident = await IncidentModel.findById(id);
        if (!incident) return res.status(404).json({ error: "Incident not found" });

        // Check access
        const isOwner = await OrganizationModel.exists({ owner: userId, _id: incident.organization });
        const isMember = await Referer.exists({ referer: userId, organization: incident.organization });
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isMember && !isAdmin) {
            return res.status(403).json({ error: "No access to this incident" });
        }

        const activities = await ActivityModel.find({
            $or: [
                { incident: id },
                { detail: incident.title, organization: incident.organization, type: "incident" }
            ]
        })
        .populate('user', 'username email')
        .sort({ createdAt: 1 });

        res.status(200).json({ activities });
    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


// AI summarize an incident
export const aiSummarize = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const incident = await IncidentModel.findById(id);
        if (!incident) return res.status(404).json({ error: "Incident not found" });

        const organizationId = incident.organization;
        const isOwner = await OrganizationModel.exists({ owner: userId, _id: organizationId });
        const isMember = await Referer.exists({ referer: userId, organization: organizationId });
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isMember && !isAdmin) {
            return res.status(403).json({ error: "Access denied" });
        }

        const messages = await MessageModel.find({ incident: id })
            .populate('sender', 'username email')
            .sort({ createdAt: 1 });

        const messagesText = messages.map(m => `[${new Date(m.createdAt).toLocaleString()}] ${m.sender?.username || "Unknown"}: ${m.content}`).join("\n");

        const systemPrompt = `You are an AI incident analysis assistant. Analyze the following incident and its report messages. Provide a concise summary that includes:
1. Incident overview
2. Key issues reported
3. Current status assessment
Keep it brief and professional.`;

        const userMessage = `Incident: "${incident.title}"\nDescription: ${incident.description}\nStatus: ${incident.status}\n\nReport Messages:\n${messagesText || "No reports yet."}`;

        const summary = await aiService.summarizeIncident(incident, messages, []);

        res.status(200).json({
            message: "AI summary generated successfully",
            summary: summary.text,
        });

    } catch (error) {
        console.error("Error generating AI summary:", error);
        res.status(500).json({ error: "Failed to generate AI summary" });
    }
};

// AI answer question about an incident
export const aiAsk = async (req, res) => {
    try {
        const { id } = req.params;
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: "Question is required" });
        }

        const userId = req.user._id;

        const incident = await IncidentModel.findById(id);
        if (!incident) return res.status(404).json({ error: "Incident not found" });

        const organizationId = incident.organization;
        const isOwner = await OrganizationModel.exists({ owner: userId, _id: organizationId });
        const isMember = await Referer.exists({ referer: userId, organization: organizationId });
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isMember && !isAdmin) {
            return res.status(403).json({ error: "Access denied" });
        }

        const messages = await MessageModel.find({ incident: id })
            .populate('sender', 'username email')
            .sort({ createdAt: 1 });

        const messagesText = messages.map(m => `[${new Date(m.createdAt).toLocaleString()}] ${m.sender?.username || "Unknown"}: ${m.content}`).join("\n");

        const systemPrompt = `You are an AI incident analysis assistant. You have access to the following incident details and report messages. Answer the user's question based on the available information. If you cannot find relevant information, say so clearly. Be concise and helpful.`;

        const userMessage = `Incident: "${incident.title}"\nDescription: ${incident.description}\nStatus: ${incident.status}\nCreated: ${incident.createdAt}\n\nReport Messages:\n${messagesText || "No reports yet."}\n\nUser's Question: ${question}`;

        const answer = await aiService.askAI(systemPrompt, userMessage, { organizationId, endpoint: 'ai-ask' });

        res.status(200).json({
            message: "AI answer generated successfully",
            answer: answer.text,
        });

    } catch (error) {
        console.error("Error generating AI answer:", error);
        res.status(500).json({ error: "Failed to generate AI answer" });
    }
};

export const getIncidentByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user._id;

        const incident = await IncidentModel.findOne({ incident_code: code.toUpperCase() })
            .populate('assignees.user', 'username email')
            .populate('reporter', 'username email');
        
        if (!incident) return res.status(404).json({ error: "Incident not found with that code" });

        const organizationId = incident.organization;
        const org = await OrganizationModel.findById(organizationId);
        const isOwner = org && org.owner.toString() === userId.toString();
        const isMember = await Referer.exists({ referer: userId, organization: organizationId });
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isMember && !isAdmin) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.status(200).json({ message: "Incident found", incident });
    } catch (error) {
        console.error("Error fetching incident by code:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const exportCSV = async (req, res) => {
    try {
        const userId = req.user._id;

        const userReferers = await Referer.find({ referer: userId });
        const ownedOrgs = await OrganizationModel.find({ owner: userId });
        const orgIds = userReferers.map(ref => ref.organization);
        ownedOrgs.forEach(org => {
            if (!orgIds.some(id => id.toString() === org._id.toString())) {
                orgIds.push(org._id);
            }
        });

        if (orgIds.length === 0) {
            return res.status(200).json({ incidents: [] });
        }

        const incidents = await IncidentModel.find({ organization: { $in: orgIds } })
            .populate('assignees.user', 'username')
            .populate('reporter', 'username')
            .sort({ createdAt: -1 });

        const headers = ["Incident Code", "Title", "Description", "Priority", "Type", "Status", "Tags", "Assignees", "Reporter", "Created At", "Resolution Time (min)", "SLA Breached"];

        const rows = incidents.map(inc => [
            `"${inc.incident_code}"`,
            `"${(inc.title || "").replace(/"/g, '""')}"`,
            `"${(inc.description || "").replace(/"/g, '""')}"`,
            inc.priority,
            inc.type,
            inc.status,
            `"${(inc.tags || []).join(", ")}"`,
            `"${(inc.assignees || []).map(a => a.user?.username || "Unassigned").join(", ")}"`,
            `"${inc.reporter?.username || "Unknown"}"`,
            new Date(inc.createdAt).toISOString(),
            inc.resolution_time || "",
            inc.sla_breached ? "Yes" : "No",
        ]);

        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=incidents_export.csv");
        res.send(csv);
    } catch (error) {
        console.error("Error exporting CSV:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export default {
    getIncidents,
    createIncident,
    getIncident,
    updateIncident,
    deleteIncident,
    getMessages,
    aiSummarize,
    aiAsk,
    getActivities,
    getIncidentByCode,
    exportCSV,
};