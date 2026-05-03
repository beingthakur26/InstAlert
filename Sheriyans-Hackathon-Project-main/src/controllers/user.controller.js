import OrganizationModel from "../models/organization.model.js"
import RefererModel from "../models/referer.model.js";
import UserModel from "../models/user.model.js";
import { logActivity } from "../services/activity.service.js";

const joinOrganization = async (req, res) => {
    try {
        
        const { joinCode } = req.body;
        const userId = req.user._id; // Fixed to use _id

        if (!joinCode) {
            return res.status(400).json({ error: "Join code is required" });
        }
    
        const organization = await OrganizationModel.findOne({ organizationJoinCode: joinCode }); 
        
        if (!organization) {
                return res.status(404).json({ error: "Join code is invalid" });
        }

        const existingReferer = await RefererModel.findOne({ organization: organization._id, referer: userId });

        if (existingReferer) {
            return res.status(400).json({ error: "User is already a member of this organization" });
        }

        const referer = await RefererModel.create({
                organization: organization._id,
                referer: userId,
        });

        await logActivity({
            user: userId,
            organization: organization._id,
            action: "joined organization",
            detail: `Joined ${organization.organizationName}`,
            type: "member"
        });

        return res.status(200).json({ message: "Successfully joined organization", referer });
    } catch (error) {
        console.error("Error joining organization:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({ error: "Username and email are required" });
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { username, email },
            { new: true }
        ).select("-password");

        res.status(200).json({ 
            message: "Profile updated successfully", 
            user: updatedUser 
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: "Username or email already exists" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}

export default {
    joinOrganization,
    updateProfile
}