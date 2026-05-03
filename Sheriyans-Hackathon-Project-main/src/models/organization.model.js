import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
    organizationName: { type: String, required: true, trim: true },
    organizationJoinCode: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },
    description: { type: String, default: "" },
    website: { type: String, default: "" },
    logo_url: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscription_tier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    max_members: { type: Number, default: 3 },
    notification_settings: {
        slack_webhook_url: String,
        email_enabled: { type: Boolean, default: true },
        incident_events: { type: [String], default: ['created', 'status_changed', 'resolved', 'sla_breach'] },
    },
    ai_usage_limit: { type: Number, default: 100 },
    ai_usage_count: { type: Number, default: 0 },
}, { timestamps: true });

organizationSchema.index({ owner: 1 });
organizationSchema.index({ slug: 1 });

const OrganizationModel = mongoose.model('Organization', organizationSchema);

export default OrganizationModel;