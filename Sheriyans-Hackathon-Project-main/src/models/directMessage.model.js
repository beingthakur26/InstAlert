import mongoose from "mongoose";

const directMessageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

directMessageSchema.index({ sender: 1, receiver: 1, organization: 1 });
const DirectMessageModel = mongoose.model("DirectMessage", directMessageSchema);

export default DirectMessageModel;