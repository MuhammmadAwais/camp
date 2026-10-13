import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "vehicle", label: "Vehicle" },
  { id: "account", label: "Account" },
  { id: "verify", label: "Verify" },
  { id: "identity", label: "Identity" },
] as const;

export type FunnelStepId = (typeof STEPS)[number]["id"];

interface Props {
  current: FunnelStepId;
}

// Seller onboarding breadcrumb: VIN → account → email/SMS codes → KYC (SRS FR-EU-01..03).
export function FunnelSteps({ current }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Seller onboarding progress">
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step.id} className="flex items-center gap-1.5 sm:gap-2" aria-current={isCurrent ? "step" : undefined}>
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center font-body text-xs font-bold shrink-0",
                    isCurrent && "bg-primary text-white",
                    isDone && "bg-success/10 text-success ring-1 ring-success/30",
                    !isCurrent && !isDone && "bg-surface-container text-outline"
                  )}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden /> : index + 1}
                </span>
                <span
                  className={cn(
                    "font-body text-sm whitespace-nowrap",
                    isCurrent ? "font-semibold text-on-surface" : "font-medium",
                    isDone && "text-on-surface-variant",
                    !isCurrent && !isDone && "text-outline",
                    !isCurrent && "hidden sm:inline"
                  )}
                >
                  {step.label}
                </span>
                <span className="sr-only">{isDone ? "(completed)" : isCurrent ? "(current step)" : "(not started)"}</span>
              </span>
              {index < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-outline shrink-0" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
