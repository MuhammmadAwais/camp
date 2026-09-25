import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "outline" | "surface" | "success";
}

export function Badge({
  className,
  variant = "secondary",
  children,
  ...props
}: BadgeProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-xs font-semibold tracking-wide uppercase transition-colors";

  const variants = {
    primary: "bg-primary/10 text-primary border border-primary/20",
    secondary: "bg-secondary/15 text-secondary border border-secondary/30",
    outline: "border border-outline-variant text-on-surface-variant bg-transparent",
    surface: "bg-surface-container text-on-surface border border-border-card",
    success: "bg-success/15 text-success border border-success/30",
  };

  return (
    <div className={cn(base, variants[variant], className)} {...props}>
      {children}
    </div>
  );
}
