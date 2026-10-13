import * as React from "react";
import { cn } from "@/lib/utils";

export interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const authInputClasses =
  "w-full rounded-sm border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body text-[15px] text-on-surface placeholder:text-outline transition-shadow focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:bg-surface-container-low disabled:text-on-surface-variant/80 aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error/20";

// Labelled text input with hint and an accessible error bound via aria-describedby.
export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, hint, icon, trailing, id, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block font-body text-sm font-semibold text-on-surface">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-outline" aria-hidden>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(authInputClasses, icon && "pl-10", trailing && "pr-14", className)}
            {...props}
          />
          {trailing && <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span>}
        </div>
        {hint && !error && (
          <p id={hintId} className="font-body text-xs text-on-surface-variant/80 leading-relaxed">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="font-body text-xs font-medium text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthField.displayName = "AuthField";
