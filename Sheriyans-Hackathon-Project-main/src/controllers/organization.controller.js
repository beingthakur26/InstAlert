import OrganizationModel from "../models/organization.model.js";
import Referer from "../models/referer.model.js";
import IncidentModel from "../models/incident.model.js";
import ActivityModel from "../models/activity.model.js";
import UserModel from "../models/user.model.js";
import { logActivity } from "../services/activity.service.js";
import ChannelModel from "../models/channel.model.js";

// Get all employees/members of an organization
// Accessible by: organization owner, user, employee (any member of the org)
export const getEmployees = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find organizations the user is a member of via Referer collection
        const userReferers = await Referer.find({ referer: userId })
            .populate('organization');

        // Find organizations the user owns via OrganizationModel
        const ownedOrgs = await OrganizationModel.find({ owner: userId });

        if ((!userReferers || userReferers.length === 0) && ownedOrgs.length === 0) {
            return res.status(404).json({ error: "No organizations found" });
        }

        const allMembers = [];
        const organizations = [];
        const processedOrgIds = new Set();

        // Process organizations from Referer (user is a member)
        for (const ref of userReferers) {
            const org = ref.organization;
            if (!org || processedOrgIds.has(org._id.toString())) continue;
            processedOrgIds.add(org._id.toString());

            // Get Owner details
            const owner = await UserModel.findById(org.owner).select('username email role');
            if (owner) {
                allMembers.push({
                    _id: owner._id,
                    username: owner.username,
                    email: owner.email,
                    role: 'organization',
                    organizationRole: 'owner',
                    organizationId: org._id,
                    organizationName: org.organizationName
                });
            }

            const orgReferers = await Referer.find({ organization: org._id })
                .populate('referer', 'username email role');

            organizations.push({
                _id: org._id,
                organizationName: org.organizationName,
                organizationJoinCode: org.organizationJoinCode,
                isOwner: org.owner.toString() === userId.toString()
            });

            for (const memberRef of orgReferers) {
                // Prevent duplicate if member is already added (unlikely but safe)
                if (allMembers.some(m => m._id.toString() === memberRef.referer?._id?.toString() && m.organizationId.toString() === org._id.toString())) continue;
                
                allMembers.push({
                    _id: memberRef.referer?._id,
                    username: memberRef.referer?.username,
                    email: memberRef.referer?.email,
                    role: memberRef.referer?.role,
                    organizationRole: 'member',
                    organizationId: org._id,
                    organizationName: org.organizationName
                });
            }
        }

        // Process owned organizations (user is the owner)
        for (const org of ownedOrgs) {
            if (processedOrgIds.has(org._id.toString())) continue;
            processedOrgIds.add(org._id.toString());

            // Add self (owner)
            allMembers.push({
                _id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                role: 'organization',
                organizationRole: 'owner',
                organizationId: org._id,
                organizationName: org.organizationName
            });

            const orgReferers = await Referer.find({ organization: org._id })
                .populate('referer', 'username email role');

            organizations.push({
                _id: org._id,
                organizationName: org.organizationName,
                organizationJoinCode: org.organizationJoinCode,
                isOwner: true
            });

            for (const memberRef of orgReferers) {
                allMembers.push({
                    _id: memberRef.referer?._id,
                    username: memberRef.referer?.username,
                    email: memberRef.referer?.email,
                    role: memberRef.referer?.role,
                    organizationRole: 'member',
                    organizationId: org._id,
                    organizationName: org.organizationName
                });
            }
        }

        res.status(200).json({ 
            message: "Employees fetched successfully",
            count: allMembers.length,
            members: allMembers,
            organizations
        });

    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get the organization that the current user belongs to
