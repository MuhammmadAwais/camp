"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Loader2, ShieldAlert } from "lucide-react";
import { useKycStatus } from "@/hooks/useKyc";
import type { KycStatus } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

interface Props {
  initialStatus: KycStatus;
}

// FR-EU-02 / BR-01 gate: listing stays locked until identity is VERIFIED.
export function KycStatusBanner({ initialStatus }: Props) {
  const { data } = useKycStatus();
  const status = data?.status ?? initialStatus;

  if (status === "VERIFIED") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] px-4 py-3 font-body text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 transition-colors">
        <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-semibold text-emerald-950 dark:text-emerald-200">Government Identity Verified</span>
          <span className="text-gray-400 dark:text-white/20 hidden sm:inline">•</span>
          <span className="text-emerald-800/80 dark:text-emerald-300/80 text-xs">Cleared for 24h wholesale dealer bidding and transaction settlement under OMVIC / Law 25 guidelines.</span>
        </div>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div role="status" className="flex items-center gap-2.5 rounded-xl border border-portal-border bg-portal-surface px-4 py-3 font-body text-sm text-portal-text transition-colors">
        <Loader2 className="w-5 h-5 text-portal-primary animate-spin shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold">We&apos;re checking your ID.</strong> This usually takes under a minute — this
          page updates automatically.
        </span>
      </div>
    );
  }

  const copy =
    status === "REJECTED"
      ? { title: "Identity check unsuccessful", body: "Your last submission couldn't be verified. Try again with clearer photos." }
      : status === "EXPIRED"
        ? { title: "Identity verification expired", body: "Re-verify to keep listing vehicles." }
        : { title: "Verify your identity to list your car", body: "Licensed dealers only bid on vehicles from verified sellers. It takes about two minutes." };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border px-4 py-4 transition-colors",
        "border-[#E59344]/30 bg-[#E59344]/5 dark:bg-[#E59344]/10"
      )}
    >
      <ShieldAlert className="w-6 h-6 text-[#E59344] shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-body text-sm font-semibold text-portal-text">{copy.title}</p>
        <p className="font-body text-sm text-portal-text-muted">{copy.body}</p>
      </div>
      <Link
        href="/verify-kyc"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-portal-primary hover:bg-portal-primary-hover px-4 py-2.5 min-h-[44px] font-body text-sm font-semibold text-white transition-colors cursor-pointer"
      >
        Verify now <ArrowRight className="w-4 h-4" aria-hidden />
      </Link>
    </div>
  );
}
