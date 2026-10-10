"use client";

import * as React from "react";
import { authInputClasses } from "@/components/auth/AuthField";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  label: string;
}

// Six single-digit boxes that behave like one field: typing advances, backspace retreats,
// and pasting or SMS autofill (autocomplete="one-time-code") fills every box at once.
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  describedBy,
  autoFocus,
  label,
}: Props) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focusBox = (index: number) => inputsRef.current[Math.max(0, Math.min(length - 1, index))]?.focus();

  // After a rejected code clears the boxes, put the cursor back in the first one for a quick retry.
  React.useEffect(() => {
    if (invalid && value === "") inputsRef.current[0]?.focus();
  }, [invalid, value]);

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;
    if (typed.length > 1) {
      // Autofill or paste into a single box.
      commit(typed);
      focusBox(typed.length);
      return;
    }
    const next = digits.slice();
    next[index] = typed;
    commit(next.join(""));
    focusBox(index + 1);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = digits.slice();
      if (next[index]) {
        next[index] = "";
      } else if (index > 0) {
        next[index - 1] = "";
        focusBox(index - 1);
      }
      onChange(next.join("").slice(0, length));
    } else if (event.key === "ArrowLeft") {
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      focusBox(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    commit(pasted);
    focusBox(pasted.length);
  };

  return (
    <div role="group" aria-label={label} aria-describedby={describedBy} className="flex justify-between gap-2 sm:gap-2.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(authInputClasses, "min-w-0 aspect-square max-w-14 px-0 py-0 text-center font-mono text-xl font-semibold")}
        />
      ))}
    </div>
  );
}
