# InterviewPilot AI — Frontend

React + Vite + TypeScript dashboard. Dark glassmorphism UI with a
violet→cyan "signal" gradient as the visual identity — the waveform motif
(`components/ui/Waveform.tsx`) is the signature element, used for loading
states, AI "thinking" moments, and the mock interview flow.

## Setup

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. API calls to `/api/*` are proxied to
`http://localhost:5000` (see `vite.config.ts`) — so run the backend first
for live data.

## Demo mode

If the backend isn't running or a request fails, the app **automatically
falls back to bundled demo data** (`src/data/mockData.ts`) instead of
showing errors — you'll see a small "Demo mode" indicator in the sidebar
and a banner on the Overview page. This means the whole dashboard, Kanban
board, and mock interview flow are explorable even before your backend
and database are fully wired up.

Once the backend responds successfully, it switches to live data
automatically — no config needed.

## Structure

```
src/
  components/
    ui/          Reusable primitives — Card, Button, StatusBadge, Waveform, KpiCard
    layout/       Sidebar, Topbar, AppShell, MobileTabBar
    AddApplicationModal.tsx
  pages/          One file per dashboard section (Overview, Applications, MockInterview, Insights, Settings)
  store/          Zustand store — applications, KPIs, demo-mode fallback logic
  lib/api.ts      Fetch wrapper — attaches JWT, throws ApiError on failure
  data/mockData.ts  Demo data mirroring the backend's seed script
  types/          Mirrors backend's src/types/index.ts — keep in sync
```

## Design tokens

Defined in `tailwind.config.js` under `theme.extend`:
- `signal.violet` / `signal.cyan` — the two-color gradient used throughout
- `void` / `surface` — background layers (glass panels use `surface` at 70% opacity + backdrop blur)
- `status.*` — one color per Kanban column (applied/screening/technical/hr/offer/rejected)
- Fonts: Space Grotesk (display/headings), Inter (body), JetBrains Mono (scores, dates, data)

## Connecting to the real backend

1. Make sure the backend is running (`npm run dev` in `interviewpilot-backend`) on port 5000.
2. Log in via the backend's `/api/auth/login` (demo: `demo@interviewpilot.ai` / `demo1234`) —
   a simple login screen isn't wired into the router yet; for now you can get a token via
   curl/Postman and run `localStorage.setItem('ip_token', '<token>')` in the browser console,
   or ask me to build out the Login page next.
3. Refresh — the sidebar indicator should flip from "Demo mode" to "Live".
