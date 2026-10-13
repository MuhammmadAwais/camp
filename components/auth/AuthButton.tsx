import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
  loadingText?: string;
}

// Onboarding CTAs: solid royal blue primary; white outlined secondary (social sign-in, back).
export function AuthButton({
  variant = "primary",
  isLoading = false,
  loadingText,
  disabled,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        "w-full inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3.5 font-body text-[15px] font-semibold transition-colors active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        variant === "primary" && "bg-primary text-white hover:bg-primary-hover shadow-sm",
        variant === "secondary" && "bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low",
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
