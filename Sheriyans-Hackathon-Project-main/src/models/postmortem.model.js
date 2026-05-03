import mongoose from 'mongoose';

const postmortemSchema = new mongoose.Schema({
    incident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true, unique: true, index: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    what_happened: { type: String, required: true },
    why_it_happened: { type: String, required: true },
    fix_applied: { type: String, required: true },
    prevention_steps: [{ type: String, required: true }],
    impact: {
        duration: String,
        affected_users: String,
        severity: String,
    },
    timeline: [{
        timestamp: Date,
        event: String,
    }],
    lessons_learned: {
        went_well: [String],
        went_wrong: [String],
        got_lucky: [String],
    },
    action_items: [{
        action: String,
        owner: String,
        priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
        deadline: Date,
        status: { type: String, enum: ['pending', 'in_progress', 'done'], default: 'pending' },
    }],
    generated_by: { type: String, enum: ['ai', 'manual'], default: 'ai' },
    status: { type: String, enum: ['draft', 'review', 'published'], default: 'draft' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    published_at: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: false });

postmortemSchema.index({ organization: 1, status: 1, createdAt: -1 });

export default mongoose.model('Postmortem', postmortemSchema);
