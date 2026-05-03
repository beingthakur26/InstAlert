import Referer from '../models/referer.model.js';
import OrganizationModel from '../models/organization.model.js';

export const getTenantOrgIds = async (userId) => {
    const userReferers = await Referer.find({ referer: userId }).select('organization');
    const ownedOrgs = await OrganizationModel.find({ owner: userId }).select('_id');
    
    const orgIds = new Set();
    userReferers.forEach(r => orgIds.add(r.organization.toString()));
    ownedOrgs.forEach(o => orgIds.add(o._id.toString()));
    
    return Array.from(orgIds);
};

export const requireOrgAccess = async (req, res, next) => {
    const { organizationId } = req.body;
    if (!organizationId) return next();
    
    const orgIds = await getTenantOrgIds(req.user._id);
    if (!orgIds.includes(organizationId.toString())) {
        return res.status(403).json({ error: 'No access to this organization' });
    }
    next();
};
