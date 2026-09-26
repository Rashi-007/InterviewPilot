// ==========================================================
// Shared type definitions — mirror the Postgres schema.sql
// Keep these in sync with the frontend's /src/types too.
// ==========================================================

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

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  resume_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface Application {
  id: string;
  user_id: string;
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

export interface InterviewSession {
  id: string;
  user_id: string;
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

export type SyncEventType =
  | "job_captured"
  | "application_submitted"
  | "gmail_interview_detected";

export interface ExtensionSyncLog {
  id: string;
  user_id: string;
  event_type: SyncEventType;
  payload: Record<string, unknown>;
  application_id: string | null;
  created_at: string;
}

// ---- AI service response shapes ----

export interface AIGeneratedQuestion {
  question: string;
  type: "technical" | "behavioral";
}

export interface AIAnswerEvaluation {
  score: number; // 1-5
  feedback: string;
  model_answer: string;
}

export interface AIJDAnalysis {
  key_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  match_percentage: number;
}

export interface AIPrepPlan {
  likely_questions: string[];
  prep_tips: string[];
}
