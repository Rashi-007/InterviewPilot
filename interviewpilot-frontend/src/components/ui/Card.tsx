import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "section";
}

export function Card({ children, className, hover = false, as: Tag = "div" }: CardProps) {
  return (
    <Tag className={clsx("glass-panel p-5", hover && "glass-panel-hover", className)}>
      {children}
    </Tag>
  );
}
