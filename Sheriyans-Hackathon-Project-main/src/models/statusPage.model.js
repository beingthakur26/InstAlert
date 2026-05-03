import mongoose from 'mongoose';

const statusPageSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    description: { type: String },
    components: [{
        name: String,
        status: { type: String, enum: ['operational', 'degraded', 'partial_outage', 'major_outage'], default: 'operational' },
        description: String,
    }],
    incidents: [{
        incident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
        title: String,
        status: { type: String, enum: ['investigating', 'identified', 'monitoring', 'resolved'], default: 'investigating' },
        created_at: Date,
        resolved_at: Date,
    }],
    is_public: { type: Boolean, default: true },
    custom_domain: String,
    theme: {
        primary_color: { type: String, default: '#37322F' },
        logo_url: String,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: false });

export default mongoose.model('StatusPage', statusPageSchema);
