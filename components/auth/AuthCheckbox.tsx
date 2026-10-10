import * as React from "react";
import { Check } from "lucide-react";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  error?: string;
}

export const AuthCheckbox = React.forwardRef<HTMLInputElement, Props>(({ label, error, id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <label htmlFor={inputId} className="flex items-start gap-3 cursor-pointer group">
        <span className="relative mt-0.5 shrink-0">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="peer sr-only"
            {...props}
          />
          <span className="block w-5 h-5 rounded-xs border border-outline-variant bg-surface-container-lowest transition-colors group-hover:border-outline peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1 peer-aria-[invalid=true]:border-error" />
          <Check className="absolute inset-0 m-auto w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} aria-hidden />
        </span>
        <span className="font-body text-sm text-on-surface-variant leading-relaxed">{label}</span>
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-1 ml-8 font-body text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
});

AuthCheckbox.displayName = "AuthCheckbox";
