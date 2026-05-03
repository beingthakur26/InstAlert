import userModel from "../models/user.model.js";
import Organization from "../models/organization.model.js";

const createOrganization = async (req, res) => {
    try {
        const { organizationName, username} = req.body;
        if (!organizationName || !username) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const user = await userModel.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        } else if (user.role === "organization") {
            return res.status(400).json({ error: "User is already an organization owner" });
        }
        user.role = "organization";
        await user.save();

        const joinCode = `KALKI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const newOrganization = await Organization.create({
            organizationName,
            organizationJoinCode: joinCode,
            owner: user._id,
        });

        res.status(201).json({ message: "Organization created successfully", organization: newOrganization });
    } catch (error) {
        console.error("Error creating organization:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export default {
    createOrganization
};