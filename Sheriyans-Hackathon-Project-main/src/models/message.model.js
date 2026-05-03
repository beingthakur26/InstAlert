import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    senderName: {
        type: String,
    },
    isAi: {
        type: Boolean,
        default: false,
    },
    incident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Incident",
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

messageSchema.index({ incident: 1, createdAt: -1 });
messageSchema.index({ channel: 1, createdAt: -1 });
const MessageModel = mongoose.model("Message", messageSchema);

export default MessageModel;