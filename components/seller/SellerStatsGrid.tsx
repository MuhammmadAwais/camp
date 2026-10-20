"use client";

import { DollarSign, Gavel, Handshake, Timer } from "lucide-react";
import type { SellerDashboardStats } from "@/lib/types/seller";
import { formatCadCents } from "@/lib/utils";

interface Props {
  stats: SellerDashboardStats;
}

export function SellerStatsGrid({ stats }: Props) {
  const statItems = [
    {
      label: "Active auctions",
      value: stats.activeAuctionsCount.toString(),
      icon: Timer,
      hint: "24h sealed-bid floor",
      highlight: stats.activeAuctionsCount > 0,
    },
    {
      label: "Sealed dealer bids",
      value: stats.totalBidsReceived.toString(),
      icon: Gavel,
      hint: "Amounts unsealed post-clock",
      highlight: false,
    },
    {
      label: "Completed sales",
      value: stats.completedSalesCount.toString(),
      icon: Handshake,
      hint: "Settled via verified draft",
      highlight: false,
    },
    {
      label: "Gross volume settled",
      value: stats.totalValueEarnedCents > 0 ? formatCadCents(stats.totalValueEarnedCents) : "$0 CAD",
      icon: DollarSign,
      hint: "Integer CAD cents invariant",
      highlight: false,
    },
  ];

  return (
    <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statItems.map(({ label, value, icon: Icon, hint, highlight }) => (
        <div
          key={label}
          className="relative rounded-2xl border border-portal-border bg-portal-surface p-4 sm:p-5 transition-all duration-200 hover:border-[#8C383E]/40 dark:hover:border-[#E59344]/40 hover:shadow-sm"
        >
          {highlight && (
            <span className="absolute top-3 right-3 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E59344] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E59344]" />
            </span>
          )}
          <dt className="flex items-center gap-1.5 font-body text-xs text-portal-text-muted">
            <Icon className="w-4 h-4 text-[#8C383E] dark:text-[#E59344] shrink-0" aria-hidden />
            <span className="truncate font-medium">{label}</span>
          </dt>
          <dd className="mt-2.5 font-mono text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums text-portal-text">
            {value}
          </dd>
          <p className="mt-1 font-body text-[11px] text-portal-text-muted truncate">{hint}</p>
        </div>
      ))}
    </dl>
  );
}
