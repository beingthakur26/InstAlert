import mongoose from 'mongoose';

const slaBreachSchema = new mongoose.Schema({
    incident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true, index: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    breach_type: { type: String, enum: ['response', 'resolution'], required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
    sla_target_minutes: { type: Number, required: true },
    actual_minutes: { type: Number, required: true },
    breached_at: { type: Date, default: Date.now },
    notified: { type: Boolean, default: false },
}, { timestamps: true });

slaBreachSchema.index({ organization: 1, breached_at: -1 });

export default mongoose.model('SLABreach', slaBreachSchema);
