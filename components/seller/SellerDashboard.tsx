"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { KycStatusBanner } from "@/components/seller/KycStatusBanner";
import { ListingStartCard } from "@/components/seller/ListingStartCard";
import { SellerAuctionCard } from "@/components/seller/SellerAuctionCard";
import { SellerEmptyState } from "@/components/seller/SellerEmptyState";
import { SellerNotificationFeed } from "@/components/seller/SellerNotificationFeed";
import { SellerStatsGrid } from "@/components/seller/SellerStatsGrid";
import { useSellerDashboard } from "@/hooks/useSellerDashboard";
import type { SessionUser } from "@/lib/types/auth";
import type { AuctionStatus } from "@/lib/types/seller";
import { cn } from "@/lib/utils";

interface Props {
  user: SessionUser;
}

type TabFilter = "ALL" | "ACTIVE" | "PENDING_MODERATION" | "COMPLETED";

// Milestone 4.1: Comprehensive Seller Dashboard Shell with Autumn Editorial dual-theme.
export function SellerDashboard({ user }: Props) {
  const [viewMode, setViewMode] = React.useState<"default" | "empty">("default");
  const [activeTab, setActiveTab] = React.useState<TabFilter>("ALL");

  const { data, isLoading, isError, refetch, isFetching } = useSellerDashboard(viewMode);

  const auctions = data?.auctions ?? [];
  const stats = data?.stats ?? {
    activeAuctionsCount: 0,
    totalBidsReceived: 0,
    completedSalesCount: 0,
    totalValueEarnedCents: 0,
  };
  const notifications = data?.notifications ?? [];

  // Filter listings based on active tab
  const filteredAuctions = React.useMemo(() => {
    if (activeTab === "ALL") return auctions;
    return auctions.filter((a) => a.status === (activeTab as AuctionStatus));
  }, [auctions, activeTab]);

  const activeCount = auctions.filter((a) => a.status === "ACTIVE").length;
  const reviewCount = auctions.filter((a) => a.status === "PENDING_MODERATION").length;
  const completedCount = auctions.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="mx-auto max-w-6xl w-full py-4 sm:py-6 space-y-6">
      {/* Welcome Title, Location & Interactive View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-portal-text">
            Welcome, {user.firstName}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 font-body text-sm text-portal-text-muted">
            <span>Selling from</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#8C383E]/10 text-[#8C383E] border border-[#8C383E]/25 dark:bg-[#E59344]/15 dark:text-[#E59344] dark:border-[#E59344]/30 font-semibold">
              {user.postalCode}
            </span>
            <span>· {user.province}</span>
          </p>
        </div>

        {/* View Mode Switcher (Allows testing active telemetry vs. empty onboarding state) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center p-1 rounded-xl bg-portal-surface border border-portal-border text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode("default")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all font-body cursor-pointer",
                viewMode === "default"
                  ? "bg-[#8C383E] dark:bg-[#E59344] text-white font-semibold shadow-xs"
                  : "text-portal-text-muted hover:text-portal-text"
              )}
            >
              Active Floor ({auctions.length || 3})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("empty")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all font-body cursor-pointer",
                viewMode === "empty"
                  ? "bg-[#8C383E] dark:bg-[#E59344] text-white font-semibold shadow-xs"
                  : "text-portal-text-muted hover:text-portal-text"
              )}
            >
              First-Time Seller (0)
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh telemetry"
            title="Refresh telemetry"
            className="p-2 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text transition-colors cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* KYC Verification Gate Banner */}
      <KycStatusBanner initialStatus={user.kycStatus} />

      {/* Real-time KPI Stats Grid */}
      <SellerStatsGrid stats={stats} />

      {/* Main 2-Column Responsive Floor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Primary Column: Listings, Tabs & Wizard Trigger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick-Action Onboarding Card */}
          <ListingStartCard initialKycStatus={user.kycStatus} />

          {/* Listings Management Section */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-portal-border">
              <div className="flex items-center gap-2">
                <h2 className="font-headline text-lg sm:text-xl font-bold text-portal-text">Your Listings</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-portal-surface border border-portal-border text-portal-text-muted">
                  {auctions.length}
                </span>
              </div>

              {/* Filter Tabs */}
              {auctions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ALL")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                      activeTab === "ALL"
                        ? "bg-[#8C383E]/10 dark:bg-[#E59344]/15 text-[#8C383E] dark:text-[#E59344] font-semibold"
                        : "text-portal-text-muted hover:text-portal-text"
                    )}
                  >
                    All ({auctions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("ACTIVE")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                      activeTab === "ACTIVE"
                        ? "bg-[#8C383E]/10 dark:bg-[#E59344]/15 text-[#8C383E] dark:text-[#E59344] font-semibold"
                        : "text-portal-text-muted hover:text-portal-text"
                    )}
                  >
                    Live 24h ({activeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("PENDING_MODERATION")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                      activeTab === "PENDING_MODERATION"
                        ? "bg-[#8C383E]/10 dark:bg-[#E59344]/15 text-[#8C383E] dark:text-[#E59344] font-semibold"
                        : "text-portal-text-muted hover:text-portal-text"
                    )}
                  >
                    Review ({reviewCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("COMPLETED")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                      activeTab === "COMPLETED"
                        ? "bg-[#8C383E]/10 dark:bg-[#E59344]/15 text-[#8C383E] dark:text-[#E59344] font-semibold"
                        : "text-portal-text-muted hover:text-portal-text"
                    )}
                  >
                    Sold ({completedCount})
                  </button>
                </div>
              )}
            </div>

            {/* Content Rendering: Loading, Empty, or Auction Cards */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-2xl border border-portal-border bg-portal-surface animate-pulse"
                  />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-600 dark:text-red-400">
                Failed to load auction telemetry. Click refresh above to retry.
              </div>
            ) : filteredAuctions.length === 0 ? (
              <SellerEmptyState kycStatus={user.kycStatus} />
            ) : (
              <div className="space-y-4">
                {filteredAuctions.map((auction) => (
                  <SellerAuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right / Secondary Column: Activity Notifications & Seller Protections */}
        <div className="space-y-6">
          <SellerNotificationFeed notifications={notifications} />

          {/* Canadian Seller Safeguards Callout Card */}
          <aside className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 transition-colors hover:border-[#8C383E]/30 dark:hover:border-[#E59344]/30 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h3 className="font-headline text-sm font-bold text-portal-text">Canadian Seller Guarantees</h3>
            </div>

            <ul className="space-y-3 font-body text-xs text-portal-text-muted">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C383E] dark:bg-[#E59344] shrink-0 mt-1.5" />
                <span>
                  <strong className="text-portal-text font-semibold">100% Sealed Blind Bids:</strong> Dealers cannot view competing bids, ensuring true maximum wholesale offers.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C383E] dark:bg-[#E59344] shrink-0 mt-1.5" />
                <span>
                  <strong className="text-portal-text font-semibold">OMVIC & AMVIC Licensed:</strong> Only verified, licensed retail dealerships are permitted to bid.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C383E] dark:bg-[#E59344] shrink-0 mt-1.5" />
                <span>
                  <strong className="text-portal-text font-semibold">Guaranteed Funds:</strong> All transactions are settled via certified bank draft, electronic wire, or certified cheque.
                </span>
              </li>
            </ul>

            <div className="pt-3 border-t border-portal-border">
              <Link
                href="/legal/terms"
                className="inline-flex items-center gap-1 font-body text-xs font-semibold text-[#8C383E] dark:text-[#E59344] hover:underline"
              >
                <span>Read our seller protection charter</span>
                <span aria-hidden>&rarr;</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
