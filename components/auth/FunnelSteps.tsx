import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_STEPS = [
  { id: "vehicle", label: "Vehicle" },
  { id: "account", label: "Account" },
  { id: "verify", label: "Verify" },
  { id: "identity", label: "Identity" },
] as const;

export type FunnelStepId = (typeof ALL_STEPS)[number]["id"];

interface Props {
  current: FunnelStepId;
  hasVehicle?: boolean;
}

// Onboarding breadcrumb: adapts dynamically based on whether a VIN was entered first.
export function FunnelSteps({ current, hasVehicle = false }: Props) {
  // If the user didn't enter a vehicle first (or is registering directly/as dealer),
  // omit the "Vehicle" step so it isn't falsely shown as completed.
  const steps = hasVehicle
    ? ALL_STEPS
    : ALL_STEPS.filter((s) => s.id !== "vehicle");

  const currentIndex = steps.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Onboarding progress" className="w-full overflow-x-auto scrollbar-none py-1">
      <ol className="flex items-center gap-1.5 sm:gap-2 min-w-max">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step.id} className="flex items-center gap-1.5 sm:gap-2" aria-current={isCurrent ? "step" : undefined}>
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center font-body text-xs font-bold shrink-0 transition-colors",
                    isCurrent && "bg-[#008C87] text-white",
                    isDone && "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300",
                    !isCurrent && !isDone && "bg-gray-100 text-gray-400"
                  )}
                >
                  {isDone ? <Check className="w-3 h-3" strokeWidth={3} aria-hidden /> : index + 1}
                </span>
                <span
                  className={cn(
                    "font-body text-xs sm:text-sm whitespace-nowrap",
                    isCurrent ? "font-semibold text-gray-900" : "font-medium",
                    isDone && "text-gray-600",
                    !isCurrent && !isDone && "text-gray-400",
                    !isCurrent && "hidden sm:inline"
                  )}
                >
                  {step.label}
                </span>
                <span className="sr-only">{isDone ? "(completed)" : isCurrent ? "(current step)" : "(not started)"}</span>
              </span>
              {index < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
