"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Gavel,
  Clock,
  Lock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Building2,
  DollarSign,
  Search,
  Filter,
  Car,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { WholesaleAuctionItem } from "@/lib/types/dealer";
import { SealedBidSlip } from "@/components/dealer/SealedBidSlip";
import { formatCadCents } from "@/lib/utils";

// Automaker Brand Logo Mapping
const CAR_BRAND_LOGOS: Record<string, string> = {
  toyota: "/car-company-logos/image_16 - Copy.png",
  jeep: "/car-company-logos/image_15.png",
  ford: "/car-company-logos/image_14.svg",
  honda: "/car-company-logos/image_12.png",
  polestar: "/car-company-logos/image_11.png",
  mitsubishi: "/car-company-logos/image_10.png",
  hyundai: "/car-company-logos/image_09.png",
  cadillac: "/car-company-logos/image_13.png",
};

export type DealerActiveBidItem = WholesaleAuctionItem & {
  leadStatus: "LEAD_ESTIMATE" | "OUTBID_ESTIMATE" | "TIED";
  placedAt: string;
};

const INITIAL_ACTIVE_BIDS: DealerActiveBidItem[] = [
  {
    id: "auc-porsche-macan-2022",
    vin: "WP1AF2AY5NL128491",
    year: 2022,
    make: "Porsche",
    model: "Macan",
    trim: "GTS AWD",
    mileageKm: 38450,
    bodyType: "Compact SUV",
    transmission: "7-Speed Dual-Clutch PDK",
    drivetrain: "All-Wheel Drive (AWD)",
    exteriorColor: "Volcano Grey Metallic",
    interiorColor: "Black Leather",
    province: "ON",
    city: "Toronto",
    postalCode: "M5V 2T6",
    distanceKm: 12,
    damageGrade: "A",
    damageHotspotCount: 1,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    ],
    photosCount: 16,
    auctionEndsAt: new Date(Date.now() + (17 * 60 + 42) * 60 * 1000).toISOString(),
    myCurrentBidCents: 3825000,
    totalBidsPlaced: 14,
    reserveStatus: "RESERVE_MET",
    carfaxClean: true,
    keysCount: 2,
    hasLien: false,
    leadStatus: "LEAD_ESTIMATE",
    placedAt: "Today at 10:14 AM",
  },
  {
    id: "auc-ford-f150-2021",
    vin: "1FTFW1E84MFA12345",
    year: 2021,
    make: "Ford",
    model: "F-150",
    trim: "Lariat 502A SuperCrew",
    mileageKm: 54300,
    bodyType: "Pickup Truck",
    transmission: "10-Speed Automatic",
    drivetrain: "4x4 / Four-Wheel Drive",
    exteriorColor: "Agate Black Metallic",
    interiorColor: "Black Leather",
    province: "ON",
    city: "Vaughan",
    postalCode: "L4K 4T9",
    distanceKm: 18,
    damageGrade: "B",
    damageHotspotCount: 2,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?auto=format&fit=crop&w=1200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?auto=format&fit=crop&w=1200&q=80",
    ],
    photosCount: 20,
    auctionEndsAt: new Date(Date.now() + (11 * 60 + 50) * 60 * 1000).toISOString(),
    myCurrentBidCents: 3250000,
    totalBidsPlaced: 8,
    reserveStatus: "NO_RESERVE",
    carfaxClean: true,
    keysCount: 2,
    hasLien: false,
    leadStatus: "OUTBID_ESTIMATE",
    placedAt: "Yesterday at 4:30 PM",
  },
  {
    id: "auc-bmw-m340i-2023",
    vin: "WBA5R7C09NF123456",
    year: 2023,
    make: "BMW",
    model: "M340i",
    trim: "xDrive Sedan",
    mileageKm: 19800,
    bodyType: "Sports Sedan",
    transmission: "8-Speed Sport Steptronic",
    drivetrain: "xDrive All-Wheel Drive",
    exteriorColor: "Portimao Blue Metallic",
    interiorColor: "Cognac Vernasca",
    province: "ON",
    city: "Oakville",
    postalCode: "L6H 7S8",
    distanceKm: 34,
    damageGrade: "A",
    damageHotspotCount: 0,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    ],
    photosCount: 18,
    auctionEndsAt: new Date(Date.now() + (0 * 60 + 11) * 60 * 1000).toISOString(), // Sub-15min Crimson urgency state
    myCurrentBidCents: 4100000,
    totalBidsPlaced: 23,
    reserveStatus: "RESERVE_MET",
    carfaxClean: true,
    keysCount: 2,
    hasLien: false,
    leadStatus: "OUTBID_ESTIMATE",
    placedAt: "Today at 1:15 PM",
  },
  {
    id: "auc-audi-q7-2021",
    vin: "WA1VAAF77MD123456",
    year: 2021,
    make: "Audi",
    model: "Q7",
    trim: "55 TFSI Technik quattro",
    mileageKm: 48900,
    bodyType: "Full-Size Luxury SUV",
    transmission: "8-Speed Tiptronic",
    drivetrain: "quattro All-Wheel Drive",
    exteriorColor: "Glacier White Metallic",
    interiorColor: "Okapi Brown Leather",
    province: "ON",
    city: "Markham",
    postalCode: "L3R 5H6",
    distanceKm: 27,
    damageGrade: "A",
    damageHotspotCount: 0,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1600&q=80",
    ],
    photosCount: 15,
    auctionEndsAt: new Date(Date.now() + (6 * 60 + 30) * 60 * 1000).toISOString(),
    myCurrentBidCents: 2950000,
    totalBidsPlaced: 16,
    reserveStatus: "RESERVE_MET",
    carfaxClean: true,
    keysCount: 2,
    hasLien: false,
    leadStatus: "LEAD_ESTIMATE",
    placedAt: "Today at 9:00 AM",
  },
];

