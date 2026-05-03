import express from 'express';
import validateUser from '../middlewares/validateUser.middleware.js';
import DirectMessageModel from '../models/directMessage.model.js';
import OrganizationModel from '../models/organization.model.js';
import Referer from '../models/referer.model.js';

const router = express.Router();

router.get('/:peerId', validateUser, async (req, res) => {
    try {
        const userId = req.user._id;
        const { peerId } = req.params;

        // Verify both users share an organization
        const userReferers = await Referer.find({ referer: userId });
        const ownedOrgs = await OrganizationModel.find({ owner: userId });
        const orgIds = [...userReferers.map(r => r.organization), ...ownedOrgs.map(o => o._id)];

        if (orgIds.length === 0) return res.status(403).json({ error: "No organizations found" });

        const messages = await DirectMessageModel.find({
            organization: { $in: orgIds },
            $or: [
                { sender: userId, receiver: peerId },
                { sender: peerId, receiver: userId }
            ]
        }).populate('sender', 'username email').sort({ createdAt: 1 });

        res.status(200).json({ messages });
    } catch (error) {
        console.error("Error fetching DMs:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;