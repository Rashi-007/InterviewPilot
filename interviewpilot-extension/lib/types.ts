export interface Application {
  id: string;
  company_name: string;
  role_title: string;
  status: string;
  job_url: string | null;
}

export interface JobCapturePayload {
  company_name: string;
  role_title: string;
  job_description?: string;
  job_url: string;
  location?: string;
  source: "extension_linkedin" | "extension_indeed" | "extension_company_site";
}

export interface ApplicationSubmittedPayload {
  job_url: string;
}

export interface GmailInterviewPayload {
  company_name: string;
  role_title?: string;
  interview_date: string;
  email_subject?: string;
  email_snippet?: string;
}

export interface SyncStatus {
  last_sync: { event_type: string; created_at: string } | null;
  connected: boolean;
}

export interface KPIs {
  total_applications: number;
  interviews_scheduled: number;
  avg_ai_score: string | null;
  conversion_rate: number;
  days_since_last_application: number | null;
}

// Messages passed from content scripts -> background service worker.
// The background script is the only place that holds the JWT and talks
// to the backend, so content scripts just describe what they saw.
export type ExtensionMessage =
  | { type: "JOB_CAPTURED"; payload: JobCapturePayload }
  | { type: "APPLICATION_SUBMITTED"; payload: ApplicationSubmittedPayload }
  | { type: "GMAIL_INTERVIEW_DETECTED"; payload: GmailInterviewPayload };

export interface MessageResult {
  ok: boolean;
  error?: string;
}
