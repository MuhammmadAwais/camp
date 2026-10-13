"use client";

import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { AuthField, type AuthFieldProps } from "@/components/auth/AuthField";
import { PASSWORD_MIN_LENGTH } from "@/lib/schemas/auth-schema";
import { cn } from "@/lib/utils";

interface Props extends Omit<AuthFieldProps, "type" | "icon" | "trailing"> {
  showStrength?: boolean;
  strengthValue?: string;
}

function scorePassword(value: string): 0 | 1 | 2 | 3 | 4 {
  if (!value) return 0;
  let score = 0;
  if (value.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (value.length >= 14) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(4, Math.max(1, score)) as 1 | 2 | 3 | 4;
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"] as const;

export const PasswordField = React.forwardRef<HTMLInputElement, Props>(
  ({ showStrength = false, strengthValue = "", ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const score = scorePassword(strengthValue);

    return (
      <div className="space-y-2">
        <AuthField
          ref={ref}
          type={visible ? "text" : "password"}
          icon={<Lock className="w-4 h-4" />}
          trailing={
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="p-2 rounded-lg text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
            >
              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...props}
        />
        {showStrength && strengthValue.length > 0 && (
          <div className="flex items-center gap-2" aria-live="polite">
            <div className="flex flex-1 gap-1" aria-hidden>
              {[1, 2, 3, 4].map((bar) => (
                <span
                  key={bar}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    bar <= score ? (score <= 1 ? "bg-error" : score === 2 ? "bg-secondary" : "bg-success") : "bg-border-card"
                  )}
                />
              ))}
            </div>
            <span className="font-body text-xs font-semibold text-on-surface-variant w-14 text-right">
              {STRENGTH_LABELS[score]}
            </span>
          </div>
        )}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";