export const getMyOrg = async (req, res) => {
    try {
        const userId = req.user._id;

        // First check if user owns an organization
        let org = await OrganizationModel.findOne({ owner: userId }).populate('owner', 'username email role');
        let isOwner = !!org;

        // If not an owner, find via Referer collection
        if (!org) {
            const userReferer = await Referer.findOne({ referer: userId })
                .populate({ path: 'organization', populate: { path: 'owner', select: 'username email' } });

            if (!userReferer) {
                return res.status(404).json({ 
                    error: "You don't belong to any organization",
                    message: "You need to join or create an organization first"
                });
            }

            org = userReferer.organization;
            isOwner = false;
        }

        // Get all members of this organization via Referer
        const orgReferers = await Referer.find({ organization: org._id })
            .populate('referer', 'username email role');

        // Exclude owner from members list
        const members = orgReferers
            .filter(ref => ref.referer?._id?.toString() !== userId.toString())
            .map(ref => ({
                _id: ref.referer?._id,
                username: ref.referer?.username,
                email: ref.referer?.email,
                role: ref.referer?.role
            }));

        const ownerData = org.owner?._id
            ? { _id: org.owner._id.toString(), username: org.owner.username || "", email: org.owner.email || "" }
            : { _id: org.owner.toString(), username: "", email: "" };

        res.status(200).json({
            message: "Organization fetched successfully",
            organization: {
                _id: org._id,
                organizationName: org.organizationName,
                organizationJoinCode: org.organizationJoinCode,
                description: org.description,
                website: org.website,
                logo_url: org.logo_url,
                createdAt: org.createdAt,
                owner: ownerData,
                members,
                memberCount: members.length
            },
            userRole: isOwner ? 'owner' : 'member'
        });

    } catch (error) {
        console.error("Error fetching organization:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get organization stats for dashboard
export const getOrgStats = async (req, res) => {
    try {
        const userId = req.user._id;
        
        let org = await OrganizationModel.findOne({ owner: userId });
        if (!org) {
            const ref = await Referer.findOne({ referer: userId });
            if (ref) org = await OrganizationModel.findById(ref.organization);
        }

        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }

        const orgId = org._id;

        const memberCount = await Referer.countDocuments({ organization: orgId }) + 1; // +1 for owner
        const totalIncidents = await IncidentModel.countDocuments({ organization: orgId });
        const activeIncidents = await IncidentModel.countDocuments({ organization: orgId, status: { $ne: "closed" } });
        const resolvedIncidents = await IncidentModel.countDocuments({ organization: orgId, status: "closed" });
        const myAssignments = await IncidentModel.countDocuments({ organization: orgId, assignee: userId, status: { $ne: "closed" } });

        const recentActivities = await ActivityModel.find({ organization: orgId })
            .populate('user', 'username')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            stats: {
                memberCount,
                totalIncidents,
                activeIncidents,
                resolvedIncidents,
                myAssignments
            },
            recentActivities
        });
    } catch (error) {
        console.error("Error fetching org stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get own organization data - ONLY for users with role "organization"
export const getMyOwnOrganization = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        // Only users with role "organization" can access this route
        if (userRole !== 'organization') {
            return res.status(403).json({ 
                error: "Access denied",
                message: "This route is only available for organization users"
            });
        }

        // Find the organization where this user is the owner
        const organization = await OrganizationModel.findOne({ owner: userId })
            .populate('owner', 'username email role');

        if (!organization) {
            return res.status(404).json({ 
                error: "Organization not found",
                message: "You haven't created any organization yet"
            });
        }

        // Get all members of this organization via Referer
        const orgReferers = await Referer.find({ organization: organization._id })
            .populate('referer', 'username email role');

        // Exclude owner from members list
        const members = orgReferers
            .filter(ref => ref.referer?._id?.toString() !== userId.toString())
            .map(ref => ({
                _id: ref.referer?._id,
                username: ref.referer?.username,
                email: ref.referer?.email,
                role: ref.referer?.role
            }));

        res.status(200).json({
            message: "Organization data fetched successfully",
            organization: {
                _id: organization._id,
                organizationName: organization.organizationName,
                organizationJoinCode: organization.organizationJoinCode,
                description: organization.description,
                website: organization.website,
                logo_url: organization.logo_url,
                owner: {
                    _id: organization.owner?._id,
                    username: organization.owner?.username,
                    email: organization.owner?.email,
                    role: organization.owner?.role
                },
                members,
                memberCount: members.length
            },
            accessLevel: 'owner',
            isOwner: true
        });

    } catch (error) {
        console.error("Error fetching organization:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Create a new organization
export const createOrganization = async (req, res) => {
    try {
        const { organizationName, description } = req.body;
        const userId = req.user._id;

        if (!organizationName) {
            return res.status(400).json({ error: "Organization name is required" });
        }

        const existingOrg = await OrganizationModel.findOne({ owner: userId });
        if (existingOrg) {
            return res.status(400).json({ error: "You already own an organization" });
        }

        const joinCode = `KALKI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const newOrganization = await OrganizationModel.create({
            organizationName,
            organizationJoinCode: joinCode,
            description,
            owner: userId,
        });

        // Create a default "General" channel for the new organization
        await ChannelModel.create({
            name: "general",
            organization: newOrganization._id
        });

        await UserModel.findByIdAndUpdate(userId, { role: 'organization' });

        await logActivity({
            user: userId,
            organization: newOrganization._id,
            action: "created the organization",
            detail: `${newOrganization.organizationName} workspace initialized with #general channel`,
            type: "settings"
        });

        res.status(201).json({ 
            message: "Organization created successfully", 
            organization: newOrganization 
        });

    } catch (error) {
        console.error("Error creating organization:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const removeEmployee = async (req, res) => {
    try {
        const { userId } = req.params;

        const org = await OrganizationModel.findOne({ owner: req.user._id });
        if (!org) {
            return res.status(403).json({ error: "You do not own this organization" });
        }

        if (org.owner.toString() === userId) {
            return res.status(400).json({ error: "Cannot remove yourself" });
        }

        const removed = await Referer.findOneAndDelete({ referer: userId, organization: org._id });
        if (!removed) {
            return res.status(404).json({ error: "Employee not found in organization" });
        }

        await logActivity({
            user: req.user._id,
            organization: org._id,
            action: "removed member",
            detail: `User ${userId} removed from organization`,
            type: "member"
        });

        res.status(200).json({ message: "Employee removed successfully" });
    } catch (error) {
        console.error("Error removing employee:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateOrganization = async (req, res) => {
    try {
        const { organizationName, description, website } = req.body;
        const userId = req.user._id;

        const organization = await OrganizationModel.findOneAndUpdate(
            { owner: userId },
            { organizationName, description, website },
            { new: true }
        );

        if (!organization) {
            return res.status(404).json({ error: "Organization not found or you are not the owner" });
        }

        await logActivity({
            user: userId,
            organization: organization._id,
            action: "updated Organization Settings",
            detail: "Changed description, name, or website",
            type: "settings"
        });

        res.status(200).json({ 
            message: "Organization updated successfully", 
            organization 
        });
    } catch (error) {
        console.error("Error updating organization:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const transferOwnership = async (req, res) => {
    try {
        const { newOwnerId } = req.body;
        const userId = req.user._id;

        const org = await OrganizationModel.findOne({ owner: userId });
        if (!org) return res.status(403).json({ error: "Only the owner can transfer ownership" });

        const isMember = await Referer.exists({ referer: newOwnerId, organization: org._id });
        if (!isMember) return res.status(400).json({ error: "New owner must be a member of the organization" });

        // Update org owner
        org.owner = newOwnerId;
        await org.save();

        // Update roles
        await UserModel.findByIdAndUpdate(userId, { role: 'user' });
        await UserModel.findByIdAndUpdate(newOwnerId, { role: 'organization' });

        // Add former owner to Referer members
        await Referer.create({ referer: userId, organization: org._id });
        // Remove new owner from Referer members
        await Referer.findOneAndDelete({ referer: newOwnerId, organization: org._id });

        await logActivity({
            user: userId,
            organization: org._id,
            action: "transferred ownership",
            detail: `Ownership transferred to user ${newOwnerId}`,
            type: "settings"
        });

        res.status(200).json({ message: "Ownership transferred successfully" });
    } catch (error) {
        console.error("Error transferring ownership:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteOrganization = async (req, res) => {
    try {
        const userId = req.user._id;
        const org = await OrganizationModel.findOne({ owner: userId });
        if (!org) return res.status(403).json({ error: "Only the owner can delete the organization" });

        const orgId = org._id;

        // Delete all related data
        await Promise.all([
            Referer.deleteMany({ organization: orgId }),
            IncidentModel.deleteMany({ organization: orgId }),
            ActivityModel.deleteMany({ organization: orgId }),
            OrganizationModel.findByIdAndDelete(orgId),
            UserModel.findByIdAndUpdate(userId, { role: 'user' })
        ]);

        res.status(200).json({ message: "Organization deleted successfully" });
    } catch (error) {
        console.error("Error deleting organization:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const uploadLogo = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const userId = req.user._id;
        const org = await OrganizationModel.findOne({ owner: userId });
        if (!org) return res.status(404).json({ error: "Organization not found" });

        const logoUrl = `/uploads/${req.file.filename}`;
        org.logo_url = logoUrl;
        await org.save();

        res.json({ message: "Logo uploaded", logo_url: logoUrl });
    } catch (error) {
        console.error("Error uploading logo:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const { email_enabled, incident_events, slack_webhook_url } = req.body;

        const org = await OrganizationModel.findOne({ owner: userId });
        if (!org) return res.status(404).json({ error: "Organization not found" });

        if (email_enabled !== undefined) org.notification_settings.email_enabled = email_enabled;
        if (incident_events !== undefined) org.notification_settings.incident_events = incident_events;
        if (slack_webhook_url !== undefined) org.notification_settings.slack_webhook_url = slack_webhook_url;

        await org.save();

        res.json({ message: "Notification settings updated", notification_settings: org.notification_settings });
    } catch (error) {
        console.error("Error updating notification settings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};