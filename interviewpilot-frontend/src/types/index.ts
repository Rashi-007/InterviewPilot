export type ApplicationStatus =
  | "applied"
  | "screening"
  | "technical"
  | "hr"
  | "offer"
  | "rejected";

export type ApplicationSource =
  | "manual"
  | "extension_linkedin"
  | "extension_indeed"
  | "extension_company_site"
  | "extension_gmail";

export interface Application {
  id: string;
  company_name: string;
  role_title: string;
  job_description: string | null;
  job_url: string | null;
  status: ApplicationStatus;
  source: ApplicationSource;
  applied_date: string;
  interview_date: string | null;
  location: string | null;
  salary_range: string | null;
  notes: string | null;
  extracted_skills: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface KPIs {
  total_applications: number;
  interviews_scheduled: number;
  avg_ai_score: string | null;
  conversion_rate: number;
  days_since_last_application: number | null;
}

export interface InterviewSession {
  id: string;
  application_id: string | null;
  role_title: string;
  session_type: "technical" | "behavioral" | "mixed";
  avg_score: number | null;
  created_at: string;
}

export interface InterviewQA {
  id: string;
  session_id: string;
  question: string;
  question_type: "technical" | "behavioral";
  user_answer: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
  model_answer: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
}

export const STATUS_COLUMNS: { key: ApplicationStatus; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "screening", label: "Screening" },
  { key: "technical", label: "Technical" },
  { key: "hr", label: "HR" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Rejected" },
];