export function DealerActiveBidsView() {
  const [bids, setBids] = useState<DealerActiveBidItem[]>(INITIAL_ACTIVE_BIDS);
  const [filterTab, setFilterTab] = useState<"ALL" | "LEAD" | "OUTBID">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [biddingAuction, setBiddingAuction] = useState<WholesaleAuctionItem | null>(null);

  // Filtered list
  const filteredBids = useMemo(() => {
    return bids.filter((b) => {
      if (filterTab === "LEAD" && b.leadStatus !== "LEAD_ESTIMATE") return false;
      if (filterTab === "OUTBID" && b.leadStatus !== "OUTBID_ESTIMATE") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          b.make.toLowerCase().includes(q) ||
          b.model.toLowerCase().includes(q) ||
          b.vin.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [bids, filterTab, searchQuery]);

  const handleBidSuccess = (_auctionId: string, newAmountCents: number) => {
    if (!biddingAuction) return;
    setBids((prev) =>
      prev.map((item) =>
        item.id === biddingAuction.id
          ? {
              ...item,
              myCurrentBidCents: newAmountCents,
              leadStatus: "LEAD_ESTIMATE",
              totalBidsPlaced: item.totalBidsPlaced + 1,
            }
          : item
      )
    );
  };

  const totalCommittedCents = bids.reduce(
    (acc, b) => acc + (b.myCurrentBidCents ?? 0),
    0
  );

  const leadingCount = bids.filter((b) => b.leadStatus === "LEAD_ESTIMATE").length;
  const outbidCount = bids.filter((b) => b.leadStatus === "OUTBID_ESTIMATE").length;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Modern Open Page Header (Borderless, Direct Typography, FinTech Dashboard) */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-headline text-portal-text tracking-tight">
              Active Placed Bids
            </h1>
            <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-2xl">
              Real-time telemetry on open 24-hour wholesale auctions where your dealership holds an active sealed commitment.
            </p>
          </div>

          <Link
            href="/dealer/inventory"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-bold transition-all shadow-2xs self-start lg:self-auto cursor-pointer group"
          >
            <span>Explore Wholesale Floor</span>
            <ArrowUpRight className="w-4 h-4 text-portal-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Single Unified Stats Overview Bar matching Reference Image 2 */}
        <div className="rounded-2xl border border-portal-border bg-portal-surface p-4 sm:p-6 shadow-xs">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-portal-border">
            {[
              {
                label: "COMMITTED BID VOLUME",
                value: formatCadCents(totalCommittedCents),
                icon: DollarSign,
                trend: "Net Committed Volume",
                isPositive: true,
                highlight: false,
                isCircle: false,
              },
              {
                label: "TOTAL DEALER BIDS",
                value: bids.length.toString(),
                icon: Gavel,
                trend: "Recorded Floor Events",
                isPositive: false,
                highlight: false,
                isCircle: false,
              },
              {
                label: "LEADING CORRIDOR",
                value: leadingCount.toString(),
                icon: CheckCircle2,
                trend: "Top Rank Estimate",
                isPositive: true,
                highlight: false,
                isCircle: true,
              },
              {
                label: "ACTIVE AUCTIONS",
                value: bids.length.toString(),
                icon: Clock,
                trend: "24h Sealed Floor",
                isPositive: true,
                highlight: true,
                isCircle: true,
              },
            ].map(({ label, value, icon: Icon, trend, isPositive, highlight, isCircle }, idx) => (
              <div
                key={label}
                className={`flex items-center justify-between gap-4 transition-colors ${
                  idx === 0 ? "lg:pr-6" : idx === 3 ? "lg:pl-6" : "lg:px-6"
                }`}
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
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
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

                {/* Right Side: Icon (Circle outline or standalone icon matching Image 2) */}
                {isCircle ? (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-portal-border/80 bg-portal-surface-hover/50 flex items-center justify-center shrink-0 text-portal-primary">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-portal-primary" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center shrink-0 text-portal-primary pr-1">
                    <Icon className="w-6 h-6 text-portal-primary" />
                  </div>
                )}
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* 2. Filter Bar & Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Segmented Filter Pills */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-portal-surface border border-portal-border shadow-2xs text-xs self-start">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "ALL"
                ? "bg-portal-primary text-white shadow-2xs"
                : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
            }`}
          >
            <span>All Placed</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                filterTab === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-portal-surface-hover text-portal-text-muted"
              }`}
            >
              {bids.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("LEAD")}
            className={`px-3 py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "LEAD"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Leading</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                filterTab === "LEAD"
                  ? "bg-white/20 text-white"
                  : "bg-portal-surface-hover text-portal-text-muted"
              }`}
            >
              {leadingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("OUTBID")}
            className={`px-3 py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "OUTBID"
                ? "bg-amber-600 text-white shadow-2xs"
                : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Attention Needed</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                filterTab === "OUTBID"
                  ? "bg-white/20 text-white"
                  : "bg-portal-surface-hover text-portal-text-muted"
              }`}
            >
              {outbidCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search make, model, VIN..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-portal-surface border border-portal-border text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:border-portal-primary transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* 3. Modern Active Bids Cards List */}
      <div className="space-y-3.5">
        {filteredBids.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-portal-border bg-portal-surface p-8 space-y-3">
            <Gavel className="w-10 h-10 text-portal-text-muted mx-auto opacity-40" />
            <h3 className="text-base font-bold text-portal-text">No Matching Bids Found</h3>
            <p className="text-xs text-portal-text-muted max-w-sm mx-auto">
              {searchQuery
                ? "No active placed bids match your query. Try clearing the search."
                : "You do not have any active bids in this category."}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setFilterTab("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-portal-surface-hover text-portal-text border border-portal-border hover:bg-portal-surface transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          filteredBids.map((item) => {
            const endsAt = new Date(item.auctionEndsAt).getTime();
            const msLeft = endsAt - Date.now();
            const hoursLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60)));
            const minsLeft = Math.max(0, Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60)));
            const isUrgent = msLeft > 0 && msLeft < 15 * 60 * 1000;
            const logoPath = CAR_BRAND_LOGOS[item.make.toLowerCase()];

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-portal-surface p-4 sm:p-5 transition-all shadow-2xs hover:shadow-md relative overflow-hidden group flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isUrgent
                    ? "border-red-500/50 ring-1 ring-red-500/20"
                    : "border-portal-border hover:border-portal-border-subtle"
                }`}
              >
                {/* Urgent top accent bar */}
                {isUrgent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />
                )}

                {/* Left: Thumbnail & Core Vehicle Info */}
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <Link
                    href={`/dealer/auctions/${item.id}`}
                    className="relative w-32 h-22 sm:w-40 sm:h-26 rounded-xl overflow-hidden bg-portal-surface-hover shrink-0 border border-portal-border group/photo shadow-2xs block"
                  >
                    <Image
                      src={item.thumbnailUrl}
                      alt={`${item.make} ${item.model}`}
                      fill
                      className="object-cover group-hover/photo:scale-105 transition-transform duration-300"
                      sizes="160px"
                    />

                    {/* Grade Badge */}
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                      Grade {item.damageGrade}
                    </div>

                    {/* Brand Logo Watermark Pill */}
                    {logoPath && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/60 backdrop-blur-xs flex items-center justify-center p-0.5">
                        <Image
                          src={logoPath}
                          alt={item.make}
                          width={18}
                          height={18}
                          className="object-contain brightness-0 invert opacity-90"
                        />
                      </div>
                    )}
                  </Link>

                  <div className="space-y-1.5 min-w-0">
                    {/* Top Spec Row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-portal-text-muted">
                      <span className="font-mono">VIN: ···{item.vin.slice(-6)}</span>
                      <span>•</span>
                      <span className="font-mono font-medium text-portal-text">
                        {item.mileageKm.toLocaleString()} km
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-portal-primary" />
                        <span>{item.city}, {item.province}</span>
                      </span>
                    </div>

                    {/* Vehicle Title */}
                    <Link
                      href={`/dealer/auctions/${item.id}`}
                      className="text-base sm:text-lg font-bold font-headline text-portal-text hover:text-portal-primary transition-colors block truncate"
                    >
                      {item.year} {item.make} {item.model} {item.trim}
                    </Link>

                    {/* Competitive Status & Floor Telemetry */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {item.leadStatus === "LEAD_ESTIMATE" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-500/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Leading Corridor</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold border border-amber-500/25">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Likely Outbid</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-portal-surface-hover text-portal-text-muted text-[11px] font-mono border border-portal-border">
                        <Lock className="w-3 h-3 text-portal-primary" />
                        <span>{item.totalBidsPlaced} bids on floor</span>
                      </span>

                      <span className="text-[11px] text-portal-text-muted font-mono hidden sm:inline">
                        Placed: {item.placedAt}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Closing Clock, Active CAD Bid & Modern Actions */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-portal-border/60 shrink-0">
                  {/* Closing Countdown */}
                  <div className="text-left lg:text-right font-mono">
                    <span className="text-[10px] uppercase font-semibold text-portal-text-muted block">
                      Auction Closes In
                    </span>
                    <div
                      className={`text-sm font-bold flex items-center lg:justify-end gap-1 mt-0.5 ${
                        isUrgent ? "text-red-500 animate-pulse" : "text-portal-text"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {hoursLeft > 0 ? `${hoursLeft}h ` : ""}
                        {minsLeft}m left
                      </span>
                    </div>
                    {isUrgent && (
                      <span className="text-[9.5px] font-bold uppercase text-red-500 block">
                        Closing Soonest
                      </span>
                    )}
                  </div>

                  {/* Active Bid Amount */}
                  <div className="text-left lg:text-right font-mono">
                    <span className="text-[10px] uppercase font-semibold text-portal-text-muted block">
                      Your Active Bid
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-portal-text block mt-0.5">
                      {formatCadCents(item.myCurrentBidCents ?? 0)}
                    </span>
                  </div>

                  {/* Modern Dual Actions (Matching Design Token Guidelines) */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      href={`/dealer/auctions/${item.id}`}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-semibold transition-colors text-center shadow-2xs"
                    >
                      Inspect
                    </Link>

                    <button
                      type="button"
                      onClick={() => setBiddingAuction(item)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-portal-surface border border-portal-border hover:bg-portal-primary hover:text-white hover:border-portal-primary text-portal-text text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer group/btn"
                    >
                      <span>Raise Bid</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sealed Bid Placement Slip Modal */}
      {biddingAuction && (
        <SealedBidSlip
          auction={biddingAuction}
          onClose={() => setBiddingAuction(null)}
          onBidSuccess={handleBidSuccess}
        />
      )}
    </div>
  );
}
