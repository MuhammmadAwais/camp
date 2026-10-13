'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Car,
  CurrencyCircleDollar,
  ShieldCheck,
  WarningCircle,
  Plus,
  ArrowRight,
  ChartLineUp,
  Clock,
} from '@phosphor-icons/react';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const userName = user?.name || 'Verified Seller';

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-body">
      {/* 1. Header Greeting & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Welcome back, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Monitor active 24-hour auctions, sealed bid telemetry, and appraisal valuations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/seller/listings/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#008C87] hover:bg-[#00736F] text-white text-xs sm:text-sm font-semibold transition-all active:scale-[0.99] shadow-sm cursor-pointer"
          >
            <Plus className="size-4" weight="bold" />
            <span>List Vehicle (VIN)</span>
          </Link>
        </div>
      </div>

      {/* 2. KYC Verification Status Gate Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#131215]/80 border border-[#E59344]/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="size-10 rounded-xl bg-[#E59344]/15 border border-[#E59344]/30 text-[#E59344] flex items-center justify-center shrink-0">
            <WarningCircle className="size-6" weight="duotone" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Seller Identity Verification (PIPEDA & Law 25 Compliance)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              To accept unsealed bids and collect bank disbursements, complete quick KYC identity verification.
            </p>
          </div>
        </div>

        <Link
          href="/seller/kyc"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
        >
          <span>Complete Verification</span>
          <ArrowRight className="size-3.5" weight="bold" />
        </Link>
      </div>

      {/* 3. Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#131215]/65 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium">Active Auctions</span>
            <Car className="size-5 text-[#008C87]" weight="duotone" />
          </div>
          <div className="font-headline font-bold text-2xl sm:text-3xl text-white">
            1
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#008C87] mt-2">
            <Clock className="size-3.5" />
            <span>18h 42m remaining</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#131215]/65 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium">Sealed Bids Received</span>
            <CurrencyCircleDollar className="size-5 text-[#E59344]" weight="duotone" />
          </div>
          <div className="font-headline font-bold text-2xl sm:text-3xl text-white">
            7
          </div>
          <div className="text-[11px] text-neutral-400 mt-2">
            Sealed amounts locked until timer expires
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#131215]/65 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium">Est. Market Value</span>
            <ChartLineUp className="size-5 text-emerald-400" weight="duotone" />
          </div>
          <div className="font-headline font-bold text-2xl sm:text-3xl text-white">
            $38,450 CAD
          </div>
          <div className="text-[11px] text-emerald-400 mt-2">
            +14% vs traditional trade-in offers
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#131215]/65 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium">Trust Score</span>
            <ShieldCheck className="size-5 text-[#008C87]" weight="duotone" />
          </div>
          <div className="font-headline font-bold text-2xl sm:text-3xl text-white">
            98 / 100
          </div>
          <div className="text-[11px] text-neutral-400 mt-2">
            Verified Clean Carfax Record
          </div>
        </div>
      </div>

      {/* 4. Active Vehicle Listing Showcase */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#131215]/65 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div>
            <h2 className="font-headline font-bold text-lg text-white">
              Current Exchange Listing
            </h2>
            <p className="text-xs text-neutral-400">
              Live in 24-hour sealed wholesale network across Ontario
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#008C87]/20 border border-[#008C87]/40 text-[#008C87] text-xs font-semibold">
            Active Auction
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-headline font-bold text-base sm:text-lg text-white">
              2022 Porsche Macan GTS AWD
            </h3>
            <p className="text-xs font-mono text-neutral-400">
              VIN: WP1AB2AY9NL094821 • 34,200 KM • Volcano Grey Metallic
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-neutral-400 block">Verified Reserve</span>
              <span className="font-bold text-sm text-white">$64,000 CAD</span>
            </div>
            <Link
              href="/seller/listings/WP1AB2AY9NL094821"
              className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              View Telemetry
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
