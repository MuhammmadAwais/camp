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
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-sm text-emerald-800">
        <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold">Identity verified.</strong> You&apos;re cleared to list vehicles.
        </span>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div role="status" className="flex items-center gap-2.5 rounded-xl border border-portal-border bg-portal-surface px-4 py-3 font-body text-sm text-portal-text">
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
        "flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border px-4 py-4",
        "border-secondary/40 bg-secondary-fixed/40"
      )}
    >
      <ShieldAlert className="w-6 h-6 text-on-secondary-container shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-body text-sm font-semibold text-on-secondary-fixed">{copy.title}</p>
        <p className="font-body text-sm text-on-secondary-fixed-variant">{copy.body}</p>
      </div>
      <Link
        href="/verify-kyc"
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-portal-primary hover:bg-portal-primary-hover px-4 py-2.5 font-body text-sm font-semibold text-white transition-colors"
      >
        Verify now <ArrowRight className="w-4 h-4" aria-hidden />
      </Link>
    </div>
  );
}
