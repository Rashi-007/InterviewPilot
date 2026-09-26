# InterviewPilot AI — Backend

Express + TypeScript API for the InterviewPilot AI job tracker. Serves both
the web dashboard and the browser extension over the same JWT-authenticated
REST API.

## Stack
- Node.js + Express + TypeScript
- Supabase, accessed over its **HTTPS REST API** (`@supabase/supabase-js`), not a
  raw Postgres connection — see "Why REST instead of a direct connection" below
- JWT auth (`jsonwebtoken` + `bcryptjs`)
- Google Gemini API (free tier, no credit card) for all AI features (mock interview, answer scoring, JD analysis, prep plans)
- `zod` for request validation

## Why REST instead of a direct Postgres connection

Supabase normally suggests connecting with a Postgres connection string
(`postgresql://...` on port 5432 or 6543). Many networks — campus WiFi, office
firewalls, some ISPs — block outbound traffic on those database ports while
still allowing normal HTTPS (443). If your backend can't reach Supabase at all
and every connection attempt times out, that's almost always this.

This backend sidesteps it entirely by talking to Supabase's auto-generated
REST API (PostgREST) over plain HTTPS instead. Same database, same tables —
just a different wire protocol that looks like ordinary web traffic to any
firewall in between.

## 1. Setup

```bash
npm install
cp .env.template .env
```

Fill in `.env`:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Project Settings → API.
  Use the **service_role** secret key, not the anon/public one — this backend
  does its own auth and ownership checks, and needs full table access. Never
  expose this key to the frontend or browser extension.
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — free, no credit card: go to https://aistudio.google.com/apikey, sign in with a Google account, and click "Create API Key"
- `ALLOWED_ORIGINS` — include your frontend's dev URL and the extension's
  `chrome-extension://<id>` origin once you load the extension (Chrome assigns
  the ID when you load it unpacked — copy it from `chrome://extensions`)

## 2. Create the database schema

Paste `schema.sql` into the Supabase SQL Editor (Project → SQL Editor → New
query) and click Run. This creates all tables, enums, and indexes once.

## 3. Seed demo data (optional but recommended for the workshop demo)

```bash
npm run seed
```

Creates a demo user (`demo@interviewpilot.ai` / `demo1234`) with 8 sample
applications across every Kanban status, 3 mock interview sessions with AI
feedback, 2 simulated Gmail-detected interviews, and a sample resume for
skill-matching demos.

## 4. Run the server

```bash
npm run dev      # ts-node + nodemon, auto-restarts on changes
# or
npm run build && npm start   # compiled production run
```

Server starts on `http://localhost:5000` (or `PORT` from `.env`).
Check it's alive: `GET /api/health`.

## API Reference

All routes except `/api/auth/*` and `/api/health` require:
`Authorization: Bearer <token>`

### Auth
| Method | Route | Body |
|---|---|---|
| POST | `/api/auth/register` | `{ email, password, full_name? }` |
| POST | `/api/auth/login` | `{ email, password }` |

### Applications (Kanban / table)
| Method | Route | Notes |
|---|---|---|
| GET | `/api/applications` | Query params: `status`, `company`, `search`, `sortBy`, `sortDir` |
| GET | `/api/applications/kpis` | Dashboard KPI cards |
| GET | `/api/applications/:id` | Single application |
| POST | `/api/applications` | Manual add |
| PATCH | `/api/applications/:id` | Edit fields — also how Kanban drag-and-drop updates `status` |
| DELETE | `/api/applications/:id` | |

### AI
| Method | Route | Notes |
|---|---|---|
| POST | `/api/ai/mock-interview/start` | `{ role_title, application_id?, session_type, question_count }` — creates session + questions |
| POST | `/api/ai/mock-interview/:qaId/answer` | `{ answer }` — scores one answer |
| POST | `/api/ai/mock-interview/:sessionId/finish` | Averages the session's scores |
| POST | `/api/ai/analyze-jd` | `{ application_id }` — JD skill extraction + resume match |
| POST | `/api/ai/prep-plan` | `{ application_id }` — 5 likely questions + prep tips |

### Extension sync
| Method | Route | Called by |
|---|---|---|
| POST | `/api/extension/job-captured` | Content script, on page scrape |
| POST | `/api/extension/application-submitted` | Content script, on form submit detection |
| POST | `/api/extension/gmail-interview-detected` | Background worker, on Gmail parse |
| GET | `/api/extension/sync-status` | Popup UI, "last synced" indicator |

## Folder structure

```
src/
  config/      env loading, Supabase REST client (config/supabase.ts)
  middleware/  JWT auth guard
  routes/      one file per resource (auth, applications, ai, extension)
  services/    business logic — Gemini AI wrapper, password/JWT helpers
  types/       shared TypeScript interfaces (mirrors schema.sql)
  utils/       seed.ts — demo data generator
schema.sql     full Postgres schema, run once in Supabase's SQL Editor
```

## Notes for the extension team
- CORS is locked to `ALLOWED_ORIGINS` — add the extension's origin there.
- The extension should store the JWT from `/api/auth/login` in
  `chrome.storage.local` and attach it as `Authorization: Bearer <token>`
  on every request to `/api/extension/*`.
- `job-captured` is idempotent per `job_url` per user — safe to call every
  time the content script re-scrapes the same tab.
