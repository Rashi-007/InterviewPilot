import { NavLink } from "react-router-dom";
import { LayoutDashboard, KanbanSquare, Mic, Sparkles, Settings } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/applications", label: "Apps", icon: KanbanSquare },
  { to: "/mock-interview", label: "Mock", icon: Mic },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function MobileTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-surface-border bg-surface/90 backdrop-blur-xl">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            clsx(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
              isActive ? "text-signal-cyan" : "text-ink-faint"
            )
          }
        >
          <Icon size={18} strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
