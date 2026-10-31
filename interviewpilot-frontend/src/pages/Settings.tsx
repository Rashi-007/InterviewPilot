import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Puzzle, Key, LogOut, LogIn, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useStore";
import { clearToken } from "@/lib/api";

const API_URL = import.meta.env.VITE_API_URL || "https://interviewpilot-backend-syly.onrender.com";
const EXTENSION_ID = "bfiicleboboajnioeclhcgoccbgogoek";

export function Settings() {
  const demoMode = useAppStore((s) => s.demoMode);
  const navigate = useNavigate();
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [checkingExtension, setCheckingExtension] = useState(true);

  useEffect(() => {
    let active = true;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (event.data?.type !== "INTERVIEWPILOT_EXTENSION_PONG") return;
      if (event.data.extensionId !== EXTENSION_ID) return;
      if (active) {
        setExtensionDetected(true);
        setCheckingExtension(false);
      }
    };

    window.addEventListener("message", onMessage);
    const ping = () => window.postMessage({ type: "INTERVIEWPILOT_EXTENSION_PING" }, window.location.origin);
    ping();
    const retry = window.setInterval(ping, 1500);
    const timeout = window.setTimeout(() => { if (active) setCheckingExtension(false); }, 6000);

    return () => {
      active = false;
      window.removeEventListener("message", onMessage);
      window.clearInterval(retry);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <AppShell title="Settings" subtitle="Account, API, and extension sync">
      <div className="max-w-2xl space-y-6">
        <Card>
          <div className="flex items-center gap-2 mb-4"><Key size={16} className="text-signal-violet" /><h2 className="font-display font-semibold text-ink">Backend Connection</h2></div>
          <div className="flex items-center justify-between rounded-lg border border-surface-border px-4 py-3 mb-4"><div className="flex items-center gap-2 text-sm">{demoMode ? <><XCircle size={15} className="text-status-hr" /><span className="text-ink">Not connected — showing demo data</span></> : <><CheckCircle2 size={15} className="text-status-offer" /><span className="text-ink">Connected</span></>}</div></div>
          <label className="block"><span className="text-xs font-medium text-ink-muted">API Base URL</span><input value={API_URL} readOnly className="mt-1.5 w-full rounded-lg border border-surface-border bg-surface-raised/60 px-3 py-2.5 text-sm text-ink font-mono outline-none" /></label>
          <p className="text-xs text-ink-faint mt-2">API requests are sent directly to your configured backend server.</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4"><Puzzle size={16} className="text-signal-cyan" /><h2 className="font-display font-semibold text-ink">Browser Extension</h2></div>
          <div className="flex items-center justify-between rounded-lg border border-surface-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              {extensionDetected ? <><CheckCircle2 size={15} className="text-status-offer" /><span className="text-ink">Extension detected</span></> : checkingExtension ? <><RefreshCw size={15} className="animate-spin text-signal-cyan" /><span className="text-ink-muted">Checking extension…</span></> : <><XCircle size={15} className="text-ink-faint" /><span className="text-ink-muted">Extension not detected</span></>}
            </div>
            {!extensionDetected && <span className="text-xs text-ink-faint">Enable InterviewPilot AI in Chrome</span>}
          </div>
          <p className="text-xs text-ink-faint mt-3">The dashboard checks for the installed InterviewPilot AI extension. Sign in separately in the extension popup to enable job capture and sync.</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between"><div><h2 className="font-display font-semibold text-ink mb-1">Demo Account</h2><p className="text-xs text-ink-muted">demo@interviewpilot.ai</p></div>
            {demoMode ? <Button variant="secondary" onClick={() => navigate("/login")}><LogIn size={15} />Sign in</Button> : <Button variant="ghost" onClick={() => { clearToken(); navigate("/login"); }}><LogOut size={15} />Sign out</Button>}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
