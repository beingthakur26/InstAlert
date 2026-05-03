import StatusPageModel from '../models/statusPage.model.js';
import IncidentModel from '../models/incident.model.js';
import OrganizationModel from '../models/organization.model.js';
import Referer from '../models/referer.model.js';

const checkOrgAccess = async (userId, organizationId) => {
    const org = await OrganizationModel.findById(organizationId);
    if (!org) return false;
    const isOwner = org.owner.toString() === userId.toString();
    const isMember = await Referer.exists({ referer: userId, organization: organizationId });
    const isAdmin = (await import('../models/user.model.js')).default.findById(userId).then(u => u?.role === 'admin');
    return isOwner || isMember || isAdmin;
};

export const getStatusPage = async (req, res) => {
    try {
        const userId = req.user._id;
        const orgIds = await Promise.all([
            Referer.find({ referer: userId }).select('organization'),
            OrganizationModel.find({ owner: userId }).select('_id'),
        ]).then(([refs, owned]) => [...refs.map(r => r.organization), ...owned.map(o => o._id)]);

        const statusPage = await StatusPageModel.findOne({ organization: { $in: orgIds } });
        if (!statusPage) return res.status(404).json({ error: 'No status page configured' });

        res.json({ statusPage });
    } catch (err) {
        console.error('[StatusPage] Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch status page' });
    }
};

export const createStatusPage = async (req, res) => {
    try {
        const { title, description, slug, components } = req.body;
        const { organizationId } = req.body;

        if (!organizationId) return res.status(400).json({ error: 'Organization ID is required' });

        const hasAccess = await checkOrgAccess(req.user._id, organizationId);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const existing = await StatusPageModel.findOne({ organization: organizationId });
        if (existing) return res.status(409).json({ error: 'Status page already exists for this organization' });

        const statusPage = await StatusPageModel.create({
            organization: organizationId,
            title,
            description,
            slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
            components: components || [{ name: 'All Systems', status: 'operational' }],
        });

        res.status(201).json({ message: 'Status page created', statusPage });
    } catch (err) {
        console.error('[StatusPage] Create error:', err);
        res.status(500).json({ error: 'Failed to create status page' });
    }
};

export const updateStatusPage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { title, description, components, is_public, theme } = req.body;

        const statusPage = await StatusPageModel.findOne({ organization: { $in: (await Promise.all([
            Referer.find({ referer: userId }).select('organization'),
            OrganizationModel.find({ owner: userId }).select('_id'),
        ]).then(([refs, owned]) => [...refs.map(r => r.organization), ...owned.map(o => o._id)])) }});

        if (!statusPage) return res.status(404).json({ error: 'Status page not found' });

        if (title !== undefined) statusPage.title = title;
        if (description !== undefined) statusPage.description = description;
        if (components !== undefined) statusPage.components = components;
        if (is_public !== undefined) statusPage.is_public = is_public;
        if (theme !== undefined) statusPage.theme = { ...statusPage.theme, ...theme };

        await statusPage.save();

        res.json({ message: 'Status page updated', statusPage });
    } catch (err) {
        console.error('[StatusPage] Update error:', err);
        res.status(500).json({ error: 'Failed to update status page' });
    }
};

export const addIncidentToStatusPage = async (req, res) => {
    try {
        const { incidentId } = req.body;

        const incident = await IncidentModel.findById(incidentId);
        if (!incident) return res.status(404).json({ error: 'Incident not found' });

        const statusPage = await StatusPageModel.findOne({ organization: incident.organization });
        if (!statusPage) return res.status(404).json({ error: 'No status page configured' });

        statusPage.incidents.push({
            incident: incidentId,
            title: incident.title,
            status: 'investigating',
            created_at: new Date(),
        });

        await statusPage.save();

        res.json({ message: 'Incident added to status page', statusPage });
    } catch (err) {
        console.error('[StatusPage] Add incident error:', err);
        res.status(500).json({ error: 'Failed to add incident to status page' });
    }
};

export const updateStatusPageIncident = async (req, res) => {
    try {
        const { pageId, incidentIdx } = req.params;
        const { status, title } = req.body;

        const statusPage = await StatusPageModel.findById(pageId);
        if (!statusPage) return res.status(404).json({ error: 'Status page not found' });

        const idx = Number(incidentIdx);
        if (!statusPage.incidents[idx]) return res.status(404).json({ error: 'Incident not found on status page' });

        if (status !== undefined) statusPage.incidents[idx].status = status;
        if (title !== undefined) statusPage.incidents[idx].title = title;
        if (status === 'resolved') statusPage.incidents[idx].resolved_at = new Date();

        await statusPage.save();

        res.json({ message: 'Status page incident updated', statusPage });
    } catch (err) {
        console.error('[StatusPage] Update incident error:', err);
        res.status(500).json({ error: 'Failed to update status page incident' });
    }
};

export const getPublicStatusPage = async (req, res) => {
    try {
        const { slug } = req.params;

        const statusPage = await StatusPageModel.findOne({ slug, is_public: true })
            .populate('incidents.incident', 'title priority type');

        if (!statusPage) return res.status(404).json({ error: 'Status page not found' });

        res.json({ statusPage });
    } catch (err) {
        console.error('[StatusPage] Public fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch public status page' });
    }
};

export default {
    getStatusPage,
    createStatusPage,
    updateStatusPage,
    addIncidentToStatusPage,
    updateStatusPageIncident,
    getPublicStatusPage,
};
