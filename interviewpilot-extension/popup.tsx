import { useEffect, useState } from "react";
import { api, ApiError } from "~lib/api";
import { getToken, setToken, clearToken } from "~lib/storage";
import type { KPIs, SyncStatus } from "~lib/types";
import "~style.css";

const DASHBOARD_URL = process.env.PLASMO_PUBLIC_DASHBOARD_URL || "http://localhost:5173";

function IndexPopup() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null); // null = still checking
  const [email, setEmail] = useState("demo@interviewpilot.ai");
  const [password, setPassword] = useState("demo1234");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    getToken().then((token) => setLoggedIn(!!token));
  }, []);

  useEffect(() => {
    if (loggedIn) loadData();
  }, [loggedIn]);

  async function loadData() {
    try {
      const [kpiData, statusData] = await Promise.all([
        api<KPIs>("/applications/kpis"),
        api<SyncStatus>("/extension/sync-status"),
      ]);
      setKpis(kpiData);
      setSyncStatus(statusData);
    } catch {
      // Backend unreachable — popup just shows blank stats rather than erroring loudly.
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const result = await api<{ token: string }>("/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
      });
      await setToken(result.token);
      setLoggedIn(true);
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : "Couldn't reach the backend");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSignOut() {
    await clearToken();
    setLoggedIn(false);
    setKpis(null);
    setSyncStatus(null);
  }

  async function handleSyncNow() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      // Re-inject the content scripts on the active tab to force a fresh
      // scrape — handles the case where the page loaded before login.
      await chrome.tabs.reload(tab.id);
    }
    window.close();
  }

  if (loggedIn === null) {
    return (
      <div className="popup">
        <div className="popup-loading">
          <div className="waveform">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup">
      <div className="popup-header">
        <div className="logo-badge">
          <RadioIcon />
        </div>
        <span className="brand">InterviewPilot AI</span>
      </div>

      {!loggedIn ? (
        <form onSubmit={handleLogin} className="login-form">
          <label>
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            <span>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          {loginError && <p className="error-text">{loginError}</p>}
          <button type="submit" className="btn-primary" disabled={loggingIn}>
            {loggingIn ? "Signing in..." : "Sign in"}
          </button>
        </form>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="Applications" value={kpis?.total_applications ?? "—"} />
            <StatCard label="Interviews" value={kpis?.interviews_scheduled ?? "—"} />
          </div>

          <div className="sync-status">
            <span className={`dot ${syncStatus?.last_sync ? "dot-live" : "dot-idle"}`} />
            <div>
              <p className="sync-title">
                {syncStatus?.last_sync ? "Last synced" : "No syncs yet"}
              </p>
              {syncStatus?.last_sync && (
                <p className="sync-subtitle">
                  {formatSyncEvent(syncStatus.last_sync.event_type)} ·{" "}
                  {timeAgo(syncStatus.last_sync.created_at)}
                </p>
              )}
            </div>
          </div>

          <button className="btn-secondary" onClick={handleSyncNow}>
            Rescan this page
          </button>

          <div className="popup-footer">
            <a href={DASHBOARD_URL} target="_blank" rel="noreferrer">
              Open dashboard
            </a>
            <button className="link-btn" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}

function formatSyncEvent(eventType: string): string {
  const labels: Record<string, string> = {
    job_captured: "Job captured",
    application_submitted: "Application marked",
    gmail_interview_detected: "Interview detected",
  };
  return labels[eventType] || eventType;
}

function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function RadioIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A0B0F" strokeWidth="2.5">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" strokeLinecap="round" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" strokeLinecap="round" />
      <path d="M19.1 4.9c3.9 3.9 3.9 10.3 0 14.1" strokeLinecap="round" />
    </svg>
  );
}

export default IndexPopup;
