"use client";

import * as React from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  SquaresFour,
  List,
  Funnel,
  Plus,
  ShieldCheck,
  ArrowsClockwise,
  CheckCircle,
  Car,
  CaretDown,
} from "@phosphor-icons/react";
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

export function SellerDashboard({ user }: Props) {
  const [viewMode, setViewMode] = React.useState<"default" | "empty">("default");
  const [activeTab, setActiveTab] = React.useState<TabFilter>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [layoutMode, setLayoutMode] = React.useState<"grid" | "list">("grid");

  const { data, isLoading, isError, refetch, isFetching } = useSellerDashboard(viewMode);

  const auctions = data?.auctions ?? [];
  const stats = data?.stats ?? {
    activeAuctionsCount: 0,
    totalBidsReceived: 0,
    completedSalesCount: 0,
    totalValueEarnedCents: 0,
  };
  const notifications = data?.notifications ?? [];

  // Filter listings based on active tab and search query
  const filteredAuctions = React.useMemo(() => {
    let list = auctions;
    if (activeTab !== "ALL") {
      list = list.filter((a) => a.status === (activeTab as AuctionStatus));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.make.toLowerCase().includes(q) ||
          a.model.toLowerCase().includes(q) ||
          a.year.toString().includes(q) ||
          a.vin.toLowerCase().includes(q) ||
          (a.city && a.city.toLowerCase().includes(q))
      );
    }
    return list;
  }, [auctions, activeTab, searchQuery]);

  const activeCount = auctions.filter((a) => a.status === "ACTIVE").length;
  const reviewCount = auctions.filter((a) => a.status === "PENDING_MODERATION").length;
  const completedCount = auctions.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="w-full max-w-[1600px] mx-auto py-2 sm:py-4 space-y-7">
      {/* 1. Modern Page Header & Primary Action CTA (Inspired by reference Image 5) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-portal-text">
            Welcome, {user.firstName}
          </h1>
          <p className="mt-1 font-body text-xs sm:text-sm text-portal-text-muted max-w-2xl">
            Manage your personal vehicle inventory, track live sealed dealer bids, and oversee settlements.
          </p>
        </div>

        {/* Action Controls: Primary + LIST VEHICLE Button & Simulation Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Test State Toggle (Active Floor vs First-Time Onboarding) */}
          <div className="inline-flex items-center p-1 rounded-xl bg-portal-surface border border-portal-border text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode("default")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all font-body cursor-pointer text-xs font-semibold",
                viewMode === "default"
                  ? "bg-[#8C383E] dark:bg-[#E59344] text-white shadow-xs"
                  : "text-portal-text-muted hover:text-portal-text"
              )}
            >
              Active Floor ({auctions.length || 3})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("empty")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all font-body cursor-pointer text-xs font-semibold",
                viewMode === "empty"
                  ? "bg-[#8C383E] dark:bg-[#E59344] text-white shadow-xs"
                  : "text-portal-text-muted hover:text-portal-text"
              )}
            >
              First-Time (0)
            </button>
          </div>

          {/* Primary High-Value Action Button matching Image 5 + CREATE CLUB style */}
          <Link
            href="/seller/list-car"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8C383E] dark:bg-[#E59344] hover:bg-[#752B30] dark:hover:bg-[#D9822F] text-white font-body text-xs sm:text-sm font-bold tracking-wide transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" weight="bold" />
            <span>LIST NEW VEHICLE</span>
          </Link>
        </div>
      </div>

      {/* 2. KYC Verification Notice Gate Banner */}
      <KycStatusBanner initialStatus={user.kycStatus} />

      {/* 3. Top 4 Overview Metrics Bar (Inspired by reference Image 4) */}
      <SellerStatsGrid
        stats={stats}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* 4. Full-Width Search & Filter Toolbar (Directly matching Image 5) */}
      <div className="space-y-3.5">
        <div className="relative w-full">
          <MagnifyingGlass
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-portal-text-muted"
            weight="bold"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your listings by VIN, make, model or location..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-portal-border bg-portal-surface text-portal-text placeholder:text-portal-text-muted text-xs sm:text-sm font-body transition-colors focus:outline-none focus:border-[#8C383E] dark:focus:border-[#E59344] shadow-xs"
          />
        </div>

        {/* Filter Pills & Grid/List Switcher Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "All Listings", count: auctions.length },
              { id: "ACTIVE", label: "Live 24h Floor", count: activeCount },
              { id: "PENDING_MODERATION", label: "Under Review", count: reviewCount },
              { id: "COMPLETED", label: "Sold & Finalized", count: completedCount },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabFilter)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl font-body text-xs font-semibold transition-all cursor-pointer border",
                    isActive
                      ? "bg-[#8C383E] dark:bg-[#E59344] text-white border-transparent shadow-xs"
                      : "bg-portal-surface border-portal-border text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
                  )}
                >
                  {tab.label} <span className="opacity-80">({tab.count})</span>
                </button>
              );
            })}
          </div>

          {/* Right Toolbar Controls: Grid/List switchers & Count indicator */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="font-mono text-xs text-portal-text-muted">
              {filteredAuctions.length} {filteredAuctions.length === 1 ? "vehicle" : "vehicles"}
            </span>

            {/* Grid & List Layout Toggle */}
            <div className="inline-flex items-center p-1 rounded-xl bg-portal-surface border border-portal-border">
              <button
                type="button"
                onClick={() => setLayoutMode("grid")}
                title="Grid view"
                aria-label="Grid view"
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  layoutMode === "grid"
                    ? "bg-[#8C383E]/10 dark:bg-[#E59344]/15 text-[#8C383E] dark:text-[#E59344]"
                    : "text-portal-text-muted hover:text-portal-text"
                )}
              >
                <SquaresFour className="w-4 h-4" weight={layoutMode === "grid" ? "bold" : "regular"} />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("list")}
                title="List view"
                aria-label="List view"
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  layoutMode === "list"
                    ? "bg-[#8C383E]/10 dark:bg-[#E59344]/15 text-[#8C383E] dark:text-[#E59344]"
                    : "text-portal-text-muted hover:text-portal-text"
                )}
              >
                <List className="w-4 h-4" weight={layoutMode === "list" ? "bold" : "regular"} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Main 2-Column Responsive Floor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
        {/* Left Column (col-span-2): Vehicle Cards & Listing Wizard Trigger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick-Action Onboarding Card */}
          <ListingStartCard initialKycStatus={user.kycStatus} />

          {/* Listings Management Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-portal-border">
              <div className="flex items-center gap-2">
                <h2 className="font-headline text-lg sm:text-xl font-bold uppercase tracking-tight text-portal-text">
                  My Listings
                </h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-portal-surface border border-portal-border text-portal-text-muted">
                  {filteredAuctions.length}
                </span>
              </div>
            </div>

            {/* Content Rendering: Loading, Error, Empty, or Cards */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl border border-portal-border bg-portal-surface animate-pulse"
                  />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-600 dark:text-red-400">
                Failed to load auction telemetry. Click refresh to retry.
              </div>
            ) : filteredAuctions.length === 0 ? (
              <SellerEmptyState kycStatus={user.kycStatus} />
            ) : layoutMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filteredAuctions.map((auction) => (
                  <SellerAuctionCard key={auction.id} auction={auction} layout="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAuctions.map((auction) => (
                  <SellerAuctionCard key={auction.id} auction={auction} layout="list" />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (col-span-1): Activity Notifications & Seller Protections */}
        <div className="space-y-6">
          <SellerNotificationFeed notifications={notifications} />

          {/* Canadian Seller Safeguards Callout Card */}
          <aside className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 transition-colors hover:border-[#8C383E]/30 dark:hover:border-[#E59344]/30 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-2 border-b border-portal-border">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" weight="bold" />
              <h3 className="font-headline text-base font-bold text-portal-text">
                Canadian Seller Guarantees
              </h3>
            </div>

            <ul className="space-y-3 font-body text-xs text-portal-text-muted">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C383E] dark:bg-[#E59344] mt-1.5 shrink-0" />
                <span>
                  <strong className="text-portal-text">100% Sealed Blind Bids:</strong> Competing dealers never see rival offers, ensuring maximum payout.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C383E] dark:bg-[#E59344] mt-1.5 shrink-0" />
                <span>
                  <strong className="text-portal-text">OMVIC & AMVIC Certified:</strong> Only licensed, insured retail dealerships are eligible to bid.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C383E] dark:bg-[#E59344] mt-1.5 shrink-0" />
                <span>
                  <strong className="text-portal-text">Guaranteed Funds:</strong> All transactions settle via verified bank drafts with zero buyer default risk.
                </span>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
