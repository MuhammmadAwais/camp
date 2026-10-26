"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X, CheckCircle2, ArrowRight, CreditCard } from "lucide-react";

export function DealerSubscriptionView() {
  const [billingCycle, setBillingCycle] = useState<"ANNUAL" | "MONTHLY">("ANNUAL");
  const [selectedTier, setSelectedTier] = useState<string>("PRO");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubscribe = (tierId: string) => {
    setSelectedTier(tierId);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 4000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-4 space-y-8 animate-in fade-in duration-300 font-body">
      {/* Top Header Row: "Pricing" on Left, Centered Annual/Monthly Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-headline">
          Pricing
        </h1>

        {/* Centered Annual / Monthly Pill Toggle with Dual Theme Contrast */}
        <div className="sm:pr-20 flex justify-center sm:justify-start">
          <div className="inline-flex items-center p-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-white/10 text-xs font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle("ANNUAL")}
              className={`px-6 py-2 rounded-full transition-all cursor-pointer font-body ${
                billingCycle === "ANNUAL"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold shadow-xs border border-neutral-200/60 dark:border-transparent"
                  : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white font-medium"
              }`}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-6 py-2 rounded-full transition-all cursor-pointer font-body ${
                billingCycle === "MONTHLY"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold shadow-xs border border-neutral-200/60 dark:border-transparent"
                  : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white font-medium"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Desktop spacer to maintain optical center balance */}
        <div className="hidden sm:block w-20" />
      </div>

      {/* Success Notification Banner */}
      {isSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-body flex items-center justify-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>
            Subscription plan updated to{" "}
            <strong className="font-semibold">
              {selectedTier === "BASIC"
                ? "Wholesale Basic"
                : selectedTier === "PRO"
                ? "Commercial Pro"
                : "Dealer Group Enterprise"}
            </strong>{" "}
            successfully! Stripe billing portal synced.
          </span>
        </div>
      )}

      {/* 3 Pricing Cards Grid with 3D Perspective & Symmetrical Tilt */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch [perspective:1400px]">
        {/* ========================================================
            CARD 1: Wholesale Basic (3D Tilt Left Inward)
            ======================================================== */}
        <div className="relative rounded-[32px] border border-neutral-200 dark:border-white/10 bg-white dark:bg-portal-surface p-7 sm:p-8 flex flex-col justify-between shadow-md dark:shadow-lg overflow-hidden transition-all duration-500 ease-out transform-gpu will-change-transform lg:[transform:rotateY(6deg)_rotateX(1.5deg)] lg:hover:[transform:rotateY(0deg)_rotateX(0deg)_translateY(-8px)] lg:origin-right hover:border-neutral-300 dark:hover:border-white/20">
          {/* Top-Right S-Curve Notch & Active Badge */}
          <div className="absolute top-0 right-0 w-[112px] h-[36px] pointer-events-none z-10">
            <svg
              viewBox="0 0 112 36"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 0 C 18 0, 18 26, 38 26 L 90 26 Q 112 26 112 36 L 112 0 Z"
                className="fill-white dark:fill-[#121212]"
              />
              <path
                d="M 0 0 C 18 0, 18 26, 38 26 L 90 26 Q 112 26 112 36"
                fill="none"
                className="stroke-neutral-200 dark:stroke-white/10"
                strokeWidth="1.5"
              />
            </svg>
            <div className="absolute top-1.5 right-4 flex items-center gap-1.5 text-[11px] font-body font-medium text-neutral-500 dark:text-neutral-400">
              <span>Active</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            </div>
          </div>

          <div>
            {/* Plan Title */}
            <h3 className="text-center font-bold text-lg sm:text-xl text-neutral-900 dark:text-white font-headline">
              Wholesale Basic
            </h3>

            {/* Balanced Pricing Heading */}
            <div className="mt-4 flex flex-col items-center justify-center text-center font-body">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  {billingCycle === "ANNUAL" ? "$399" : "$499"}
                </span>
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  CAD / mo
                </span>
              </div>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1 block">
                {billingCycle === "ANNUAL"
                  ? "$4,788 billed yearly"
                  : "Billed monthly, cancel anytime"}
              </span>
            </div>

            {/* Clean Dotted Divider */}
            <div className="border-t border-dashed border-neutral-200 dark:border-white/10 my-5" />

            {/* Feature List (8 Items: 4 Checked, 4 Excluded) */}
            <ul className="space-y-3.5 text-xs font-body">
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Access to wholesale trading floor</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Up to 15 sealed bids / month</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Single dealership rooftop</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>50 km geographic radius filter</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-400 dark:text-neutral-500">
                <div className="w-4 h-4 flex items-center justify-center shrink-0 text-neutral-400 dark:text-neutral-500">
                  <X className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>Instant SMS outbid alerts</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-400 dark:text-neutral-500">
                <div className="w-4 h-4 flex items-center justify-center shrink-0 text-neutral-400 dark:text-neutral-500">
                  <X className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>Assign & monitor buyer seats</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-400 dark:text-neutral-500">
                <div className="w-4 h-4 flex items-center justify-center shrink-0 text-neutral-400 dark:text-neutral-500">
                  <X className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>Dedicated wholesale desk support</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-400 dark:text-neutral-500">
                <div className="w-4 h-4 flex items-center justify-center shrink-0 text-neutral-400 dark:text-neutral-500">
                  <X className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>Automated proxy bidding API</span>
              </li>
            </ul>
          </div>

          {/* Bottom Button */}
          <div className="pt-8 flex justify-center">
            <button
              type="button"
              onClick={() => handleSubscribe("BASIC")}
              className="px-8 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-100 text-xs font-semibold shadow-2xs transition-all cursor-pointer font-body"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* ========================================================
            CARD 2: Commercial Pro (3D Elevated Center Hero)
            ======================================================== */}
        <div className="relative rounded-[32px] border-2 border-[#E59344] bg-[#141215] text-white p-7 sm:p-8 flex flex-col justify-between shadow-2xl overflow-hidden transition-all duration-500 ease-out transform-gpu will-change-transform lg:[transform:translateZ(24px)] lg:hover:[transform:translateZ(36px)_translateY(-10px)] lg:origin-center z-10">
          {/* Top-Right S-Curve Notch with Diagonal Striped Amber Tab */}
          <div className="absolute top-0 right-0 w-[116px] h-[38px] pointer-events-none z-10">
            <svg
              viewBox="0 0 116 38"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="amber-stripes"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="8" height="8" fill="#F59E0B" />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="8"
                    stroke="#D97706"
                    strokeWidth="3.5"
                  />
                </pattern>
              </defs>
              <path
                d="M 0 0 C 18 0, 18 28, 38 28 L 94 28 Q 116 28 116 38 L 116 0 Z"
                fill="url(#amber-stripes)"
              />
              <path
                d="M 0 0 C 18 0, 18 28, 38 28 L 94 28 Q 116 28 116 38"
                fill="none"
                stroke="#E59344"
                strokeWidth="2"
              />
            </svg>
            <div className="absolute top-1.5 right-4 flex items-center gap-1 text-[11px] font-body font-bold text-neutral-950">
              <span>Save 20%</span>
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 inline-block ml-0.5" />
            </div>
          </div>

          <div>
            {/* Plan Title */}
            <h3 className="text-center font-bold text-lg sm:text-xl text-white font-headline">
              Commercial Pro
            </h3>

            {/* Balanced Pricing Heading with Clean Inline Strikethrough */}
            <div className="mt-4 flex flex-col items-center justify-center text-center font-body">
              <div className="flex items-baseline justify-center gap-2">
                {billingCycle === "ANNUAL" && (
                  <span className="text-xl sm:text-2xl font-bold text-neutral-400 line-through">
                    $999
                  </span>
                )}
                <span className="text-4xl sm:text-5xl font-extrabold text-[#E59344] tracking-tight">
                  {billingCycle === "ANNUAL" ? "$799" : "$999"}
                </span>
                <span className="text-xs font-semibold text-neutral-300">
                  CAD / mo
                </span>
              </div>
              <span className="text-xs font-medium text-neutral-300 mt-1 block">
                {billingCycle === "ANNUAL"
                  ? "$9,588 billed yearly"
                  : "Billed monthly, cancel anytime"}
              </span>
            </div>

            {/* Clean Dotted Divider */}
            <div className="border-t border-dashed border-white/15 my-5" />

            {/* Feature List (8 Items: 6 Checked, 2 Excluded) */}
            <ul className="space-y-3.5 text-xs font-body">
              <li className="flex items-center gap-2.5 text-white/95 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Access to wholesale trading floor</span>
              </li>
              <li className="flex items-center gap-2.5 text-white/95 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Up to 50 sealed bids / month</span>
              </li>
              <li className="flex items-center gap-2.5 text-white/95 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Up to 3 dealership rooftops</span>
              </li>
              <li className="flex items-center gap-2.5 text-white/95 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>150 km geographic radius filter</span>
              </li>
              <li className="flex items-center gap-2.5 text-white/95 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Instant SMS outbid alerts</span>
              </li>
              <li className="flex items-center gap-2.5 text-white/95 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Assign & monitor buyer seats</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-400">
                <div className="w-4 h-4 flex items-center justify-center shrink-0 text-neutral-400">
                  <X className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>Dedicated wholesale desk support</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-400">
                <div className="w-4 h-4 flex items-center justify-center shrink-0 text-neutral-400">
                  <X className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>Automated proxy bidding API</span>
              </li>
            </ul>
          </div>

          {/* Bottom Button: High-Contrast Solid White Pill */}
          <div className="pt-8 flex justify-center">
            <button
              type="button"
              onClick={() => handleSubscribe("PRO")}
              className="px-8 py-3 rounded-full bg-white text-neutral-950 hover:bg-neutral-100 font-bold text-xs shadow-xl transition-transform hover:scale-[1.02] cursor-pointer font-body"
            >
              Start 14-days Free Trial
            </button>
          </div>
        </div>

        {/* ========================================================
            CARD 3: Dealer Group Enterprise (3D Tilt Right Inward)
            ======================================================== */}
        <div className="relative rounded-[32px] border border-neutral-200 dark:border-white/10 bg-white dark:bg-portal-surface p-7 sm:p-8 flex flex-col justify-between shadow-md dark:shadow-lg overflow-hidden transition-all duration-500 ease-out transform-gpu will-change-transform lg:[transform:rotateY(-6deg)_rotateX(1.5deg)] lg:hover:[transform:rotateY(0deg)_rotateX(0deg)_translateY(-8px)] lg:origin-left hover:border-neutral-300 dark:hover:border-white/20">
          {/* Top-Right S-Curve Notch & Popular Badge */}
          <div className="absolute top-0 right-0 w-[112px] h-[36px] pointer-events-none z-10">
            <svg
              viewBox="0 0 112 36"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 0 C 18 0, 18 26, 38 26 L 90 26 Q 112 26 112 36 L 112 0 Z"
                className="fill-white dark:fill-[#121212]"
              />
              <path
                d="M 0 0 C 18 0, 18 26, 38 26 L 90 26 Q 112 26 112 36"
                fill="none"
                className="stroke-neutral-200 dark:stroke-white/10"
                strokeWidth="1.5"
              />
            </svg>
            <div className="absolute top-1.5 right-4 flex items-center gap-1.5 text-[11px] font-body font-medium text-neutral-500 dark:text-neutral-400">
              <span>Popular</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            </div>
          </div>

          <div>
            {/* Plan Title */}
            <h3 className="text-center font-bold text-lg sm:text-xl text-neutral-900 dark:text-white font-headline">
              Dealer Group Enterprise
            </h3>

            {/* Balanced Pricing Heading */}
            <div className="mt-4 flex flex-col items-center justify-center text-center font-body">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  {billingCycle === "ANNUAL" ? "$1,599" : "$1,999"}
                </span>
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  CAD / mo
                </span>
              </div>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1 block">
                {billingCycle === "ANNUAL"
                  ? "$19,188 billed yearly"
                  : "Billed monthly, cancel anytime"}
              </span>
            </div>

            {/* Clean Dotted Divider */}
            <div className="border-t border-dashed border-neutral-200 dark:border-white/10 my-5" />

            {/* Feature List (8 Items: ALL 8 Checked) */}
            <ul className="space-y-3.5 text-xs font-body">
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Access to wholesale trading floor</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Unlimited / 200+ sealed bids / month</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Unlimited provincial rooftops</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Province-wide acquisition feed</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Instant SMS outbid alerts</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Assign & monitor buyer seats</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Dedicated wholesale desk support</span>
              </li>
              <li className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Automated proxy bidding API</span>
              </li>
            </ul>
          </div>

          {/* Bottom Button */}
          <div className="pt-8 flex justify-center">
            <button
              type="button"
              onClick={() => handleSubscribe("ENTERPRISE")}
              className="px-8 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-100 font-semibold text-xs shadow-xs transition-all cursor-pointer font-body"
            >
              Start 14-days Free Trial
            </button>
          </div>
        </div>
      </div>

      {/* Minimal Dealership Subscription Status Console */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-neutral-50/80 dark:bg-neutral-900/50 backdrop-blur-sm px-5 py-3.5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs font-body">
        {/* Left: Clean Hierarchy Status */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-neutral-500 dark:text-neutral-400 font-medium">
            Current Plan:
          </span>
          <span className="font-bold text-neutral-900 dark:text-white">
            Commercial Pro
          </span>
          <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">
            •
          </span>
          <span className="text-neutral-500 dark:text-neutral-400">
            Renews November 15, 2026
          </span>
        </div>

        {/* Right: Clean Action Link */}
        <Link
          href="/dealer/billing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-colors group cursor-pointer self-start sm:self-auto font-body"
        >
          <CreditCard className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors" />
          <span>Manage billing & invoices</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-all" />
        </Link>
      </div>
    </div>
  );
}
