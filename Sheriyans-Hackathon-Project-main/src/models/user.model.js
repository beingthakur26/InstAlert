import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
        type: String,
        required: true,
        enum: ["admin", "owner", "responder", "viewer"],
        default: "viewer",
    },
    avatar: { type: String },
    skills: [{ type: String }],
    incident_history: [{
        incident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident" },
        role: String,
        resolved_at: Date,
    }],
    last_login: { type: Date },
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            slack: { type: Boolean, default: false },
        },
    },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;