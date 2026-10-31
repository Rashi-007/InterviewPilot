import { ApplicationStatus } from "@/types";

const CONFIG: Record<ApplicationStatus, { label: string; text: string; bg: string; dot: string }> = {
  viewed: { label: "Viewed", text: "text-signal-cyan", bg: "bg-signal-cyan/10", dot: "bg-signal-cyan" },
  applied: { label: "Applied", text: "text-ink-muted", bg: "bg-white/5", dot: "bg-ink-muted" },
  screening: { label: "Screening", text: "text-signal-cyan", bg: "bg-signal-cyan/10", dot: "bg-signal-cyan" },
  technical: { label: "Technical", text: "text-signal-violet", bg: "bg-signal-violet/10", dot: "bg-signal-violet" },
  hr: { label: "HR", text: "text-status-hr", bg: "bg-status-hr/10", dot: "bg-status-hr" },
  offer: { label: "Offer", text: "text-status-offer", bg: "bg-status-offer/10", dot: "bg-status-offer" },
  rejected: { label: "Rejected", text: "text-status-rejected", bg: "bg-status-rejected/10", dot: "bg-status-rejected" },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const c = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
