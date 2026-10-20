"use client";

import Link from "next/link";
import { ArrowRight, CarFront, CheckCircle2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { KycStatus } from "@/lib/types/auth";

interface Props {
  kycStatus: KycStatus;
}

export function SellerEmptyState({ kycStatus }: Props) {
  const isVerified = kycStatus === "VERIFIED";

  const steps = [
    {
      step: "01",
      title: "Enter your VIN",
      description: "Auto-decode exact factory specifications, mileage, and optional packages in seconds.",
    },
    {
      step: "02",
      title: "24-Hour Sealed Auction",
      description: "Hundreds of vetted franchise & independent dealers submit binding blind bids.",
    },
    {
      step: "03",
      title: "Accept & Get Paid",
      description: "Review unsealed offers, pick the highest bidder, and receive funds via verified bank draft.",
    },
  ];

  return (
    <section className="rounded-3xl border border-portal-border bg-portal-surface p-6 sm:p-10 text-center relative overflow-hidden">
      {/* Subtle background glow decorative element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-b from-[#8C383E]/5 dark:from-[#E59344]/10 to-transparent blur-2xl pointer-events-none" />

      {/* Center Icon */}
      <div className="mx-auto w-16 h-16 rounded-2xl bg-[#8C383E]/10 dark:bg-[#E59344]/15 border border-[#8C383E]/20 dark:border-[#E59344]/30 flex items-center justify-center text-[#8C383E] dark:text-[#E59344] mb-5">
        <CarFront className="w-8 h-8" aria-hidden />
      </div>

      <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-portal-text">
        Ready to sell your car for wholesale surplus?
      </h2>
      <p className="mt-2 font-body text-sm sm:text-base text-portal-text-muted max-w-xl mx-auto">
        Your vehicle hasn&apos;t entered the wholesale floor yet. Once listed, licensed Canadian dealerships compete in a 24-hour sealed-bid auction to win your car.
      </p>

      {/* 3 Step Journey Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
        {steps.map(({ step, title, description }) => (
          <div
            key={step}
            className="rounded-2xl border border-portal-border/80 bg-portal-surface-hover/50 p-4 transition-colors hover:border-[#8C383E]/30 dark:hover:border-[#E59344]/30"
          >
            <span className="font-mono text-xs font-bold text-[#8C383E] dark:text-[#E59344]">{step}</span>
            <h3 className="mt-1 font-headline text-sm font-bold text-portal-text">{title}</h3>
            <p className="mt-1 font-body text-xs text-portal-text-muted leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* Action CTA */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        {isVerified ? (
          <Link
            href="/seller/list-car"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#8C383E] dark:bg-[#E59344] hover:bg-[#752B30] dark:hover:bg-[#D9822F] px-6 py-3 min-h-[48px] font-body text-sm font-bold text-white transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>List your car now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href="/verify-kyc"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#8C383E] dark:bg-[#E59344] hover:bg-[#752B30] dark:hover:bg-[#D9822F] px-6 py-3 min-h-[48px] font-body text-sm font-bold text-white transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Verify ID to unlock listing</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Trust Badges */}
      <div className="mt-8 pt-6 border-t border-portal-border flex flex-wrap items-center justify-center gap-6 font-body text-xs text-portal-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          OMVIC & AMVIC Licensed Network
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Zero Buyer Spam (100% Sealed)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          PIPEDA Privacy Shielded
        </span>
      </div>
    </section>
  );
}
