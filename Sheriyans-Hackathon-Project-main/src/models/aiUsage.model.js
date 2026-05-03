import mongoose from 'mongoose';

const aiUsageSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    model: { type: String, required: true },
    tokens_used: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    endpoint: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

aiUsageSchema.index({ organization: 1, createdAt: -1 });

export default mongoose.model('AIUsage', aiUsageSchema);
