import mongoose from 'mongoose';

const notificationChannelSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: { type: String, enum: ['slack', 'email', 'webhook'], required: true },
    config: {
        url: String,
        email: String,
        channel: String,
    },
    events: [{ type: String }],
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

notificationChannelSchema.index({ organization: 1, type: 1 });

export default mongoose.model('NotificationChannel', notificationChannelSchema);
