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
  Search,
  DollarSign,
  ArrowUpDown,
  Filter,
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
    exteriorColor: "Mythos Black Metallic",
    interiorColor: "Okapi Brown Leather",
    province: "ON",
    city: "Markham",
    postalCode: "L3R 5M9",
    distanceKm: 26,
    damageGrade: "A",
    damageHotspotCount: 1,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
    ],
    photosCount: 24,
    auctionEndsAt: new Date(Date.now() + (6 * 60 + 29) * 60 * 1000).toISOString(),
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
  const [sortBy, setSortBy] = useState<"closing-soon" | "bid-high" | "bid-low" | "most-bids">("closing-soon");
  const [searchQuery, setSearchQuery] = useState("");
  const [biddingAuction, setBiddingAuction] = useState<WholesaleAuctionItem | null>(null);

  // Filtered & Sorted list
  const filteredBids = useMemo(() => {
    const list = bids.filter((b) => {
      if (filterTab === "LEAD" && b.leadStatus !== "LEAD_ESTIMATE") return false;
      if (filterTab === "OUTBID" && b.leadStatus !== "OUTBID_ESTIMATE") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          b.make.toLowerCase().includes(q) ||
          b.model.toLowerCase().includes(q) ||
          b.trim.toLowerCase().includes(q) ||
          b.vin.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === "closing-soon") {
        return new Date(a.auctionEndsAt).getTime() - new Date(b.auctionEndsAt).getTime();
      }
      if (sortBy === "bid-high") {
        return (b.myCurrentBidCents ?? 0) - (a.myCurrentBidCents ?? 0);
      }
      if (sortBy === "bid-low") {
        return (a.myCurrentBidCents ?? 0) - (b.myCurrentBidCents ?? 0);
      }
      if (sortBy === "most-bids") {
        return b.totalBidsPlaced - a.totalBidsPlaced;
      }
      return 0;
    });
  }, [bids, filterTab, searchQuery, sortBy]);

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
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 space-y-6 font-body animate-in fade-in duration-300">
      {/* 1. Clean Unboxed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-headline">
            Active Placed Bids
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Live telemetry on open 24-hour wholesale auctions where your dealership holds an active sealed commitment.
          </p>
        </div>

        <Link
          href="/dealer/inventory"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 text-xs font-semibold transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <span>Explore Wholesale Floor</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
        </Link>
      </div>

      {/* 2. Fluid Metric Cards Grid (Zero Text Truncation) */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-5 shadow-xs">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:divide-x divide-neutral-200/80 dark:divide-white/5">
          {/* Metric 1: Committed Volume */}
          <div className="min-w-0 lg:pr-6">
            <dt className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Committed Bid Volume
            </dt>
            <dd className="mt-1 font-headline text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight whitespace-nowrap">
              {formatCadCents(totalCommittedCents)}
            </dd>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>4 Active Commitments</span>
            </div>
          </div>

          {/* Metric 2: Total Bids */}
          <div className="min-w-0 sm:pl-6 lg:px-6">
            <dt className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Total Placed Bids
            </dt>
            <dd className="mt-1 font-headline text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {bids.length}
            </dd>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">
              Across active rooftop seats
            </span>
          </div>

          {/* Metric 3: Leading Corridor */}
          <div className="min-w-0 lg:px-6">
            <dt className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Leading Positions
            </dt>
            <dd className="mt-1 font-headline text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {leadingCount}
            </dd>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Estimated Top Rank</span>
            </span>
          </div>

          {/* Metric 4: Attention Needed */}
          <div className="min-w-0 sm:pl-6">
            <dt className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Outbid Estimates
            </dt>
            <dd className="mt-1 font-headline text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {outbidCount}
            </dd>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1 inline-flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Revision Recommended</span>
            </span>
          </div>
        </dl>
      </div>

      {/* 3. Filter Bar, Real Search & Sort Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-white/5 text-xs">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "ALL"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <span>All Placed</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-neutral-200 dark:bg-neutral-800 font-bold">
              {bids.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("LEAD")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "LEAD"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Leading</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-neutral-200 dark:bg-neutral-800 font-bold">
              {leadingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("OUTBID")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "OUTBID"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Attention Needed</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-neutral-200 dark:bg-neutral-800 font-bold">
              {outbidCount}
            </span>
          </button>
        </div>

        {/* Right Tools: Search & Sort Dropdown */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Live Search */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search make, model, VIN..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 shadow-2xs"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 cursor-pointer shadow-2xs"
            >
              <option value="closing-soon">Sort: Closing Soonest</option>
              <option value="bid-high">Sort: Highest Active Bid</option>
              <option value="bid-low">Sort: Lowest Active Bid</option>
              <option value="most-bids">Sort: Most Floor Bids</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Active Bids Cards Roster */}
      <div className="space-y-3.5">
        {filteredBids.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/40 p-8 space-y-3">
            <Gavel className="w-10 h-10 text-neutral-400 mx-auto opacity-40" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-headline">
              No Matching Bids Found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              {searchQuery
                ? "No active placed bids match your query. Try clearing the search."
                : "You do not have any active bids in this category."}
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterTab("ALL");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
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
                className={`rounded-2xl border bg-white dark:bg-neutral-900/60 p-4 sm:p-5 transition-all shadow-xs hover:shadow-md relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isUrgent
                    ? "border-red-500/50 dark:border-red-500/60"
                    : "border-neutral-200/90 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20"
                }`}
              >
                {/* Urgent Accent Strip */}
                {isUrgent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
                )}

                {/* Left: Thumbnail & Core Vehicle Info */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  <Link
                    href={`/dealer/auctions/${item.id}`}
                    className="relative w-32 h-22 sm:w-40 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700/80 group/photo block"
                  >
                    <Image
                      src={item.thumbnailUrl}
                      alt={`${item.make} ${item.model}`}
                      fill
                      className="object-cover group-hover/photo:scale-105 transition-transform duration-300"
                      sizes="160px"
                    />

                    {/* Grade Badge */}
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                      Grade {item.damageGrade}
                    </div>

                    {/* Brand Logo Pill */}
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

                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Top Spec Row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="font-mono">···{item.vin.slice(-6)}</span>
                      <span>•</span>
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {item.mileageKm.toLocaleString()} km
                      </span>
                      <span>•</span>
                      <span>{item.city}, {item.province}</span>
                    </div>

                    {/* Full Vehicle Title Without Ellipsis Truncation */}
                    <Link
                      href={`/dealer/auctions/${item.id}`}
                      className="text-base sm:text-lg font-bold font-headline text-neutral-900 dark:text-white hover:text-primary dark:hover:text-secondary transition-colors block"
                    >
                      {item.year} {item.make} {item.model}{" "}
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">
                        {item.trim}
                      </span>
                    </Link>

                    {/* Status Pill & Activity */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {item.leadStatus === "LEAD_ESTIMATE" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          <span>Leading Corridor</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/25">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Likely Outbid</span>
                        </span>
                      )}

                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {item.totalBidsPlaced} bids on floor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Closing Clock, Active CAD Bid & Actions */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-white/5 shrink-0">
                  {/* Closing Countdown */}
                  <div className="text-left lg:text-right">
                    <span className="text-[11px] font-medium text-neutral-400 block">
                      Auction Closes In
                    </span>
                    <div
                      className={`text-sm font-bold flex items-center lg:justify-end gap-1 mt-0.5 ${
                        isUrgent ? "text-red-500 animate-pulse" : "text-neutral-900 dark:text-white"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {hoursLeft > 0 ? `${hoursLeft}h ` : ""}
                        {minsLeft}m left
                      </span>
                    </div>
                  </div>

                  {/* Active Bid Amount */}
                  <div className="text-left lg:text-right">
                    <span className="text-[11px] font-medium text-neutral-400 block">
                      Your Active Bid
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white block mt-0.5">
                      {formatCadCents(item.myCurrentBidCents ?? 0)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      href={`/dealer/auctions/${item.id}`}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 text-xs font-semibold transition-colors text-center shadow-2xs"
                    >
                      Inspect
                    </Link>

                    <button
                      type="button"
                      onClick={() => setBiddingAuction(item)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-primary dark:bg-secondary text-white text-xs font-bold transition-opacity hover:opacity-95 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Raise Bid</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
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
