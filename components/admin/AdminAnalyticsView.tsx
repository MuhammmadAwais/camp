"use client";

import React from "react";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Gavel,
  CheckCircle2,
  Users,
  MapPin,
  Calendar,
  Building2,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";

export function AdminAnalyticsView() {
  const kpiData = {
    grossMerchandiseVolumeCents: 1482050000, // $14,820,500.00 CAD
    gmvGrowthPercent: 23.4,
    clearanceRatePercent: 88.6,
    averageBidsPerLot: 14.8,
    averageSellerSurplusCents: 264000, // $2,640.00 CAD above trade-in
    activeDealerNetworkCount: 142,
  };

  const provincialBreakdown = [
    {
      province: "Ontario",
      code: "ON",
      regulator: "OMVIC",
      volumeCents: 894000000,
      sharePercent: 60.3,
      dealersCount: 88,
      lotsCount: 312,
    },
    {
      province: "Alberta",
      code: "AB",
      regulator: "AMVIC",
      volumeCents: 312000000,
      sharePercent: 21.1,
      dealersCount: 29,
      lotsCount: 104,
    },
    {
      province: "British Columbia",
      code: "BC",
      regulator: "VSA",
      volumeCents: 178000000,
      sharePercent: 12.0,
      dealersCount: 16,
      lotsCount: 62,
    },
    {
      province: "Quebec",
      code: "QC",
      regulator: "OPC",
      volumeCents: 98050000,
      sharePercent: 6.6,
      dealersCount: 9,
      lotsCount: 38,
    },
  ];

  const recentTransactions = [
    {
      id: "tx-1",
      vehicle: "2023 Porsche Macan GTS AWD",
      buyer: "Pfaff Porsche Markham",
      regulator: "OMVIC-481920",
      province: "ON",
      amountCents: 3825000,
      surplusOverTradeInCents: 345000,
      completedAt: "10 mins ago",
    },
    {
      id: "tx-2",
      vehicle: "2021 Ford F-150 Lariat 502A",
      buyer: "Woodbine Ford Commercial",
      regulator: "OMVIC-312984",
      province: "ON",
      amountCents: 3250000,
      surplusOverTradeInCents: 280000,
      completedAt: "42 mins ago",
    },
    {
      id: "tx-3",
      vehicle: "2023 BMW M340i xDrive",
      buyer: "Budds' BMW Oakville",
      regulator: "OMVIC-192847",
      province: "ON",
      amountCents: 4100000,
      surplusOverTradeInCents: 310000,
      completedAt: "2 hours ago",
    },
    {
      id: "tx-4",
      vehicle: "2022 Lexus RX 350 F SPORT",
      buyer: "Stampede Toyota Calgary",
      regulator: "AMVIC-849201",
      province: "AB",
      amountCents: 4450000,
      surplusOverTradeInCents: 295000,
      completedAt: "4 hours ago",
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary text-xs font-bold font-mono uppercase tracking-wider border border-portal-primary/20">
              Executive Dashboard
            </span>
            <span className="text-xs text-portal-text-muted font-mono">
              Canadian Wholesale Market Liquidity
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-portal-text font-headline tracking-tight">
            Platform Analytics & Provincial Volume
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Real-time Gross Merchandise Value (GMV), provincial regulatory distribution, and consumer surplus metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover text-xs font-mono text-portal-text-muted">
            All Values in Integer CAD Cents
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV */}
        <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text-muted">
              Gross Merchandise Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-portal-primary/10 text-portal-primary flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-portal-text">
            {formatCadCents(kpiData.grossMerchandiseVolumeCents)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-mono font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{kpiData.gmvGrowthPercent}% vs previous month</span>
          </div>
        </div>

        {/* Clearance Rate */}
        <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text-muted">
              Auction Clearance Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-portal-text">
            {kpiData.clearanceRatePercent}%
          </div>
          <p className="text-xs text-portal-text-muted font-mono">
            Auctions successfully unsealed & matched
          </p>
        </div>

        {/* Bidding Velocity */}
        <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text-muted">
              Bidding Velocity
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Gavel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-portal-text">
            {kpiData.averageBidsPerLot} Bids/Lot
          </div>
          <p className="text-xs text-portal-text-muted font-mono">
            Average competitive dealer bids received
          </p>
        </div>

        {/* Average Consumer Surplus */}
        <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text-muted">
              Avg. Consumer Surplus
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-500">
            +{formatCadCents(kpiData.averageSellerSurplusCents)}
          </div>
          <p className="text-xs text-portal-text-muted font-mono">
            Average surplus earned above dealer trade-in
          </p>
        </div>
      </div>

      {/* 2-Column Split: Provincial Volume & Recent Transaction Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Provincial Distribution (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-portal-border">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-portal-primary" />
              <h2 className="text-sm font-bold text-portal-text uppercase tracking-wider font-mono">
                Provincial Regulatory Volume
              </h2>
            </div>
            <span className="text-xs font-mono text-portal-text-muted">
              {kpiData.activeDealerNetworkCount} Licensed Dealers
            </span>
          </div>

          <div className="space-y-4">
            {provincialBreakdown.map((item) => (
              <div key={item.code} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-portal-text">
                      {item.province} ({item.code})
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-portal-surface-hover text-portal-text-muted text-[10px] font-bold">
                      {item.regulator}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-portal-text">
                      {formatCadCents(item.volumeCents)}
                    </span>
                    <span className="text-portal-text-muted ml-2">({item.sharePercent}%)</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-portal-surface-hover overflow-hidden">
                  <div
                    className="h-full bg-portal-primary rounded-full transition-all duration-500"
                    style={{ width: `${item.sharePercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-portal-text-muted">
                  <span>{item.dealersCount} licensed dealer groups</span>
                  <span>{item.lotsCount} completed wholesale transactions</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Wholesale Transaction Feed (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-portal-border">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-portal-primary" />
              <h2 className="text-sm font-bold text-portal-text uppercase tracking-wider font-mono">
                Recent Wholesale Settlements
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-500 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              EFT Verified
            </span>
          </div>

          <div className="divide-y divide-portal-border">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-portal-text truncate">{tx.vehicle}</span>
                  <span className="font-mono text-xs font-black text-portal-text shrink-0">
                    {formatCadCents(tx.amountCents)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-portal-text-muted">
                  <span>
                    Buyer: {tx.buyer} ({tx.regulator})
                  </span>
                  <span className="text-emerald-500 font-bold">
                    +{formatCadCents(tx.surplusOverTradeInCents)} surplus
                  </span>
                </div>

                <span className="text-[10px] text-portal-text-muted font-mono block">
                  Settled {tx.completedAt}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
