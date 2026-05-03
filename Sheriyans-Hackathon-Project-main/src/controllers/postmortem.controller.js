import PostmortemModel from '../models/postmortem.model.js';
import IncidentModel from '../models/incident.model.js';
import OrganizationModel from '../models/organization.model.js';
import Referer from '../models/referer.model.js';
import { generatePostmortem } from '../services/ai.service.js';
import MessageModel from '../models/message.model.js';
import ActivityModel from '../models/activity.model.js';

const checkOrgAccess = async (userId, organizationId) => {
    const org = await OrganizationModel.findById(organizationId);
    if (!org) return false;
    const isOwner = org.owner.toString() === userId.toString();
    const isMember = await Referer.exists({ referer: userId, organization: organizationId });
    const isAdmin = (await import('../models/user.model.js')).default.findById(userId).then(u => u?.role === 'admin');
    return isOwner || isMember || isAdmin;
};

const resolveIncident = async (identifier) => {
    let incident = null;
    if (identifier.match(/^[A-F0-9]{24}$/i)) {
        incident = await IncidentModel.findById(identifier);
    }
    if (!incident) {
        incident = await IncidentModel.findOne({ incident_code: identifier.toUpperCase() });
    }
    return incident;
};

export const createPostmortem = async (req, res) => {
    try {
        const { incidentId, incidentCode, what_happened, why_it_happened, fix_applied, prevention_steps, impact, action_items } = req.body;

        const identifier = incidentId || incidentCode;
        if (!identifier) return res.status(400).json({ error: 'Incident ID or incident code is required' });

        const incident = await resolveIncident(identifier);
        if (!incident) return res.status(404).json({ error: 'Incident not found' });

        const hasAccess = await checkOrgAccess(req.user._id, incident.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const existing = await PostmortemModel.findOne({ incident: incident._id });
        if (existing) return res.status(409).json({ error: 'Postmortem already exists for this incident' });

        const postmortem = await PostmortemModel.create({
            incident: incident._id,
            organization: incident.organization,
            what_happened,
            why_it_happened,
            fix_applied,
            prevention_steps,
            impact,
            action_items,
            generated_by: 'manual',
            author: req.user._id,
            status: 'draft',
        });

        incident.postmortem = postmortem._id;
        await incident.save();

        res.status(201).json({ message: 'Postmortem created', postmortem });
    } catch (err) {
        console.error('[Postmortem] Create error:', err);
        res.status(500).json({ error: 'Failed to create postmortem' });
    }
};

export const generatePostmortemAI = async (req, res) => {
    try {
        const identifier = req.params.code || req.params.id;
        if (!identifier) return res.status(400).json({ error: 'Incident code or ID is required' });

        const incident = await resolveIncident(identifier);
        if (!incident) return res.status(404).json({ error: 'Incident not found with that code or ID' });

        const hasAccess = await checkOrgAccess(req.user._id, incident.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const existing = await PostmortemModel.findOne({ incident: incident._id });
        if (existing) return res.status(409).json({ error: 'Postmortem already exists for this incident' });

        const messages = await MessageModel.find({ incident: incident._id })
            .populate('sender', 'username email')
            .sort({ createdAt: 1 });

        const activities = await ActivityModel.find({ incident: incident._id })
            .populate('user', 'username email')
            .sort({ createdAt: 1 });

        const result = await generatePostmortem(incident, messages, activities);

        const postmortem = await PostmortemModel.create({
            incident: incident._id,
            organization: incident.organization,
            what_happened: result.text,
            why_it_happened: 'See full report below.',
            fix_applied: incident.resolution || 'Pending',
            generated_by: 'ai',
            author: req.user._id,
            status: 'draft',
        });

        incident.postmortem = postmortem._id;
        await incident.save();

        res.status(201).json({ message: 'AI postmortem generated', postmortem, raw: result.text });
    } catch (err) {
        console.error('[Postmortem] AI generation error:', err);
        res.status(500).json({ error: 'Failed to generate postmortem' });
    }
};

export const getPostmortems = async (req, res) => {
    try {
        const userId = req.user._id;
        const orgIds = await Promise.all([
            Referer.find({ referer: userId }).select('organization'),
            OrganizationModel.find({ owner: userId }).select('_id'),
        ]).then(([refs, owned]) => [...refs.map(r => r.organization), ...owned.map(o => o._id)]);

        const { status, page = 1, limit = 20 } = req.query;
        const filter = { organization: { $in: orgIds } };
        if (status) filter.status = status;

        const postmortems = await PostmortemModel.find(filter)
            .populate('incident', 'title priority type status incident_code')
            .populate('author', 'username email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await PostmortemModel.countDocuments(filter);

        res.json({ postmortems, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        console.error('[Postmortem] Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch postmortems' });
    }
};

export const getPostmortem = async (req, res) => {
    try {
        const { id } = req.params;

        const postmortem = await PostmortemModel.findById(id)
            .populate({ path: 'incident', select: 'title priority type status incident_code description location createdAt' })
            .populate('author', 'username email');

        if (!postmortem) return res.status(404).json({ error: 'Postmortem not found' });

        const hasAccess = await checkOrgAccess(req.user._id, postmortem.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        res.json({ postmortem });
    } catch (err) {
        console.error('[Postmortem] Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch postmortem' });
    }
};

export const updatePostmortem = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, what_happened, why_it_happened, fix_applied, prevention_steps, action_items, lessons_learned, timeline } = req.body;

        const postmortem = await PostmortemModel.findById(id);
        if (!postmortem) return res.status(404).json({ error: 'Postmortem not found' });

        const hasAccess = await checkOrgAccess(req.user._id, postmortem.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        if (status !== undefined) {
            postmortem.status = status;
            if (status === 'published' && !postmortem.published_at) {
                postmortem.published_at = new Date();
            }
        }
        if (what_happened !== undefined) postmortem.what_happened = what_happened;
        if (why_it_happened !== undefined) postmortem.why_it_happened = why_it_happened;
        if (fix_applied !== undefined) postmortem.fix_applied = fix_applied;
        if (prevention_steps !== undefined) postmortem.prevention_steps = prevention_steps;
        if (action_items !== undefined) postmortem.action_items = action_items;
        if (lessons_learned !== undefined) postmortem.lessons_learned = lessons_learned;
        if (timeline !== undefined) postmortem.timeline = timeline;

        await postmortem.save();

        res.json({ message: 'Postmortem updated', postmortem });
    } catch (err) {
        console.error('[Postmortem] Update error:', err);
        res.status(500).json({ error: 'Failed to update postmortem' });
    }
};

export const downloadPostmortem = async (req, res) => {
    try {
        const { id } = req.params;

        const postmortem = await PostmortemModel.findById(id)
            .populate({ path: 'incident', select: 'title priority type status incident_code description location createdAt' })
            .populate('author', 'username email');

        if (!postmortem) return res.status(404).json({ error: 'Postmortem not found' });

        const hasAccess = await checkOrgAccess(req.user._id, postmortem.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const inc = postmortem.incident;
        const text = `
================================================================================
                        POSTMORTEM REPORT
                        ${inc?.title || 'Untitled Incident'}
                        Incident Code: ${inc?.incident_code || 'N/A'}
================================================================================

Date: ${new Date(postmortem.createdAt).toLocaleString()}
Status: ${postmortem.status.toUpperCase()}
Generated by: ${postmortem.generated_by.toUpperCase()}
Author: ${postmortem.author?.username || 'Unknown'}

--------------------------------------------------------------------------------
INCIDENT DETAILS
--------------------------------------------------------------------------------
Priority:     ${inc?.priority || 'N/A'}
Type:         ${inc?.type || 'N/A'}
Status:       ${inc?.status || 'N/A'}
Location:     ${inc?.location || 'N/A'}
Created:      ${inc?.createdAt ? new Date(inc.createdAt).toLocaleString() : 'N/A'}

--------------------------------------------------------------------------------
WHAT HAPPENED
--------------------------------------------------------------------------------
${postmortem.what_happened}

--------------------------------------------------------------------------------
ROOT CAUSE
--------------------------------------------------------------------------------
${postmortem.why_it_happened}

--------------------------------------------------------------------------------
FIX APPLIED
--------------------------------------------------------------------------------
${postmortem.fix_applied}

--------------------------------------------------------------------------------
PREVENTION STEPS
--------------------------------------------------------------------------------
${postmortem.prevention_steps?.map((s, i) => `  ${i + 1}. ${s}`).join('\n') || 'None recorded'}

${postmortem.action_items?.length > 0 ? `
--------------------------------------------------------------------------------
ACTION ITEMS
--------------------------------------------------------------------------------
${postmortem.action_items.map((item, i) => `  ${i + 1}. [${item.status.toUpperCase()}] ${item.action}
     Owner: ${item.owner || 'Unassigned'} | Priority: ${item.priority || 'N/A'}`).join('\n')}` : ''}

${postmortem.lessons_learned ? `
--------------------------------------------------------------------------------
LESSONS LEARNED
--------------------------------------------------------------------------------
What went well:
${postmortem.lessons_learned.went_well?.map(s => `  • ${s}`).join('\n') || '  None recorded'}

What went wrong:
${postmortem.lessons_learned.went_wrong?.map(s => `  • ${s}`).join('\n') || '  None recorded'}

Where we got lucky:
${postmortem.lessons_learned.got_lucky?.map(s => `  • ${s}`).join('\n') || '  None recorded'}
` : ''}
================================================================================
                    End of Postmortem Report
================================================================================
`.trim();

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="postmortem-${inc?.incident_code || id}.txt"`);
        res.send(text);
    } catch (err) {
        console.error('[Postmortem] Download error:', err);
        res.status(500).json({ error: 'Failed to download postmortem' });
    }
};

export default {
    createPostmortem,
    generatePostmortemAI,
    getPostmortems,
    getPostmortem,
    updatePostmortem,
    downloadPostmortem,
};
