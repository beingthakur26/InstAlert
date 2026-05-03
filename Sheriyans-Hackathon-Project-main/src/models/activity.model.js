import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    action: { type: String, required: true },
    detail: { type: String },
    incident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', index: true },
    type: { type: String, enum: ['incident', 'member', 'settings', 'chat', 'postmortem', 'sla', 'runbook'] },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

activitySchema.index({ organization: 1, createdAt: -1 });
activitySchema.index({ incident: 1, createdAt: -1 });

const ActivityModel = mongoose.model('Activity', activitySchema);
export default ActivityModel;