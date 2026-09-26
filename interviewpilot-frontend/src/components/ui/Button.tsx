import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm",
        variant === "primary" &&
          "bg-signal-gradient text-void font-semibold hover:shadow-glow-violet active:scale-[0.98]",
        variant === "secondary" &&
          "bg-surface-raised border border-surface-border text-ink hover:border-signal-cyan/50",
        variant === "ghost" && "text-ink-muted hover:text-ink hover:bg-surface-raised",
        variant === "danger" &&
          "bg-status-rejected/10 text-status-rejected border border-status-rejected/30 hover:bg-status-rejected/20",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
