const ROLES = {
    ADMIN: 'admin',
    OWNER: 'owner',
    RESPONDER: 'responder',
    VIEWER: 'viewer',
};

const ROLE_HIERARCHY = {
    admin: 4,
    owner: 3,
    responder: 2,
    viewer: 1,
};

export const hasRole = (userRole, requiredRole) => {
    return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
};

export const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!hasRole(req.user.role, requiredRole)) {
            return res.status(403).json({ error: `Requires ${requiredRole} role or higher` });
        }
        next();
    };
};

export const validateAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

export const validateOrganization = (req, res, next) => {
    if (req.user.role !== 'organization' && req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

export default { validateAdmin, validateOrganization, requireRole, hasRole, ROLES };
