export interface Assignee {
  user: {
    _id: string;
    username: string;
    email: string;
  };
  role: string;
}

export interface Incident {
  _id: string;
  incident_code?: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  type: "Alert" | "Bug" | "Downtime" | "Security" | "Maintenance";
  status: "open" | "in_progress" | "closed" | "monitoring";
  location?: string;
  tags?: string[];
  assignees: Assignee[];
  reporter: {
    _id: string;
    username: string;
    email: string;
  };
  resolution?: string;
  resolution_time?: number;
  sla_breached?: boolean;
  timeline_events?: Array<{
    event: string;
    timestamp: string;
  }>;
  ai_summary?: string;
  root_cause_suggestion?: string;
  similar_incidents?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  action: string;
  detail?: string;
  type: string;
  incident?: string;
  organization: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  content: string;
  sender: string;
  senderId: string;
  createdAt: string;
  incidentId: string;
}

export interface SeverityPrediction {
  severity_score: number;
  reasoning: string;
  confidence: number;
}

export interface SimilarIncident {
  _id: string;
  title: string;
  similarity_score: number;
}

export interface WorkloadEntry {
  name: string;
  count: number;
}
