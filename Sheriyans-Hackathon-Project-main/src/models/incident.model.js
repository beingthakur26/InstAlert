import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    incident_code: { type: String, unique: true, required: true, index: true, trim: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    type: { type: String, enum: ["Alert", "Bug", "Downtime", "Security", "Maintenance"], default: "Alert" },
    location: { type: String },
    assignees: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, default: "Lead" }
    }],
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["open", "in_progress", "closed", "monitoring"], default: "open", index: true },
    resolution: { type: String },

    severity_score: { type: Number, min: 1, max: 10 },
    ai_summary: { type: String },
    root_cause_suggestion: { type: String },
    auto_assigned: { type: Boolean, default: false },

    sla_deadline: { type: Date },
    sla_breached: { type: Boolean, default: false },

    tags: [{ type: String, index: true }],
    similar_incidents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Incident" }],
    postmortem: { type: mongoose.Schema.Types.ObjectId, ref: "Postmortem" },
    timeline_events: [{
        timestamp: { type: Date, default: Date.now },
        event: String,
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }],
    resolution_time: { type: Number },

    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

incidentSchema.index({ organization: 1, status: 1, createdAt: -1 });
incidentSchema.index({ organization: 1, priority: 1 });
incidentSchema.index({ organization: 1, tags: 1 });
incidentSchema.index({ reporter: 1 });

const IncidentModel = mongoose.model("Incident", incidentSchema);

export default IncidentModel;