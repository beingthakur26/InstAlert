import ActivityModel from '../models/activity.model.js';

export const logActivity = async ({ user, organization, action, detail, type, incident }) => {
    try {
        await ActivityModel.create({ user, organization, action, detail, type, incident });
    } catch (error) {
        console.error('[Activity] Failed to log:', error.message);
    }
};
