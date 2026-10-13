import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
}

export function FormAlert({ tone, children, className }: Props) {
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border-l-4 px-4 py-3 font-body text-sm leading-relaxed",
        tone === "error" && "border-error bg-error-container/50 text-on-error-container",
        tone === "success" && "border-success bg-success/10 text-on-surface",
        tone === "info" && "border-primary bg-primary/10 text-on-surface",
        className
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5 shrink-0 mt-px",
          tone === "error" && "text-error",
          tone === "success" && "text-success",
          tone === "info" && "text-primary"
        )}
        aria-hidden
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
