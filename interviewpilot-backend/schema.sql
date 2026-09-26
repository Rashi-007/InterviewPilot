-- =========================================================
-- InterviewPilot AI — Database Schema (PostgreSQL / Supabase)
-- Run this in Supabase SQL Editor, or via `psql $DATABASE_URL -f schema.sql`
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- USERS
-- Auth is handled by our own JWT layer (kept simple for the
-- demo). If you switch to Supabase Auth later, this table can
-- mirror auth.users instead.
-- ---------------------------------------------------------
create table if not exists users (
  id            uuid primary key default uuid_generate_v4(),
  email         text unique not null,
  password_hash text not null,
  full_name     text,
  resume_text   text,                 -- raw extracted resume text, used for skill matching
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------
-- APPLICATIONS
-- One row per job application. Status drives the Kanban board.
-- ---------------------------------------------------------
create type application_status as enum (
  'applied',
  'screening',
  'technical',
  'hr',
  'offer',
  'rejected'
);

create type application_source as enum (
  'manual',
  'extension_linkedin',
  'extension_indeed',
  'extension_company_site',
  'extension_gmail'
);

create table if not exists applications (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references users(id) on delete cascade,
  company_name     text not null,
  role_title       text not null,
  job_description  text,
  job_url          text,
  status           application_status not null default 'applied',
  source           application_source not null default 'manual',
  applied_date     date not null default current_date,
  interview_date   timestamptz,           -- next scheduled interview, if any
  location         text,
  salary_range     text,
  notes            text,
  extracted_skills text[],                -- filled by AI JD Analyzer
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_applications_user_id on applications(user_id);
create index if not exists idx_applications_status on applications(status);

-- ---------------------------------------------------------
-- MOCK INTERVIEW SESSIONS
-- One row per mock-interview session a user runs against an
-- application (or a generic role if no application is linked).
-- ---------------------------------------------------------
create table if not exists interview_sessions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references users(id) on delete cascade,
  application_id uuid references applications(id) on delete set null,
  role_title     text not null,
  session_type   text not null default 'mixed', -- 'technical' | 'behavioral' | 'mixed'
  avg_score      numeric(3,2),                  -- 1.00 - 5.00, filled after session ends
  created_at     timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on interview_sessions(user_id);

-- ---------------------------------------------------------
-- INTERVIEW QUESTIONS + ANSWERS + AI FEEDBACK
-- One row per Q&A turn inside a mock interview session.
-- ---------------------------------------------------------
create table if not exists interview_qa (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid not null references interview_sessions(id) on delete cascade,
  question     text not null,
  question_type text not null default 'technical', -- 'technical' | 'behavioral'
  user_answer  text,
  ai_score     numeric(2,1),        -- 1.0 - 5.0
  ai_feedback  text,
  model_answer text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_qa_session_id on interview_qa(session_id);

-- ---------------------------------------------------------
-- EXTENSION SYNC LOG
-- Audit trail of everything the browser extension pushes in
-- (job captures, Gmail-detected interviews, applied events).
-- ---------------------------------------------------------
create type sync_event_type as enum (
  'job_captured',
  'application_submitted',
  'gmail_interview_detected'
);

create table if not exists extension_sync_log (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references users(id) on delete cascade,
  event_type   sync_event_type not null,
  payload      jsonb not null,       -- raw scraped/parsed data for debugging
  application_id uuid references applications(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_sync_log_user_id on extension_sync_log(user_id);

-- ---------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

drop trigger if exists trg_applications_updated_at on applications;
create trigger trg_applications_updated_at before update on applications
  for each row execute function set_updated_at();
