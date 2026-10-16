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
  "w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 font-body text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-colors focus:outline-none focus:border-[#8C383E] focus:ring-1 focus:ring-[#8C383E] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] aria-[invalid=true]:border-[#BA1A1A] aria-[invalid=true]:focus:ring-[#BA1A1A]/20 shadow-2xs";

// Labelled text input with hint and an accessible error bound via aria-describedby.
export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, hint, icon, trailing, id, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className="space-y-1.5 w-full">
        <label htmlFor={inputId} className="block font-body text-sm font-medium text-[#374151]">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400" aria-hidden>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(authInputClasses, icon && "pl-9", trailing && "pr-11", className)}
            {...props}
          />
          {trailing && <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span>}
        </div>
        {hint && !error && (
          <p id={hintId} className="font-body text-xs text-gray-500 leading-relaxed">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="font-body text-xs font-medium text-[#BA1A1A]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthField.displayName = "AuthField";
