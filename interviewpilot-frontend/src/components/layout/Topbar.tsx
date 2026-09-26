import { Search, Bell } from "lucide-react";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center justify-between border-b border-surface-border px-6 py-5 md:px-8">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised/60 px-3 py-2 text-sm text-ink-faint w-56">
          <Search size={15} />
          <span>Search applications...</span>
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-ink-muted hover:text-ink hover:border-signal-cyan/40 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <div className="h-9 w-9 rounded-full bg-signal-gradient flex items-center justify-center text-void text-xs font-semibold">
          PS
        </div>
      </div>
    </header>
  );
}
