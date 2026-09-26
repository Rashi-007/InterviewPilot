import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, LogIn } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Waveform } from "@/components/ui/Waveform";
import { api, setToken } from "@/lib/api";
import { User } from "@/types";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@interviewpilot.ai");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(result.token);
      navigate("/");
    } catch (err) {
      setError("Couldn't sign in — check the backend is running and the credentials are correct.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-signal-gradient mb-3">
            <Radio size={20} className="text-void" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-lg font-semibold text-ink">InterviewPilot AI</h1>
          <div className="mt-3">
            <Waveform size="sm" bars={5} active={false} />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-ink-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-surface-border bg-surface-raised/60 px-3 py-2.5 text-sm text-ink outline-none focus:border-signal-cyan/50"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-surface-border bg-surface-raised/60 px-3 py-2.5 text-sm text-ink outline-none focus:border-signal-cyan/50"
              required
            />
          </label>

          {error && <p className="text-xs text-status-rejected">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            <LogIn size={15} />
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-xs text-ink-faint text-center mt-5">
          Demo credentials pre-filled — just click Sign in once your backend is seeded.
        </p>
      </Card>
    </div>
  );
}
