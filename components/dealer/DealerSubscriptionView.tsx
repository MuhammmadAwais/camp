"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  Building2,
  Crown,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";

export function DealerSubscriptionView() {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  const [selectedTier, setSelectedTier] = useState<string>("PRO");
  const [isSuccess, setIsSuccess] = useState(false);

  const tiers = [
    {
      id: "BASIC",
      name: "Wholesale Basic",
      monthlyPriceCents: 49900, // $499.00 / mo
      annualPriceCents: 39900, // $399.00 / mo billed annually ($4,788/yr)
      monthlyBidQuota: 15,
      features: [
        "Up to 15 Sealed Bids / month",
        "Single Dealership Rooftop",
        "50 km Geographic Radius",
        "Email Auction Alerts",
        "Standard EFT Settlement",
      ],
      recommended: false,
    },
    {
      id: "PRO",
      name: "Commercial Pro",
      monthlyPriceCents: 99900, // $999.00 / mo
      annualPriceCents: 79900, // $799.00 / mo billed annually ($9,588/yr)
      monthlyBidQuota: 50,
      features: [
        "Up to 50 Sealed Bids / month",
        "Up to 3 Dealership Rooftops",
        "150 km Geographic Radius",
        "Instant SMS Urgent Outbid Alerts",
        "Priority 1-Day Wire Settlement",
        "Dedicated Wholesale Desk Support",
      ],
      recommended: true,
    },
    {
      id: "ENTERPRISE",
      name: "Dealer Group Enterprise",
      monthlyPriceCents: 199900, // $1,999.00 / mo
      annualPriceCents: 159900, // $1,599.00 / mo billed annually
      monthlyBidQuota: 200,
      features: [
        "Unlimited / 200+ Sealed Bids / month",
        "Unlimited Provincial Rooftops",
        "Province-Wide Acquisition Feed",
        "Automated Proxy Bid API Integration",
        "Same-Day Expedited Escrow Wire",
        "Dedicated Account Executive",
      ],
      recommended: false,
    },
  ];

  const handleSubscribe = (tierId: string) => {
    setSelectedTier(tierId);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-portal-primary/10 text-portal-primary text-xs font-bold font-mono uppercase tracking-wider">
          <Crown className="w-3.5 h-3.5" />
          <span>Dealership Bidding Access</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-portal-text font-headline tracking-tight">
          Choose Your Wholesale Bidding Plan
        </h1>
        <p className="text-sm text-portal-text-muted leading-relaxed">
          Predictable monthly SaaS subscriptions with zero surprise buyer premium percentages. All plans billed in Canadian Dollars (CAD).
        </p>

        {/* Billing Cycle Toggle */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <div className="p-1 rounded-xl bg-portal-surface border border-portal-border inline-flex items-center gap-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-4 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                billingCycle === "MONTHLY"
                  ? "bg-portal-primary text-white"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("ANNUAL")}
              className={`px-4 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                billingCycle === "ANNUAL"
                  ? "bg-portal-primary text-white"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[10px]">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {isSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-mono flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Subscription plan updated to {selectedTier} successfully! Stripe billing portal synced.</span>
        </div>
      )}

      {/* 3 Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {tiers.map((tier) => {
          const priceCents = billingCycle === "ANNUAL" ? tier.annualPriceCents : tier.monthlyPriceCents;

          return (
            <div
              key={tier.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all bg-portal-surface ${
                tier.recommended
                  ? "border-portal-primary shadow-xl ring-2 ring-portal-primary/20 relative"
                  : "border-portal-border shadow-xs hover:border-portal-primary/40"
              }`}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-portal-primary text-white text-[10px] font-bold font-mono uppercase tracking-wider shadow-sm">
                  Most Popular for Dealer Groups
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-portal-text">{tier.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1 font-mono">
                    <span className="text-3xl font-black text-portal-text">
                      {formatCadCents(priceCents)}
                    </span>
                    <span className="text-xs text-portal-text-muted">/ month</span>
                  </div>
                  {billingCycle === "ANNUAL" && (
                    <span className="text-[11px] font-mono text-emerald-500 block mt-0.5">
                      Billed annually (2 months free)
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-portal-surface-hover border border-portal-border font-mono text-xs flex items-center justify-between">
                  <span className="text-portal-text-muted">Monthly Bid Quota:</span>
                  <span className="font-bold text-portal-primary">{tier.monthlyBidQuota} Sealed Bids</span>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 pt-2 text-xs">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-portal-text-muted">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleSubscribe(tier.id)}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                    tier.recommended
                      ? "bg-portal-primary hover:bg-portal-primary-hover text-white"
                      : "border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Select {tier.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quota Gauge & Billing Portal Link */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="space-y-1">
          <span className="font-bold text-portal-text block">Current Dealership Plan: Commercial Pro</span>
          <span className="text-portal-text-muted block">Next renewal date: November 15, 2026 • Stripe ID: sub_894129841</span>
        </div>

        <Link
          href="/dealer/billing"
          className="px-4 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover hover:border-portal-primary text-portal-text font-bold transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <span>Manage Invoices & Payment Methods</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
