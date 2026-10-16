import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
  loadingText?: string;
}

// Onboarding CTAs: Autumn Editorial Terracotta Wine (#8C383E) primary; clean outlined secondary.
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
        "w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-body text-sm font-semibold transition-all duration-150 active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variant === "primary" &&
          "bg-[#8C383E] text-white hover:bg-[#752B30] focus-visible:ring-[#8C383E] shadow-sm",
        variant === "secondary" &&
          "bg-white border border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] focus-visible:ring-gray-300 shadow-2xs",
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
