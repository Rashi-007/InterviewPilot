import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card } from "./Card";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  accent?: "violet" | "cyan";
}

export function KpiCard({ label, value, icon, trend, accent = "violet" }: KpiCardProps) {
  return (
    <Card hover className="relative overflow-hidden">
      <div
        className={`absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-20 ${
          accent === "violet" ? "bg-signal-violet" : "bg-signal-cyan"
        }`}
      />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs text-ink-muted font-medium uppercase tracking-wide">{label}</p>
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-3xl font-display font-semibold text-ink"
          >
            {value}
          </motion.p>
          {trend && <p className="mt-1 text-xs text-ink-faint">{trend}</p>}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            accent === "violet" ? "bg-signal-violet/10 text-signal-violet" : "bg-signal-cyan/10 text-signal-cyan"
          }`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
