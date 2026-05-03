import { askAI, summarizeIncident, suggestRootCause, predictSeverity, recommendAssignees, compressTimeline, aiChatAssistant, findSimilarIncidents } from '../services/ai.service.js';
import IncidentModel from '../models/incident.model.js';
import MessageModel from '../models/message.model.js';
import ActivityModel from '../models/activity.model.js';
import UserModel from '../models/user.model.js';
import OrganizationModel from '../models/organization.model.js';
import Referer from '../models/referer.model.js';
import AIUsage from '../models/aiUsage.model.js';

const checkOrgAccess = async (userId, organizationId) => {
    const org = await OrganizationModel.findById(organizationId);
    if (!org) return false;
    const isOwner = org.owner.toString() === userId.toString();
    const isMember = await Referer.exists({ referer: userId, organization: organizationId });
    const isAdmin = (await UserModel.findById(userId))?.role === 'admin';
    return isOwner || isMember || isAdmin;
};

const getIncidentContext = async (id) => {
    const incident = await IncidentModel.findById(id)
        .populate('assignees.user', 'username email skills')
        .populate('reporter', 'username email');
    if (!incident) return null;

    const messages = await MessageModel.find({ incident: id })
        .populate('sender', 'username email')
        .sort({ createdAt: 1 });

    const activities = await ActivityModel.find({ incident: id })
        .populate('user', 'username email')
        .sort({ createdAt: 1 });

    const orgIncidents = await IncidentModel.find({ organization: incident.organization })
        .sort({ createdAt: -1 }).limit(50);

    return { incident, messages, activities, orgIncidents };
};

export const aiSummarizeIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const ctx = await getIncidentContext(id);
        if (!ctx) return res.status(404).json({ error: 'Incident not found' });

        const hasAccess = await checkOrgAccess(req.user._id, ctx.incident.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const result = await summarizeIncident(ctx.incident, ctx.messages, ctx.activities);

        ctx.incident.ai_summary = result.text;
        await ctx.incident.save();

        res.json({ message: 'Summary generated', summary: result.text, tokens: result.tokens, provider: result.provider });
    } catch (err) {
        console.error('[AI] Summarize error:', err);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
};

export const aiRootCause = async (req, res) => {
    try {
        const { id } = req.params;
        const ctx = await getIncidentContext(id);
        if (!ctx) return res.status(404).json({ error: 'Incident not found' });

        const hasAccess = await checkOrgAccess(req.user._id, ctx.incident.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const similar = ctx.incident.similar_incidents.length > 0
            ? await IncidentModel.find({ _id: { $in: ctx.incident.similar_incidents } })
            : [];

        const result = await suggestRootCause(ctx.incident, ctx.messages, similar);

        ctx.incident.root_cause_suggestion = result.text;
        await ctx.incident.save();

        res.json({ message: 'Root cause analysis generated', analysis: result.text });
    } catch (err) {
        console.error('[AI] Root cause error:', err);
        res.status(500).json({ error: 'Failed to analyze root cause' });
    }
};

export const aiPredictSeverity = async (req, res) => {
    try {
        const { id } = req.params;
        const ctx = await getIncidentContext(id);
        if (!ctx) return res.status(404).json({ error: 'Incident not found' });

        const hasAccess = await checkOrgAccess(req.user._id, ctx.incident.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const prediction = await predictSeverity(ctx.incident, ctx.orgIncidents);

        res.json({ message: 'Severity predicted', prediction: prediction || { reasoning: 'Unable to generate prediction', confidence: 0 } });
    } catch (err) {
        console.error('[AI] Severity prediction error:', err);
        res.status(500).json({ error: 'Failed to predict severity: ' + err.message });
    }
};

export const aiRecommendAssignees = async (req, res) => {
    try {
        const { id } = req.params;
        const ctx = await getIncidentContext(id);
        if (!ctx) return res.status(404).json({ error: 'Incident not found' });

        const hasAccess = await checkOrgAccess(req.user._id, ctx.incident.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const members = await UserModel.find({
            $or: [
                { _id: { $in: (await Referer.find({ organization: ctx.incident.organization }).select('referer')).map(r => r.referer) } },
                { _id: (await OrganizationModel.findById(ctx.incident.organization)).owner },
            ],
        }).select('username email skills incident_history');

        const recommendations = await recommendAssignees(ctx.incident, members, ctx.orgIncidents);

        res.json({ message: 'Assignees recommended', recommendations });
    } catch (err) {
        console.error('[AI] Assignee recommendation error:', err);
        res.status(500).json({ error: 'Failed to recommend assignees' });
    }
};

export const aiCompressTimeline = async (req, res) => {
    try {
        const { id } = req.params;
        const ctx = await getIncidentContext(id);
        if (!ctx) return res.status(404).json({ error: 'Incident not found' });

        const hasAccess = await checkOrgAccess(req.user._id, ctx.incident.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const result = await compressTimeline(ctx.messages, ctx.activities);

        res.json({ message: 'Timeline compressed', timeline: result.text });
    } catch (err) {
        console.error('[AI] Timeline compression error:', err);
        res.status(500).json({ error: 'Failed to compress timeline' });
    }
};

export const aiChat = async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

        const userId = req.user._id;
        const user = await UserModel.findById(userId);
        const orgIds = await Promise.all([
            Referer.find({ referer: userId }).select('organization'),
            OrganizationModel.find({ owner: userId }).select('_id'),
        ]).then(([refs, owned]) => [...refs.map(r => r.organization), ...owned.map(o => o._id)]);

        const userIncidents = await IncidentModel.find({ organization: { $in: orgIds } })
            .sort({ createdAt: -1 }).limit(20);

        const org = await OrganizationModel.findById(orgIds[0]);

        const fullContext = history.map(h => `${h.role}: ${h.content}`).join('\n') + `\nuser: ${message}`;

        const result = await aiChatAssistant(fullContext, userIncidents, org);

        res.json({ message: 'AI response generated', response: result.text, provider: result.provider });
    } catch (err) {
        console.error('[AI] Chat error:', err);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
};

export const aiFindSimilar = async (req, res) => {
    try {
        const { id } = req.params;
        const ctx = await getIncidentContext(id);
        if (!ctx) return res.status(404).json({ error: 'Incident not found' });

        const hasAccess = await checkOrgAccess(req.user._id, ctx.incident.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const allIncidents = await IncidentModel.find({
            organization: ctx.incident.organization,
            status: { $ne: 'open' },
        }).limit(100);

        const result = await findSimilarIncidents(ctx.incident, allIncidents);

        if (result.similar_incidents?.length > 0) {
            const ids = result.similar_incidents.slice(0, 3).map(si => si.incident_id).filter(id => id);
            if (ids.length > 0) {
                ctx.incident.similar_incidents = ids;
                await ctx.incident.save();
            }
        }

        res.json({ message: 'Similar incidents found', similar: result });
    } catch (err) {
        console.error('[AI] Find similar error:', err);
        res.status(500).json({ error: 'Failed to find similar incidents: ' + err.message });
    }
};

export default {
    aiSummarizeIncident,
    aiRootCause,
    aiPredictSeverity,
    aiRecommendAssignees,
    aiCompressTimeline,
    aiChat,
    aiFindSimilar,
};
