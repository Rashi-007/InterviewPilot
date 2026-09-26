import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Target, Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/store/useStore";

const SKILL_GAP_DEMO = [
  { skill: "System Design", frequency: 6, matched: true },
  { skill: "PostgreSQL", frequency: 5, matched: true },
  { skill: "GraphQL", frequency: 4, matched: false },
  { skill: "Kubernetes", frequency: 3, matched: false },
  { skill: "TypeScript", frequency: 7, matched: true },
];

export function Insights() {
  const applications = useAppStore((s) => s.applications);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(t);
  }, []);

  const activeCompanies = applications.filter((a) => a.status !== "rejected").slice(0, 4);

  return (
    <AppShell title="Insights" subtitle="AI-generated tips based on your pipeline">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={16} className="text-signal-violet" />
            <h2 className="font-display font-semibold text-ink">Skill Gap Analysis</h2>
          </div>
          <p className="text-sm text-ink-muted mb-5">
            Extracted from job descriptions across your active applications, compared against your resume.
          </p>

          <div className="space-y-4">
            {SKILL_GAP_DEMO.map((s, i) => (
              <div key={s.skill}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-ink">{s.skill}</span>
                  <span className={`text-xs font-mono ${s.matched ? "text-status-offer" : "text-status-hr"}`}>
                    {s.matched ? "Matched" : "Gap"}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={loaded ? { width: `${(s.frequency / 7) * 100}%` } : {}}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className={`h-full rounded-full ${
                      s.matched ? "bg-status-offer" : "bg-status-hr"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-signal-cyan" />
            <h2 className="font-display font-semibold text-ink">Prep Tips</h2>
          </div>
          <ul className="space-y-3 text-sm text-ink-muted">
            <li className="flex gap-2">
              <span className="text-signal-cyan mt-0.5">•</span>
              Brush up on system design fundamentals — it appears in 6 of your active JDs.
            </li>
            <li className="flex gap-2">
              <span className="text-signal-cyan mt-0.5">•</span>
              You have zero GraphQL exposure in your resume but it's requested in 4 postings — consider a small project.
            </li>
            <li className="flex gap-2">
              <span className="text-signal-cyan mt-0.5">•</span>
              Your avg mock interview score is strongest on behavioral — lean into that in HR rounds.
            </li>
          </ul>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-signal-violet" />
            <h2 className="font-display font-semibold text-ink">Company Research</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeCompanies.map((app) => (
              <div key={app.id} className="rounded-lg border border-surface-border p-4">
                <p className="text-sm font-medium text-ink">{app.company_name}</p>
                <p className="text-xs text-ink-muted mt-0.5">{app.role_title}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-ink-faint">
                  <TrendingUp size={11} />
                  Prep plan available
                </div>
              </div>
            ))}
            {activeCompanies.length === 0 && (
              <p className="text-sm text-ink-muted col-span-full text-center py-6">
                No active applications to research yet.
              </p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
