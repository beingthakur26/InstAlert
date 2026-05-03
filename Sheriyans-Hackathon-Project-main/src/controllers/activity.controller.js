import ActivityModel from '../models/activity.model.js';
import OrganizationModel from '../models/organization.model.js';
import Referer from '../models/referer.model.js';

export const getActivities = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find organizations the user is a member of
        const userReferers = await Referer.find({ referer: userId });
        const memberOrgIds = userReferers.map(ref => ref.organization);

        // Find organizations the user owns
        const ownedOrgs = await OrganizationModel.find({ owner: userId });
        const ownedOrgIds = ownedOrgs.map(org => org._id);

        const allOrgIds = [...memberOrgIds, ...ownedOrgIds];

        const activities = await ActivityModel.find({ organization: { $in: allOrgIds } })
            .populate('user', 'username email')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({ activities });
    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};