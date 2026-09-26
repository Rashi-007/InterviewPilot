import { NavLink } from "react-router-dom";
import { LayoutDashboard, KanbanSquare, Mic, Sparkles, Settings, Radio } from "lucide-react";
import clsx from "clsx";
import { useAppStore } from "@/store/useStore";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/applications", label: "Applications", icon: KanbanSquare },
  { to: "/mock-interview", label: "Mock Interview", icon: Mic },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const demoMode = useAppStore((s) => s.demoMode);

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col border-r border-surface-border bg-surface/40 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-gradient">
          <Radio size={16} className="text-void" strokeWidth={2.5} />
        </div>
        <span className="font-display font-semibold text-ink text-[15px]">InterviewPilot</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-signal-gradient-soft text-ink border border-signal-violet/30"
                  : "text-ink-muted hover:text-ink hover:bg-surface-raised"
              )
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <div className="glass-panel p-3 flex items-center gap-2.5">
          <span
            className={clsx(
              "h-2 w-2 rounded-full",
              demoMode ? "bg-status-hr animate-pulse" : "bg-status-offer"
            )}
          />
          <div className="text-xs">
            <p className="text-ink font-medium">{demoMode ? "Demo mode" : "Live"}</p>
            <p className="text-ink-faint">{demoMode ? "Using sample data" : "Connected to API"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
