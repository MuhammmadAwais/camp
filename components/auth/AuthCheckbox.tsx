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
      <label htmlFor={inputId} className="flex items-start gap-3 cursor-pointer group select-none">
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
          <span className="block w-4.5 h-4.5 rounded border border-[#D1D5DB] bg-white transition-colors group-hover:border-[#9CA3AF] peer-checked:bg-[#008C87] peer-checked:border-[#008C87] peer-focus-visible:ring-2 peer-focus-visible:ring-[#008C87]/40 peer-focus-visible:ring-offset-1 peer-aria-[invalid=true]:border-[#BA1A1A]" />
          <Check className="absolute inset-0 m-auto w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} aria-hidden />
        </span>
        <span className="font-body text-xs sm:text-sm text-gray-600 leading-relaxed">{label}</span>
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-1 ml-7 font-body text-xs font-medium text-[#BA1A1A]">
          {error}
        </p>
      )}
    </div>
  );
});

AuthCheckbox.displayName = "AuthCheckbox";
