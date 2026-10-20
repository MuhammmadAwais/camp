"use client";

import * as React from "react";
import {
  CurrencyDollar,
  Gavel,
  CheckCircle,
  Clock,
  ArrowsClockwise,
  TrendUp,
} from "@phosphor-icons/react";
import type { SellerDashboardStats } from "@/lib/types/seller";
import { formatCadCents } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  stats: SellerDashboardStats;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function SellerStatsGrid({ stats, onRefresh, isRefreshing }: Props) {
  const statItems = [
    {
      label: "TOTAL VOLUME SETTLED",
      value: stats.totalValueEarnedCents > 0 ? formatCadCents(stats.totalValueEarnedCents) : "$0.00 CAD",
      icon: CurrencyDollar,
      trend: "Net Settled Volume",
      isPositive: true,
      highlight: false,
    },
    {
      label: "TOTAL DEALER BIDS",
      value: stats.totalBidsReceived.toString(),
      icon: Gavel,
      trend: "Recorded Floor Events",
      isPositive: false,
      highlight: false,
    },
    {
      label: "COMPLETED SALES",
      value: stats.completedSalesCount.toString(),
      icon: CheckCircle,
      trend: "100% Settlement Rate",
      isPositive: true,
      highlight: false,
    },
    {
      label: "ACTIVE AUCTIONS",
      value: stats.activeAuctionsCount.toString(),
      icon: Clock,
      trend: "24h Sealed Floor",
      isPositive: true,
      highlight: stats.activeAuctionsCount > 0,
    },
  ];

  return (
    <section className="space-y-3.5">
      {/* Overview Header with clean Refresh Data action matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-headline text-lg sm:text-xl font-bold uppercase tracking-tight text-portal-text">
            Financial & Auction Overview
          </h2>
          <p className="font-body text-xs sm:text-sm text-portal-text-muted">
            Track your live listings, competitive dealer bids, and verified transaction settlements.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
          >
            <ArrowsClockwise
              className={cn("w-3.5 h-3.5 text-[#8C383E] dark:text-[#E59344]", isRefreshing && "animate-spin")}
              weight="bold"
            />
            <span>Refresh Data</span>
          </button>
        )}
      </div>

      {/* Single Unified Stats Overview Bar matching Reference Image 4 */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-4 sm:p-6 shadow-xs">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-portal-border">
          {statItems.map(({ label, value, icon: Icon, trend, isPositive, highlight }, idx) => (
            <div
              key={label}
              className={cn(
                "flex items-center justify-between gap-4 transition-colors",
                idx === 0 ? "lg:pr-6" : idx === 3 ? "lg:pl-6" : "lg:px-6"
              )}
            >
              {/* Left Side: Metric Information */}
              <div className="min-w-0 flex-1">
                <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-portal-text-muted truncate">
                  {label}
                </dt>
                <dd className="mt-1 font-headline text-2xl sm:text-3xl font-bold text-portal-text tracking-tight tabular-nums truncate">
                  {value}
                </dd>
                <div className="mt-1 flex items-center gap-1.5 font-body text-xs truncate">
                  {isPositive ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <TrendUp className="w-3.5 h-3.5 shrink-0" weight="bold" />
                      <span>{trend}</span>
                    </span>
                  ) : (
                    <span className="text-portal-text-muted font-normal">{trend}</span>
                  )}
                  {highlight && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      LIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Big Phosphor Icon side-by-side with NO rounded background */}
              <div className="shrink-0 flex items-center justify-center text-[#E59344] dark:text-[#E59344]">
                <Icon className="w-8 h-8 sm:w-9 sm:h-9" weight="duotone" />
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
