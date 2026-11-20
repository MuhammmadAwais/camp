"use client";

import React, { Suspense, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api-client";
import {
  useDealerSubscription,
  useLaunchDealerCheckout,
} from "@/hooks/useDealerBilling";
import type { SubscriptionPlanItem } from "@/lib/types/dealer";
import { formatCadCents } from "@/lib/utils";

const emptySubscribe = () => () => {};

function getPlanCardTierOrder(slug: string): number {
  if (slug.startsWith("basic")) return 0;
  if (slug.startsWith("pro")) return 1;
  if (slug.startsWith("enterprise")) return 2;
  return 3;
}

function getPlanFeatures(plan: SubscriptionPlanItem): Array<{
  label: string;
  included: boolean;
}> {
  const included = plan.features.map((label) => ({ label, included: true }));
  if (plan.slug.startsWith("basic")) {
    return [
      ...included,
      { label: "Assign & monitor buyer seats", included: false },
      { label: "Dedicated wholesale desk support", included: false },
    ];
  }
  if (plan.slug.startsWith("pro")) {
    return [
      ...included,
      { label: "Dedicated wholesale desk support", included: false },
    ];
  }
  return included;
}

function DealerSubscriptionContent() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const searchParams = useSearchParams();
  const checkoutCancelled = searchParams.get("checkout") === "cancelled";

  const [billingCycle, setBillingCycle] = useState<"ANNUAL" | "MONTHLY">(
    "ANNUAL"
  );
  const [activePlanLoadingSlug, setActivePlanLoadingSlug] = useState<
    string | null
  >(null);
  const [noticeBanner, setNoticeBanner] = useState<{
    tone: "warning" | "error";
    text: string;
  } | null>(null);

  const { data, isLoading, isError, error, refetch } =
    useDealerSubscription();
  const launchCheckout = useLaunchDealerCheckout();

  const targetInterval = billingCycle === "ANNUAL" ? "year" : "month";

  const visiblePlans = useMemo(() => {
    const list = (data?.plans ?? []).filter(
      (plan) => plan.billingInterval === targetInterval
    );
    return [...list].sort(
      (a, b) =>
        getPlanCardTierOrder(a.slug) - getPlanCardTierOrder(b.slug) ||
        a.priceCents - b.priceCents
    );
  }, [data?.plans, targetInterval]);

  const currentSub = data?.currentSubscription ?? null;
  const canManageBilling = data?.canManageBilling ?? false;

  const currentPeriodEnd = currentSub?.currentPeriodEnd ?? null;
  const formattedRenewal = !currentPeriodEnd
    ? "—"
    : !mounted
      ? currentPeriodEnd.slice(0, 10)
      : new Date(currentPeriodEnd).toLocaleDateString("en-CA", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

  const handleSelectPlan = async (plan: SubscriptionPlanItem) => {
    setNoticeBanner(null);
    setActivePlanLoadingSlug(plan.slug);
    try {
      const res = await launchCheckout.mutateAsync({ planId: plan.id });
      window.location.assign(res.checkoutUrl);
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.failure.code === "BILLING_NOT_CONFIGURED"
      ) {
        setNoticeBanner({
          tone: "warning",
          text: err.message,
        });
      } else {
        setNoticeBanner({
          tone: "error",
          text:
            err instanceof ApiError
              ? err.message
              : "Unable to initialize Stripe Checkout right now.",
        });
      }
      setActivePlanLoadingSlug(null);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="w-full max-w-6xl mx-auto py-20 flex items-center justify-center gap-3 text-sm text-portal-text-muted font-body">
        <Loader2 className="w-5 h-5 animate-spin text-portal-primary" />
        <span>Loading live CAD dealership subscription tiers...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-3xl mx-auto py-16 px-4 text-center space-y-4 font-body">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-portal-text font-headline">
          Unable to load subscription plans
        </h2>
        <p className="text-xs text-portal-text-muted">
          {error instanceof ApiError
            ? error.message
            : "Please verify your dealership membership and try again."}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-4 py-2 rounded-xl bg-portal-primary text-white text-xs font-bold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-4 space-y-8 animate-in fade-in duration-300 font-body">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-portal-text font-headline">
            Pricing
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            All subscription fees are billed in CAD via Stripe with zero per-vehicle buyer premiums.
          </p>
        </div>

        {/* Centered Annual / Monthly Pill Toggle */}
        <div className="flex justify-center sm:justify-start">
          <div className="inline-flex items-center p-1 rounded-full bg-portal-surface-hover border border-portal-border text-xs font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle("ANNUAL")}
              className={`px-6 py-2 rounded-full transition-all cursor-pointer font-body ${
                billingCycle === "ANNUAL"
                  ? "bg-portal-surface text-portal-text font-bold shadow-xs border border-portal-border"
                  : "text-portal-text-muted hover:text-portal-text font-medium"
              }`}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-6 py-2 rounded-full transition-all cursor-pointer font-body ${
                billingCycle === "MONTHLY"
                  ? "bg-portal-surface text-portal-text font-bold shadow-xs border border-portal-border"
                  : "text-portal-text-muted hover:text-portal-text font-medium"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Cancelled Banner */}
      {checkoutCancelled && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-body flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Stripe Checkout was cancelled. Your current plan remains active with zero changes.
          </span>
        </div>
      )}

      {/* Checkout Config / Error Banner */}
      {noticeBanner && (
        <div
          className={`p-4 rounded-2xl border text-xs font-body flex items-center justify-between gap-3 ${
            noticeBanner.tone === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              : "bg-red-500/10 border-red-500/30 text-red-500"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{noticeBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNoticeBanner(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch [perspective:1400px]">
        {visiblePlans.map((plan) => {
          const isProHero = plan.slug.startsWith("pro");
          const isEnterprise = plan.slug.startsWith("enterprise");
          const isCurrentPlan = currentSub?.planId === plan.id;
          const isProcessing = activePlanLoadingSlug === plan.slug;
          const monthlyCents =
            plan.billingInterval === "year"
              ? Math.round(plan.priceCents / 12)
              : plan.priceCents;
          const featureRows = getPlanFeatures(plan);

          if (isProHero) {
            return (
              <div
                key={plan.id}
                className="relative rounded-[32px] border-2 border-secondary bg-portal-dark-surface text-portal-dark-text p-7 sm:p-8 flex flex-col justify-between shadow-2xl overflow-hidden transition-all duration-500 ease-out transform-gpu will-change-transform lg:[transform:translateZ(24px)] lg:hover:[transform:translateZ(36px)_translateY(-10px)] lg:origin-center z-10"
              >
                <div className="absolute top-0 right-0 w-[124px] h-[38px] pointer-events-none z-10">
                  <svg
                    viewBox="0 0 124 38"
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
                        <rect
                          width="8"
                          height="8"
                          fill="var(--color-secondary)"
                        />
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="8"
                          stroke="var(--color-secondary-container)"
                          strokeWidth="3.5"
                        />
                      </pattern>
                    </defs>
                    <path
                      d="M 0 0 C 18 0, 18 28, 38 28 L 102 28 Q 124 28 124 38 L 124 0 Z"
                      fill="url(#amber-stripes)"
                    />
                    <path
                      d="M 0 0 C 18 0, 18 28, 38 28 L 102 28 Q 124 28 124 38"
                      fill="none"
                      stroke="var(--color-secondary)"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="absolute top-1.5 right-4 flex items-center gap-1 text-[11px] font-body font-bold text-portal-dark-canvas">
                    <span>
                      {isCurrentPlan
                        ? "Current"
                        : billingCycle === "ANNUAL"
                        ? "Save 20%"
                        : "Recommended"}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-center font-bold text-lg sm:text-xl text-portal-dark-text font-headline">
                    {plan.name}
                  </h3>

                  <div className="mt-4 flex flex-col items-center justify-center text-center font-body">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl sm:text-5xl font-extrabold text-secondary tracking-tight">
                        {formatCadCents(monthlyCents)}
                      </span>
                      <span className="text-xs font-semibold text-portal-dark-text-muted">
                        CAD / mo
                      </span>
                    </div>
                    <span className="text-xs font-medium text-portal-dark-text-muted mt-1 block">
                      {plan.billingInterval === "year"
                        ? `${formatCadCents(plan.priceCents)} CAD billed yearly`
                        : "Billed monthly in CAD, cancel anytime"}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-portal-dark-border my-5" />

                  <ul className="space-y-3.5 text-xs font-body">
                    {featureRows.map((feat) => (
                      <li
                        key={feat.label}
                        className={`flex items-center gap-2.5 font-medium ${
                          feat.included
                            ? "text-portal-dark-text"
                            : "text-portal-dark-text-muted"
                        }`}
                      >
                        {feat.included ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 flex items-center justify-center shrink-0 text-portal-dark-text-muted">
                            <X className="w-3.5 h-3.5 stroke-[2]" />
                          </div>
                        )}
                        <span>{feat.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8 flex justify-center">
                  <button
                    type="button"
                    disabled={
                      isCurrentPlan || !canManageBilling || isProcessing
                    }
                    onClick={() => void handleSelectPlan(plan)}
                    className="px-8 py-3 rounded-full bg-white text-portal-dark-canvas hover:opacity-90 font-bold text-xs shadow-xl transition-transform hover:scale-[1.02] cursor-pointer font-body disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {isProcessing && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>
                      {isCurrentPlan
                        ? "Current Active Plan"
                        : !canManageBilling
                        ? "Dealer Admin Only"
                        : "Switch via Stripe Checkout"}
                    </span>
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={plan.id}
              className={`relative rounded-[32px] border bg-portal-surface p-7 sm:p-8 flex flex-col justify-between shadow-md overflow-hidden transition-all duration-500 ease-out transform-gpu will-change-transform ${
                isCurrentPlan
                  ? "border-portal-primary ring-2 ring-portal-primary/20"
                  : "border-portal-border hover:border-portal-primary/40"
              } ${
                isEnterprise
                  ? "lg:[transform:rotateY(-6deg)_rotateX(1.5deg)] lg:hover:[transform:rotateY(0deg)_rotateX(0deg)_translateY(-8px)] lg:origin-left"
                  : "lg:[transform:rotateY(6deg)_rotateX(1.5deg)] lg:hover:[transform:rotateY(0deg)_rotateX(0deg)_translateY(-8px)] lg:origin-right"
              }`}
            >
              <div className="absolute top-0 right-0 w-[112px] h-[36px] pointer-events-none z-10">
                <svg
                  viewBox="0 0 112 36"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 0 C 18 0, 18 26, 38 26 L 90 26 Q 112 26 112 36 L 112 0 Z"
                    fill="var(--portal-canvas)"
                  />
                  <path
                    d="M 0 0 C 18 0, 18 26, 38 26 L 90 26 Q 112 26 112 36"
                    fill="none"
                    stroke="var(--portal-border)"
                    strokeWidth="1.5"
                  />
                </svg>
                <div className="absolute top-1.5 right-4 flex items-center gap-1.5 text-[11px] font-body font-medium text-portal-text-muted">
                  <span>
                    {isCurrentPlan
                      ? "Active"
                      : isEnterprise
                      ? "Scale"
                      : "Starter"}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      isCurrentPlan ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-center font-bold text-lg sm:text-xl text-portal-text font-headline">
                  {plan.name}
                </h3>

                <div className="mt-4 flex flex-col items-center justify-center text-center font-body">
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-4xl sm:text-5xl font-extrabold text-portal-text tracking-tight">
                      {formatCadCents(monthlyCents)}
                    </span>
                    <span className="text-xs font-semibold text-portal-text-muted">
                      CAD / mo
                    </span>
                  </div>
                  <span className="text-xs font-medium text-portal-text-muted mt-1 block">
                    {plan.billingInterval === "year"
                      ? `${formatCadCents(plan.priceCents)} CAD billed yearly`
                      : "Billed monthly in CAD, cancel anytime"}
                  </span>
                </div>

                <div className="border-t border-dashed border-portal-border my-5" />

                <ul className="space-y-3.5 text-xs font-body">
                  {featureRows.map((feat) => (
                    <li
                      key={feat.label}
                      className={`flex items-center gap-2.5 font-medium ${
                        feat.included
                          ? "text-portal-text"
                          : "text-portal-text-muted opacity-65"
                      }`}
                    >
                      {feat.included ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 flex items-center justify-center shrink-0 text-portal-text-muted">
                          <X className="w-3.5 h-3.5 stroke-[2]" />
                        </div>
                      )}
                      <span>{feat.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8 flex justify-center">
                <button
                  type="button"
                  disabled={
                    isCurrentPlan || !canManageBilling || isProcessing
                  }
                  onClick={() => void handleSelectPlan(plan)}
                  className="px-8 py-2.5 rounded-full border border-portal-border bg-portal-surface-hover hover:bg-portal-primary hover:text-white text-portal-text text-xs font-semibold shadow-2xs transition-all cursor-pointer font-body disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isProcessing && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>
                    {isCurrentPlan
                      ? "Current Active Plan"
                      : !canManageBilling
                      ? "Dealer Admin Only"
                      : "Switch via Stripe Checkout"}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Dealership Subscription Status Console */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface px-5 py-3.5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs font-body">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-portal-text-muted font-medium">
            {data?.dealershipName} — Current Plan:
          </span>
          <span className="font-bold text-portal-text">
            {currentSub?.planName ?? "None"}{" "}
            {currentSub ? `(${currentSub.status})` : ""}
          </span>
          <span className="text-portal-border hidden sm:inline">•</span>
          <span className="text-portal-text-muted">
            Quota: {currentSub?.bidsUsed ?? 0} /{" "}
            {currentSub?.monthlyBidQuota ?? 0} bids • Period ends{" "}
            {formattedRenewal}
          </span>
        </div>

        <Link
          href="/dealer/billing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-portal-primary hover:underline transition-colors cursor-pointer self-start sm:self-auto font-body"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Manage billing &amp; invoices</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function DealerSubscriptionView() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-6xl mx-auto py-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-portal-primary" />
        </div>
      }
    >
      <DealerSubscriptionContent />
    </Suspense>
  );
}
