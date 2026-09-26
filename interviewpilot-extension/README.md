# InterviewPilot AI — Browser Extension

Plasmo (Manifest V3) extension that auto-captures job postings, detects
form-submission "Applied" events, and scans Gmail for interview invites —
syncing all of it into your InterviewPilot AI backend.

## Setup

```bash
npm install
cp .env.example .env.development
```

`.env.development` defaults to `http://localhost:5000/api` for the backend
and `http://localhost:5173` for the dashboard link — adjust if yours run
elsewhere.

```bash
npm run dev
```

This builds the extension into `build/chrome-mv3-dev` and watches for changes.

## Load it into Chrome

1. Go to `chrome://extensions`
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `build/chrome-mv3-dev` folder
5. The extension icon should appear in your toolbar

## Connect it to your backend (important)

Chrome assigns your extension a random ID when loaded unpacked. Copy it:

1. On `chrome://extensions`, find "InterviewPilot AI" and copy the ID shown
   underneath it (looks like `abcdefghijklmnopabcdefghijklmnop`)
2. In your **backend's** `.env`, update `ALLOWED_ORIGINS` to include
   `chrome-extension://<that-id>`, comma-separated with the existing values
3. Restart the backend (`npm run dev`)

Without this, the extension's requests will be blocked by CORS — the
background service worker will show "Couldn't reach the backend" style
errors even though the backend is running fine.

## Sign in

Click the extension icon → sign in with the same credentials you use on
the dashboard (demo: `demo@interviewpilot.ai` / `demo1234`). The JWT is
stored in `chrome.storage.local`, separate from the dashboard's
`localStorage` token — they're independent logins hitting the same backend.

## What each piece does

| File | Runs on | Does |
|---|---|---|
| `contents/linkedin.ts` | LinkedIn job pages | Scrapes title/company/location/JD, detects Easy Apply confirmation |
| `contents/indeed.ts` | Indeed job pages | Same, using Indeed's DOM structure |
| `contents/generic-jobposting.ts` | Every page (filtered) | Looks for schema.org `JobPosting` JSON-LD — catches most ATS-hosted company career pages (Greenhouse, Lever, Workday, etc.) without per-site selectors. Also has a generic form-submit heuristic for "Apply" buttons. |
| `contents/gmail.ts` | mail.google.com | Watches the open email for interview-related keywords, pulls a date from the subject/body and a company name from the sender's domain |
| `background.ts` | Always (service worker) | The only place holding the JWT — receives messages from content scripts and makes the actual API calls |
| `popup.tsx` | Extension popup | Login, KPI snapshot, last-sync indicator, manual rescan, sign out |

## Known limitations (worth knowing for a demo/workshop)

- **Gmail date parsing** is deliberately simple (regex on month names) —
  covers common phrasings like "March 14" but won't catch every format.
  A production version would use a proper date-parsing library.
- **Generic company-site detection** relies on the site publishing
  schema.org `JobPosting` structured data. Most ATS-hosted career pages
  do this (it's how Google Jobs indexes them), but a fully custom
  careers page with no structured data won't be picked up — LinkedIn and
  Indeed are covered by their own dedicated scrapers regardless.
- **"Applied" detection on external company sites** uses a fuzzy
  form-submit heuristic (button text contains "apply"/"submit
  application"). It can miss non-standard apply flows (e.g. multi-step
  wizards with a differently worded final button).
- The extension currently requests broad host permissions (`https://*/*`)
  so the generic detector can run anywhere. For an actual Chrome Web
  Store submission, you'd want to narrow this and explain the broad
  permission in the store listing, or scope it to a curated list of known
  ATS domains instead.

## Building for release

```bash
npm run build      # production build
npm run package    # zips build/chrome-mv3-prod into a .zip for the Chrome Web Store
```
