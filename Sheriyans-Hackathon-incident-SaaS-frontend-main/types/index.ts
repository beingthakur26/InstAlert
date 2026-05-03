export interface User {
  _id: string;
  username: string;
  email: string;
  role: "admin" | "owner" | "responder" | "viewer" | "organization";
  avatar?: string;
  skills?: string[];
  github_username?: string;
  createdAt: string;
}

export interface Member {
  _id: string;
  username: string;
  email: string;
  role: string;
}

export interface Organization {
  _id: string;
  organizationName: string;
  organizationJoinCode: string;
  description?: string;
  website?: string;
  logo_url?: string;
  owner: User;
  members: Member[];
  notification_settings?: {
    email_enabled?: boolean;
    incident_events?: string[];
    slack_webhook_url?: string;
  };
  createdAt: string;
}

export type {
  Assignee,
  Incident,
  Activity,
  Message,
  SeverityPrediction,
  SimilarIncident,
  WorkloadEntry,
} from "./incident";
