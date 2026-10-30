import { useNavigate } from "react-router-dom";
import { Puzzle, Key, LogOut, LogIn, CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useStore";
import { clearToken } from "@/lib/api";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://interviewpilot-backend-syly.onrender.com";

export function Settings() {
  const demoMode = useAppStore((s) => s.demoMode);
  const navigate = useNavigate();

  return (
    <AppShell title="Settings" subtitle="Account, API, and extension sync">
      <div className="max-w-2xl space-y-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} className="text-signal-violet" />
            <h2 className="font-display font-semibold text-ink">Backend Connection</h2>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-surface-border px-4 py-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              {demoMode ? (
                <>
                  <XCircle size={15} className="text-status-hr" />
                  <span className="text-ink">Not connected — showing demo data</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} className="text-status-offer" />
                  <span className="text-ink">Connected</span>
                </>
              )}
            </div>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-ink-muted">API Base URL</span>
            <input
              value={API_URL}
              readOnly
              className="mt-1.5 w-full rounded-lg border border-surface-border bg-surface-raised/60 px-3 py-2.5 text-sm text-ink font-mono outline-none"
            />
          </label>
          <p className="text-xs text-ink-faint mt-2">
            API requests are sent directly to your configured backend server.
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Puzzle size={16} className="text-signal-cyan" />
            <h2 className="font-display font-semibold text-ink">Browser Extension</h2>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-surface-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <XCircle size={15} className="text-ink-faint" />
              <span className="text-ink-muted">Extension not detected</span>
            </div>
            <span className="text-xs text-ink-faint">Load unpacked in chrome://extensions</span>
          </div>
          <p className="text-xs text-ink-faint mt-3">
            Once installed, the extension will auto-capture job postings and sync interview
            emails detected in Gmail. Sync status will appear here.
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-ink mb-1">Demo Account</h2>
              <p className="text-xs text-ink-muted">demo@interviewpilot.ai</p>
            </div>
            {demoMode ? (
              <Button variant="secondary" onClick={() => navigate("/login")}>
                <LogIn size={15} />
                Sign in
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => {
                  clearToken();
                  navigate("/login");
                }}
              >
                <LogOut size={15} />
                Sign out
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
