import { useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, CalendarClock, Gauge, TrendingUp, Clock, ArrowUpRight, Eye } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Waveform } from "@/components/ui/Waveform";
import { useAppStore } from "@/store/useStore";

export function Overview() {
  const { applications, kpis, fetchApplications, fetchKpis, demoMode } = useAppStore();

  useEffect(() => {
    fetchApplications();
    fetchKpis();
  }, [fetchApplications, fetchKpis]);

  const recent = [...applications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const viewedJobs = applications
    .filter((app) => app.status === "viewed")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return (
    <AppShell title="Overview" subtitle="Your job search, at a glance">
      {demoMode && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-status-hr/30 bg-status-hr/10 px-4 py-2.5 text-sm text-status-hr">
          <span className="h-1.5 w-1.5 rounded-full bg-status-hr animate-pulse" />
          Showing sample data — connect the backend in Settings to sync your real applications.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard label="Total Applications" value={kpis?.total_applications ?? "—"} icon={<Briefcase size={18} />} accent="violet" />
        <KpiCard label="Interviews Scheduled" value={kpis?.interviews_scheduled ?? "—"} icon={<CalendarClock size={18} />} accent="cyan" />
        <KpiCard label="Avg AI Score" value={kpis?.avg_ai_score ? `${kpis.avg_ai_score} / 5` : "—"} icon={<Gauge size={18} />} accent="violet" />
        <KpiCard label="Conversion Rate" value={kpis ? `${kpis.conversion_rate}%` : "—"} icon={<TrendingUp size={18} />} accent="cyan" />
        <KpiCard label="Days Since Applied" value={kpis?.days_since_last_application ?? "—"} icon={<Clock size={18} />} accent="violet" />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye size={17} className="text-signal-cyan" />
            <h2 className="font-display font-semibold text-ink">Recently Viewed Jobs</h2>
          </div>
          <span className="text-xs text-ink-faint">{applications.filter((a) => a.status === "viewed").length} viewed</span>
        </div>
        {viewedJobs.length === 0 ? (
          <p className="text-sm text-ink-muted py-5 text-center">No viewed jobs yet. Open a LinkedIn or Indeed job posting with the extension enabled to capture it.</p>
        ) : (
          <div className="space-y-1">
            {viewedJobs.map((app, i) => (
              <motion.div key={app.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 hover:bg-surface-raised/60">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{app.role_title}</p>
                  <p className="text-xs text-ink-muted truncate">{app.company_name}{app.location ? ` · ${app.location}` : ""}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={app.status} />
                  {app.job_url && <a href={app.job_url} target="_blank" rel="noreferrer" aria-label={`Open ${app.company_name} job`}><ArrowUpRight size={15} className="text-ink-faint hover:text-signal-cyan" /></a>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink">Recent Activity</h2>
            <Waveform size="sm" bars={4} />
          </div>
          {recent.length === 0 ? <EmptyState /> : (
            <div className="space-y-1">
              {recent.map((app, i) => (
                <motion.div key={app.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-surface-raised/60 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-signal-gradient-soft flex items-center justify-center text-xs font-semibold text-ink shrink-0">{app.company_name.slice(0, 2).toUpperCase()}</div>
                    <div className="min-w-0"><p className="text-sm font-medium text-ink truncate">{app.role_title}</p><p className="text-xs text-ink-muted truncate">{app.company_name}</p></div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0"><StatusBadge status={app.status} /><ArrowUpRight size={14} className="text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="font-display font-semibold text-ink mb-4">Pipeline Snapshot</h2>
          <div className="space-y-3">
            {(["viewed", "applied", "screening", "technical", "hr", "offer", "rejected"] as const).map((status) => {
              const count = applications.filter((a) => a.status === status).length;
              const max = applications.length || 1;
              return <div key={status}><div className="flex justify-between text-xs mb-1"><span className="text-ink-muted capitalize">{status}</span><span className="text-ink-faint font-mono">{count}</span></div><div className="h-1.5 rounded-full bg-surface-raised overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(count / max) * 100}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full bg-signal-gradient rounded-full" /></div></div>;
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return <div className="flex flex-col items-center justify-center py-12 text-center"><div className="h-12 w-12 rounded-full bg-signal-gradient-soft flex items-center justify-center mb-3"><Briefcase size={20} className="text-signal-violet" /></div><p className="text-sm font-medium text-ink">No activity yet</p><p className="text-xs text-ink-muted mt-1">Install and sign in to the extension to auto-capture job postings.</p></div>;
}
