"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Gavel,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  TrendingUp,
  Zap,
  RefreshCw,
  Award,
  Trophy,
  Medal,
  Car,
  ChevronsUpDown,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import type { ListingDetailData, UnsealedDealerBid } from "@/lib/types/seller";
import { apiClient } from "@/lib/api-client";
import { VehicleSwitcherModal } from "@/components/seller/VehicleSwitcherModal";

interface DealerSelectionViewProps {
  listingId: string;
}

export function DealerSelectionView({ listingId }: DealerSelectionViewProps) {
  const router = useRouter();
  const [data, setData] = useState<ListingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "distance">("price");
  const [selectedBid, setSelectedBid] = useState<UnsealedDealerBid | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.api.get<ListingDetailData>(`/api/listings/${listingId}?status=UNSEALED`);
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || "Failed to load unsealed dealer bids");
        }
      } catch {
        setError("Unable to connect to server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBids();
  }, [listingId]);

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-portal-primary animate-spin" />
          <p className="text-sm font-medium text-portal-text-muted">Unsealing certified dealership bids...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-portal-text">Bids Not Available</h3>
        <p className="text-sm text-portal-text-muted">{error || "Could not load dealer bids."}</p>
        <Link href={`/seller/listings/${listingId}`} className="text-xs text-portal-primary hover:underline font-semibold">
          Return to Auction Floor
        </Link>
      </div>
    );
  }

  const { auction, unsealedBids = [] } = data;

  // Sort bids
  const sortedBids = [...unsealedBids].sort((a, b) => {
    if (sortBy === "price") return b.bidAmountCents - a.bidAmountCents;
    return a.distanceKm - b.distanceKm;
  });

  const highestBid = unsealedBids.reduce((max, b) => (b.bidAmountCents > max ? b.bidAmountCents : max), 0);
  const surplusAboveReserveCents = Math.max(0, highestBid - auction.reservePriceCents);

  // Handle final offer acceptance
  const handleConfirmAccept = async () => {
    if (!selectedBid) return;
    setIsAccepting(true);

    try {
      const res = await apiClient.api.post(`/api/listings/${listingId}`, {
        bidId: selectedBid.id,
      });

      if (res.success) {
        router.push(`/seller/listings/${listingId}/appointment`);
      } else {
        alert(res.error || "Failed to accept bid");
      }
    } catch {
      alert("Error processing dealership acceptance");
    } finally {
      setIsAccepting(false);
      setConfirmModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb, VIN & Vehicle Switcher Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/seller/listings/${listingId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-portal-text-muted hover:text-portal-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Auction Floor</span>
          </Link>
          <span className="text-portal-border hidden sm:inline">•</span>
          <span className="text-xs font-mono text-portal-text-muted hidden sm:inline">
            VIN: {auction.vin}
          </span>
        </div>

        {/* Switch Vehicle Pill Button */}
        <button
          type="button"
          id="btn-switch-vehicle"
          onClick={() => setVehicleModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-portal-surface border border-portal-border hover:border-portal-primary/50 text-xs font-medium text-portal-text shadow-2xs hover:bg-portal-surface-hover transition-all cursor-pointer group self-start sm:self-auto"
        >
          <Car className="w-3.5 h-3.5 text-portal-primary" />
          <span className="font-semibold">{auction.year} {auction.make} {auction.model}</span>
          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
            {unsealedBids.length} Offers
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-portal-text-muted group-hover:text-portal-text transition-colors" />
        </button>
      </div>

      {/* Main Header Card with Dashboard-Style 4-Metric Bar (Borderless, Soft Gradient Canvas Blend) */}
      <div className="bg-gradient-to-b from-portal-surface/90 via-portal-surface/40 to-transparent backdrop-blur-xs rounded-2xl p-5 sm:p-6 space-y-5 border-0 shadow-none">
        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-portal-text tracking-tight">
          Select Your Winning Dealership Offer
        </h1>

        {/* 4-Metric Performance Bar (Executive Dashboard Style with Vertical Dividers) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-portal-border-subtle/60">
          {/* Col 1: Top Dealer Offer */}
          <div className="flex items-center justify-between pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Highest Dealer Offer
              </span>
              <span className="font-headline text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block">
                {formatCadCents(highestBid)}
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+{formatCadCents(surplusAboveReserveCents)} above your reserve</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
          </div>

          {/* Col 2: Total Dealer Competition */}
          <div className="flex items-center justify-between sm:border-l border-portal-border-subtle/60 sm:pl-4 pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Dealer Competition
              </span>
              <span className="font-headline text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block">
                {unsealedBids.length} Verified Bids
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                All bids meet your minimum price
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <Gavel className="w-5 h-5" />
            </div>
          </div>

          {/* Col 3: Acceptance Window Countdown */}
          <div className="flex items-center justify-between lg:border-l border-portal-border-subtle/60 lg:pl-4 pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Time Remaining
              </span>
              <span className="font-mono text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block tabular-nums">
                23h 58m Left
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                Guaranteed payout price
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Col 4: Protected Dealer Escrow */}
          <div className="flex items-center justify-between sm:border-l border-portal-border-subtle/60 sm:pl-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Protected Payout
              </span>
              <span className="font-headline text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block">
                Direct Wire Transfer
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                Safe, regulated & fully insured
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3D STAGE ARENA CONTAINER WITH GRID FLOOR */}
      <div className="relative rounded-3xl border border-portal-border bg-portal-surface/60 p-4 sm:p-6 md:p-8 space-y-6 overflow-hidden">
        {/* Subtle Architectural Grid Pattern Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 90% 70% at 50% 60%, black 50%, transparent 100%)",
            color: "var(--portal-border)",
          }}
        />

        {/* Section Header & Sort Switcher */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-portal-border-subtle">
          <div>
            <h2 className="text-lg font-bold font-headline text-portal-text flex items-center gap-2">
              <span>Dealership Leaderboard</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-portal-surface-hover border border-portal-border text-portal-text-muted">
                {sortedBids.length} Offers
              </span>
            </h2>
            <p className="text-xs text-portal-text-muted mt-0.5">
              Verified Canadian licensed automotive wholesale bids
            </p>
          </div>

          {/* Sort Switcher */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-portal-text-muted">Sort by:</span>
            <div className="inline-flex rounded-xl bg-portal-surface border border-portal-border p-1 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setSortBy("price")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  sortBy === "price"
                    ? "bg-portal-primary text-white shadow-xs font-semibold"
                    : "text-portal-text-muted hover:text-portal-text"
                }`}
              >
                Highest Bid
              </button>
              <button
                type="button"
                onClick={() => setSortBy("distance")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  sortBy === "distance"
                    ? "bg-portal-primary text-white shadow-xs font-semibold"
                    : "text-portal-text-muted hover:text-portal-text"
                }`}
              >
                Nearest Dealership
              </button>
            </div>
          </div>
        </div>

        {/* TOP 3 3D STAGE & PEDESTALS */}
        {sortedBids.length >= 3 ? (
          <div className="relative z-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-4 lg:gap-6 items-end [perspective:1200px]">
              {/* 2ND PLACE STAGE COLUMN (Left on desktop - Inward Tilt) */}
              {(() => {
                const bid = sortedBids[1];
                return (
                  <div
                    key={bid.id}
                    className="group order-2 md:order-1 flex flex-col transition-all duration-300 transform-gpu md:[transform:rotateY(5deg)_rotateZ(-0.5deg)] md:hover:[transform:rotateY(0deg)_translateY(-8px)] hover:z-20 cursor-default"
                  >
                    {/* Offer Card */}
                    <div className="bg-portal-surface border border-neutral-300 dark:border-white/10 rounded-t-2xl p-5 shadow-xs relative flex flex-col justify-between border-t-2 border-t-slate-400 transition-all duration-300 group-hover:shadow-md">
                      <div className="space-y-3.5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-500/15 text-slate-500 dark:text-slate-300 border border-slate-500/30 flex items-center justify-center font-black font-mono shadow-xs">
                              <Medal className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                            </div>
                            <span className="font-headline text-sm font-bold text-portal-text">
                              2nd Place
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-portal-surface-hover border border-portal-border text-portal-text-muted font-medium">
                            {bid.omvicNumber}
                          </span>
                        </div>

                        {/* Dealership Name */}
                        <h3 className="font-headline text-base font-bold text-portal-text line-clamp-1">
                          {bid.dealershipName}
                        </h3>

                        {/* Mini 2x2 Specs Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border-subtle">
                          <div className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{bid.rating.toFixed(1)} <span className="text-portal-text-muted font-normal">({bid.reviewCount})</span></span>
                          </div>
                          <div className="flex items-center gap-1 text-portal-text-muted truncate">
                            <MapPin className="w-3 h-3 text-portal-primary shrink-0" />
                            <span className="truncate">{bid.city} ({bid.distanceKm} km)</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Zap className="w-3 h-3 shrink-0" />
                            <span>{bid.payoutSpeedDays}-Day Direct Wire Payout</span>
                          </div>
                        </div>

                        {/* Price Block */}
                        <div className="pt-2">
                          <span className="font-mono text-2xl font-black text-portal-text block">
                            {formatCadCents(bid.bidAmountCents)}
                          </span>
                          <span className="text-[11px] text-portal-text-muted block mt-0.5">
                            Meets your reserve price
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-3 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBid(bid);
                            setConfirmModalOpen(true);
                          }}
                          className="w-full py-2 px-3 rounded-xl font-semibold text-xs border border-portal-border hover:bg-portal-surface-hover text-portal-text transition-colors cursor-pointer"
                        >
                          Accept Offer
                        </button>
                      </div>
                    </div>

                    {/* 3D Stage Pedestal Base #2 (Silver / Platinum Runner-Up) */}
                    <div className="border border-t-0 border-neutral-300 dark:border-white/10 rounded-b-2xl bg-gradient-to-b from-slate-200/50 dark:from-slate-800/40 via-portal-surface to-portal-surface/80 h-20 sm:h-24 relative overflow-hidden flex flex-col items-center justify-center select-none transition-all duration-300 group-hover:border-slate-400 dark:group-hover:border-slate-300/40">
                      {/* Geometric grid lines */}
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-35"
                        style={{
                          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                          backgroundSize: "16px 16px",
                          color: "var(--portal-text)",
                        }}
                      />
                      <span className="font-mono font-black text-5xl text-slate-400 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-white group-hover:scale-110 tracking-tighter transition-all duration-300 drop-shadow-xs">
                        02
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400 font-bold -mt-1 z-10 px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700">
                        RUNNER-UP
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* 1ST PLACE STAGE COLUMN (Center on desktop - Elevated Tallest) */}
              {(() => {
                const bid = sortedBids[0];
                return (
                  <div
                    key={bid.id}
                    className="group order-1 md:order-2 flex flex-col md:-translate-y-4 z-10 transition-all duration-300 transform-gpu md:[transform:rotateY(0deg)] md:hover:[transform:translateY(-12px)] hover:z-20 cursor-default"
                  >
                    {/* Offer Card */}
                    <div className="bg-portal-surface border-2 border-amber-500/70 dark:border-amber-400/60 rounded-t-2xl p-5 sm:p-6 shadow-sm relative flex flex-col justify-between transition-all duration-300 group-hover:shadow-lg">
                      {/* Top Crown Ribbon */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                        <Trophy className="w-3 h-3" />
                        <span>TOP CERTIFIED OFFER</span>
                      </div>

                      <div className="space-y-4 pt-1">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center font-black font-mono shadow-xs">
                              <Trophy className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                              <span className="font-headline text-base font-black text-portal-text block">
                                1st Place Winner
                              </span>
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block font-mono">
                                {sortBy === "price" ? "HIGHEST BID" : "NEAREST DEALER"}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">
                            {bid.omvicNumber}
                          </span>
                        </div>

                        {/* Dealership Name */}
                        <h3 className="font-headline text-lg font-bold text-portal-text">
                          {bid.dealershipName}
                        </h3>

                        {/* Mini 2x2 Specs Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <div className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{bid.rating.toFixed(1)} <span className="text-portal-text-muted font-normal">({bid.reviewCount})</span></span>
                          </div>
                          <div className="flex items-center gap-1 text-portal-text-muted truncate">
                            <MapPin className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                            <span className="truncate">{bid.city} ({bid.distanceKm} km)</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Zap className="w-3.5 h-3.5 shrink-0" />
                            <span>{bid.payoutSpeedDays}-Day Direct Wire Transfer</span>
                          </div>
                        </div>

                        {/* Price Block */}
                        <div className="pt-2">
                          <span className="font-mono text-3xl font-black text-portal-text block tracking-tight">
                            {formatCadCents(bid.bidAmountCents)}
                          </span>
                          {surplusAboveReserveCents > 0 && sortBy === "price" ? (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>+{formatCadCents(surplusAboveReserveCents)} above your reserve</span>
                            </span>
                          ) : (
                            <span className="text-xs text-portal-text-muted mt-0.5 block">
                              Meets your reserve price
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Primary Action Button */}
                      <div className="pt-4 mt-1">
                        <button
                          type="button"
                          id="btn-accept-top-offer"
                          onClick={() => {
                            setSelectedBid(bid);
                            setConfirmModalOpen(true);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-portal-primary hover:bg-portal-primary-hover shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 group"
                        >
                          <span>Accept Offer & Lock Dealer</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>

                    {/* 3D Stage Pedestal Base #1 (Radiant Gold Champion Pedestal) */}
                    <div className="border-2 border-t-0 border-amber-500/70 dark:border-amber-400/60 rounded-b-2xl bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-portal-surface/90 h-28 sm:h-32 relative overflow-hidden flex flex-col items-center justify-center select-none transition-all duration-300 group-hover:border-amber-500 group-hover:from-amber-500/30">
                      {/* Geometric grid lines */}
                      <div
                        className="absolute inset-0 opacity-25 pointer-events-none transition-opacity duration-300 group-hover:opacity-45"
                        style={{
                          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                          backgroundSize: "16px 16px",
                          color: "var(--portal-accent)",
                        }}
                      />
                      <span className="font-mono font-black text-6xl text-amber-500 dark:text-amber-400 group-hover:scale-110 tracking-tighter transition-all duration-300 drop-shadow-sm">
                        01
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-300 font-extrabold -mt-1 z-10 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 shadow-2xs">
                        WINNING OFFER
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* 3RD PLACE STAGE COLUMN (Right on desktop - Inward Tilt) */}
              {(() => {
                const bid = sortedBids[2];
                return (
                  <div
                    key={bid.id}
                    className="group order-3 md:order-3 flex flex-col transition-all duration-300 transform-gpu md:[transform:rotateY(-5deg)_rotateZ(0.5deg)] md:hover:[transform:rotateY(0deg)_translateY(-8px)] hover:z-20 cursor-default"
                  >
                    {/* Offer Card */}
                    <div className="bg-portal-surface border border-neutral-300 dark:border-white/10 rounded-t-2xl p-5 shadow-xs relative flex flex-col justify-between border-t-2 border-t-orange-600/70 transition-all duration-300 group-hover:shadow-md">
                      <div className="space-y-3.5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-700/15 text-orange-600 dark:text-orange-400 border border-orange-700/30 flex items-center justify-center font-black font-mono shadow-xs">
                              <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="font-headline text-sm font-bold text-portal-text">
                              3rd Place
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-portal-surface-hover border border-portal-border text-portal-text-muted font-medium">
                            {bid.omvicNumber}
                          </span>
                        </div>

                        {/* Dealership Name */}
                        <h3 className="font-headline text-base font-bold text-portal-text line-clamp-1">
                          {bid.dealershipName}
                        </h3>

                        {/* Mini 2x2 Specs Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border-subtle">
                          <div className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{bid.rating.toFixed(1)} <span className="text-portal-text-muted font-normal">({bid.reviewCount})</span></span>
                          </div>
                          <div className="flex items-center gap-1 text-portal-text-muted truncate">
                            <MapPin className="w-3 h-3 text-portal-primary shrink-0" />
                            <span className="truncate">{bid.city} ({bid.distanceKm} km)</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Zap className="w-3 h-3 shrink-0" />
                            <span>{bid.payoutSpeedDays}-Day Direct Wire Payout</span>
                          </div>
                        </div>

                        {/* Price Block */}
                        <div className="pt-2">
                          <span className="font-mono text-2xl font-black text-portal-text block">
                            {formatCadCents(bid.bidAmountCents)}
                          </span>
                          <span className="text-[11px] text-portal-text-muted block mt-0.5">
                            Meets your reserve price
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-3 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBid(bid);
                            setConfirmModalOpen(true);
                          }}
                          className="w-full py-2 px-3 rounded-xl font-semibold text-xs border border-portal-border hover:bg-portal-surface-hover text-portal-text transition-colors cursor-pointer"
                        >
                          Accept Offer
                        </button>
                      </div>
                    </div>

                    {/* 3D Stage Pedestal Base #3 (Warm Bronze / Copper Pedestal) */}
                    <div className="border border-t-0 border-neutral-300 dark:border-white/10 rounded-b-2xl bg-gradient-to-b from-orange-950/20 dark:from-orange-950/30 via-portal-surface to-portal-surface/80 h-16 sm:h-18 relative overflow-hidden flex flex-col items-center justify-center select-none transition-all duration-300 group-hover:border-orange-500/40">
                      {/* Geometric grid lines */}
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-35"
                        style={{
                          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                          backgroundSize: "16px 16px",
                          color: "var(--portal-text)",
                        }}
                      />
                      <span className="font-mono font-black text-4xl text-orange-600 dark:text-orange-400 group-hover:text-orange-500 dark:group-hover:text-orange-300 group-hover:scale-110 tracking-tighter transition-all duration-300 drop-shadow-xs">
                        03
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-orange-700 dark:text-orange-400 font-bold -mt-1 z-10 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                        CONTENDER
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Connecting Stage Baseline Floor */}
            <div className="border-t border-portal-border pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-portal-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-portal-primary" />
                <span>Top 3 Verified Dealership Offers</span>
              </span>
              <span>Certified Canadian Dealership Network</span>
              <span>All offers guaranteed for 24 hours</span>
            </div>
          </div>
        ) : (
          /* Fallback for when there are fewer than 3 bids */
          <div className="space-y-3.5">
            {sortedBids.map((bid, index) => {
              const isHighest = bid.bidAmountCents === highestBid;
              return (
                <div
                  key={bid.id}
                  className={`bg-portal-surface border rounded-2xl p-5 sm:p-6 transition-all shadow-xs relative ${
                    isHighest ? "border-amber-500/50 shadow-md" : "border-portal-border"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-portal-surface-hover border border-portal-border flex items-center justify-center font-mono text-xs font-bold text-portal-text">
                          #{index + 1}
                        </span>
                        <h3 className="text-base font-bold text-portal-text">
                          {bid.dealershipName}
                        </h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-portal-surface-hover border border-portal-border text-portal-text-muted">
                          {bid.omvicNumber}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-portal-text-muted">
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{bid.rating.toFixed(1)}</span>
                        </span>
                        <span>•</span>
                        <span>{bid.city} ({bid.distanceKm} km away)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-2xl font-black text-portal-text">
                        {formatCadCents(bid.bidAmountCents)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBid(bid);
                          setConfirmModalOpen(true);
                        }}
                        className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-portal-primary hover:bg-portal-primary-hover shadow-sm"
                      >
                        Accept Offer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REMAINING RANKED OFFERS (Rank 4+) */}
      {sortedBids.length > 3 && (
        <div className="pt-2 space-y-3">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-portal-text-muted flex items-center gap-2">
            <span>Additional Verified Offers</span>
            <span className="px-1.5 py-0.2 rounded bg-portal-surface-hover border border-portal-border">
              {sortedBids.length - 3}
            </span>
          </h3>
          <div className="space-y-2.5">
            {sortedBids.slice(3).map((bid, index) => {
              const rank = index + 4;
              return (
                <div
                  key={bid.id}
                  className="bg-portal-surface border border-portal-border rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-portal-primary/40 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-portal-surface-hover border border-portal-border flex items-center justify-center font-mono text-xs font-bold text-portal-text-muted shrink-0">
                      #{rank}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-portal-text">
                          {bid.dealershipName}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-portal-surface-hover border border-portal-border text-portal-text-muted">
                          {bid.omvicNumber}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-portal-text-muted mt-0.5">
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{bid.rating.toFixed(1)}</span>
                        </span>
                        <span>•</span>
                        <span>{bid.city} ({bid.distanceKm} km)</span>
                        <span>•</span>
                        <span>{bid.payoutSpeedDays}-Day Wire</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-portal-border-subtle">
                    <span className="font-mono text-lg font-bold text-portal-text">
                      {formatCadCents(bid.bidAmountCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBid(bid);
                        setConfirmModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-portal-border hover:bg-portal-surface-hover text-portal-text transition-colors cursor-pointer"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && selectedBid && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-portal-surface border border-portal-border rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-portal-primary/10 text-portal-primary flex items-center justify-center mx-auto">
              <Gavel className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold font-headline text-portal-text">
                Accept Dealership Offer?
              </h3>
              <p className="text-xs text-portal-text-muted">
                You are accepting the legally binding offer from {selectedBid.dealershipName}.
              </p>
            </div>

            <div className="bg-portal-surface-hover border border-portal-border rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-portal-text-muted">Purchase Price:</span>
                <span className="font-mono font-bold text-portal-text text-sm">
                  {formatCadCents(selectedBid.bidAmountCents)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-portal-text-muted">Buyer Dealership:</span>
                <span className="font-medium text-portal-text">{selectedBid.dealershipName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-portal-text-muted">Location:</span>
                <span>{selectedBid.city}, {selectedBid.province}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-portal-text-muted">Escrow Settlement:</span>
                <span className="text-emerald-600 font-semibold">{selectedBid.payoutSpeedDays}-Day Direct Wire</span>
              </div>
            </div>

            <div className="text-[11px] text-portal-text-muted text-left">
              Upon acceptance, your official Dealership Handover Voucher will be generated with full directions, contact info, and required documentation.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={isAccepting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium border border-portal-border hover:bg-portal-surface-hover text-portal-text-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-accept-bid"
                onClick={handleConfirmAccept}
                disabled={isAccepting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-portal-primary hover:bg-portal-primary-hover shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAccepting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Locking...</span>
                  </>
                ) : (
                  <span>Confirm & Generate Voucher</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Switcher Modal */}
      <VehicleSwitcherModal
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        currentListingId={listingId}
        currentListingFallback={{
          year: auction.year,
          make: auction.make,
          model: auction.model,
          vin: auction.vin,
          status: auction.status,
          thumbnailUrl: data.photos?.[0]?.url,
        }}
      />
    </div>
  );
}
