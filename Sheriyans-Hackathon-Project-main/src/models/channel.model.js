import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
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

const ChannelModel = mongoose.model("Channel", channelSchema);

export default ChannelModel;