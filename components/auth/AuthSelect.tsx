import * as React from "react";
import { ChevronDown } from "lucide-react";
import { authInputClasses } from "@/components/auth/AuthField";
import { cn } from "@/lib/utils";

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  placeholder?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export const AuthSelect = React.forwardRef<HTMLSelectElement, Props>(
  ({ label, error, placeholder, options, id, className, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
      <div className="space-y-1.5">
        <label htmlFor={selectId} className="block font-body text-sm font-semibold text-on-surface">
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(authInputClasses, "appearance-none pr-10 cursor-pointer", className)}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/80" aria-hidden />
        </div>
        {error && (
          <p id={errorId} role="alert" className="font-body text-xs font-medium text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthSelect.displayName = "AuthSelect";
