"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ArrowUpRight,
  Clock,
  Gavel,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { SealedBidSlip } from "@/components/dealer/SealedBidSlip";
import { useAuctionRealtime } from "@/hooks/useAuctionRealtime";
import { useDealerActiveBids } from "@/hooks/useDealerBids";
import { getErrorMessage } from "@/lib/api-errors";
import type {
  DealerActiveBidItem,
  WholesaleAuctionItem,
} from "@/lib/types/dealer";
import { formatCadCents } from "@/lib/utils";

export type { DealerActiveBidItem } from "@/lib/types/dealer";

type ActiveBidFilterTab =
  | "ALL"
  | "CLOSING_SOON"
  | "COMPETING"
  | "AWAITING_SELLER";

type ActiveBidSortKey =
  | "closing-soon"
  | "bid-high"
  | "bid-low"
  | "most-bids";

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

const emptySubscribe = () => () => {};

function formatPlacedAtLabel(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "Recently";
  return new Date(parsed).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DealerActiveBidsView() {
  const t = useTranslations("dealer");
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useDealerActiveBids();

  useAuctionRealtime({ portal: "dealer", enabled: true });

  const bids = useMemo(() => data?.items ?? [], [data]);
  const [filterTab, setFilterTab] = useState<ActiveBidFilterTab>("ALL");
  const [sortBy, setSortBy] = useState<ActiveBidSortKey>("closing-soon");
  const [searchQuery, setSearchQuery] = useState("");
  const [biddingAuction, setBiddingAuction] =
    useState<WholesaleAuctionItem | null>(null);
  const [clientNowMs, setClientNowMs] = useState<number>(() => Date.now());

  const hasActiveLots = useMemo(
    () => bids.some((b) => b.listingStatus === "ACTIVE"),
    [bids]
  );

  useEffect(() => {
    if (!hasActiveLots) return;
    const interval = setInterval(() => {
      setClientNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasActiveLots]);

  const serverTime = data?.serverTime;
  const serverOffsetMs = useMemo(() => {
    if (!serverTime || !dataUpdatedAt || dataUpdatedAt <= 0) return 0;
    const parsed = Date.parse(serverTime);
    return Number.isFinite(parsed) ? parsed - dataUpdatedAt : 0;
  }, [serverTime, dataUpdatedAt]);

  const effectiveNowMs = clientNowMs + serverOffsetMs;

  const filteredBids = useMemo(() => {
    const list = bids.filter((b) => {
      if (filterTab === "CLOSING_SOON" && b.bidStanding !== "CLOSING_SOON") {
        return false;
      }
      if (filterTab === "COMPETING" && b.bidStanding !== "COMPETING") {
        return false;
      }
      if (
        filterTab === "AWAITING_SELLER" &&
        b.bidStanding !== "AWAITING_SELLER"
      ) {
        return false;
      }
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

    return [...list].sort((a, b) => {
      if (sortBy === "closing-soon") {
        return (
          new Date(a.auctionEndsAt).getTime() -
          new Date(b.auctionEndsAt).getTime()
        );
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

  const totalCommittedCents =
    data?.summary.totalCommittedCents ??
    bids.reduce((acc, b) => acc + (b.myCurrentBidCents ?? 0), 0);
  const closingSoonCount =
    data?.summary.closingSoonCount ??
    bids.filter((b) => b.bidStanding === "CLOSING_SOON").length;
  const competingCount = bids.filter(
    (b) => b.bidStanding === "COMPETING"
  ).length;
  const awaitingSellerCount =
    data?.summary.awaitingSellerCount ??
    bids.filter((b) => b.bidStanding === "AWAITING_SELLER").length;

  const renderStandingPill = (item: DealerActiveBidItem) => {
    switch (item.bidStanding) {
      case "AWAITING_SELLER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            <span>Unsealed • Awaiting Seller</span>
          </span>
        );
      case "CLOSING_SOON":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-500/25">
            <Clock className="w-3.5 h-3.5" />
            <span>Closing Under 1h</span>
          </span>
        );
      case "SOLE_BIDDER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Sole Floor Bid</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
            <span>Multi-Bid Sealed Floor</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 space-y-6 font-body animate-in fade-in duration-300">
      {/* 1. Clean Unboxed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-headline">
            {t("activeBidsTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Live telemetry on open wholesale auctions and pending unsealed offers where{" "}
            {data?.dealershipName ?? "your dealership"} holds a sealed commitment.
          </p>
        </div>

        <Link
          href="/dealer/inventory"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 text-xs font-semibold transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <span>{t("exploreFloorCta")}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
        </Link>
      </div>

      {/* 2. Fluid Metric Cards Grid */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-5 shadow-xs">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:divide-x divide-neutral-200/80 dark:divide-white/5">
          <div className="min-w-0 lg:pr-6">
            <dt className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Committed Bid Volume
            </dt>
            <dd className="mt-1 font-headline text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight whitespace-nowrap">
              {formatCadCents(totalCommittedCents)}
            </dd>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>
                {bids.length}{" "}
                {bids.length === 1 ? "Active Commitment" : "Active Commitments"}
              </span>
            </div>
          </div>

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

          <div className="min-w-0 lg:px-6">
            <dt className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Closing Under 1 Hour
            </dt>
            <dd className="mt-1 font-headline text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {closingSoonCount}
            </dd>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1 inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Priority Final Revision</span>
            </span>
          </div>

          <div className="min-w-0 sm:pl-6">
            <dt className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Awaiting Seller Review
            </dt>
            <dd className="mt-1 font-headline text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {awaitingSellerCount}
            </dd>
            <span className="text-xs font-medium text-sky-600 dark:text-sky-400 mt-1 inline-flex items-center gap-1">
              <Gavel className="w-3.5 h-3.5" />
              <span>Unsealed For Selection</span>
            </span>
          </div>
        </dl>
      </div>

      {/* 3. Filter Bar, Live Search & Sort Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-white/5 text-xs">
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
            onClick={() => setFilterTab("CLOSING_SOON")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "CLOSING_SOON"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>Closing Soon</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-neutral-200 dark:bg-neutral-800 font-bold">
              {closingSoonCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("COMPETING")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "COMPETING"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Multi-Bid Floor</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-neutral-200 dark:bg-neutral-800 font-bold">
              {competingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("AWAITING_SELLER")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "AWAITING_SELLER"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Awaiting Seller</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-neutral-200 dark:bg-neutral-800 font-bold">
              {awaitingSellerCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
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

          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ActiveBidSortKey)}
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

      {isError && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs flex items-center justify-between gap-3">
          <span>{getErrorMessage(error)}</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-3 py-1 rounded-lg bg-red-500 text-white font-semibold cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Active Bids Roster */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="py-16 text-center rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/40 p-8 space-y-3">
            <RefreshCw className="w-8 h-8 text-primary mx-auto animate-spin" />
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Loading your sealed bid commitments...
            </p>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/40 p-8 space-y-3">
            <Gavel className="w-10 h-10 text-neutral-400 mx-auto opacity-40" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-headline">
              No Matching Bids Found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              {searchQuery || filterTab !== "ALL"
                ? "No placed bids match your current search or filter."
                : "Your dealership does not currently hold any active sealed bids. Browse live wholesale inventory to place an offer."}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              {(searchQuery || filterTab !== "ALL") && (
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
              )}
              <Link
                href="/dealer/inventory"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary dark:bg-secondary text-white"
              >
                Browse Inventory
              </Link>
            </div>
          </div>
        ) : (
          filteredBids.map((item) => {
            const endsAt = Date.parse(item.auctionEndsAt);
            const msLeft = mounted ? endsAt - effectiveNowMs : 0;
            const isActive = item.listingStatus === "ACTIVE";
            const isClosed = !isActive || (mounted && msLeft <= 0);
            const hoursLeft = Math.max(
              0,
              Math.floor(msLeft / (1000 * 60 * 60))
            );
            const minsLeft = Math.max(
              0,
              Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60))
            );
            const isUrgent =
              mounted && isActive && msLeft > 0 && msLeft < 15 * 60 * 1000;
            const logoPath = CAR_BRAND_LOGOS[item.make.toLowerCase()];

            return (
              <div
                key={item.bidId}
                className={`rounded-2xl border bg-white dark:bg-neutral-900/60 p-4 sm:p-5 transition-all shadow-xs hover:shadow-md relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isUrgent
                    ? "border-red-500/50 dark:border-red-500/60"
                    : "border-neutral-200/90 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20"
                }`}
              >
                {isUrgent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
                )}

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

                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                      Grade {item.damageGrade}
                    </div>

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
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="font-mono">···{item.vin.slice(-6)}</span>
                      <span>•</span>
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {item.mileageKm.toLocaleString()} km
                      </span>
                      <span>•</span>
                      <span>
                        {item.city}, {item.province}
                      </span>
                      <span>•</span>
                      <span>Placed {formatPlacedAtLabel(item.placedAt)}</span>
                    </div>

                    <Link
                      href={`/dealer/auctions/${item.id}`}
                      className="text-base sm:text-lg font-bold font-headline text-neutral-900 dark:text-white hover:text-primary dark:hover:text-secondary transition-colors block"
                    >
                      {item.year} {item.make} {item.model}{" "}
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">
                        {item.trim}
                      </span>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {renderStandingPill(item)}
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {item.totalBidsPlaced}{" "}
                        {item.totalBidsPlaced === 1 ? "bid" : "bids"} on floor
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-white/5 shrink-0">
                  <div className="text-left lg:text-right">
                    <span className="text-[11px] font-medium text-neutral-400 block">
                      {isActive ? "Auction Closes In" : "Bidding Window"}
                    </span>
                    <div
                      className={`text-sm font-bold flex items-center lg:justify-end gap-1 mt-0.5 ${
                        isUrgent
                          ? "text-red-500 animate-pulse"
                          : "text-neutral-900 dark:text-white"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {!isActive
                          ? "Closed • Unsealed"
                          : !mounted
                            ? "Syncing..."
                            : isClosed
                              ? "Closing"
                              : `${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minsLeft}m left`}
                      </span>
                    </div>
                  </div>

                  <div className="text-left lg:text-right">
                    <span className="text-[11px] font-medium text-neutral-400 block">
                      Your Sealed Bid
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white block mt-0.5">
                      {formatCadCents(item.myCurrentBidCents ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      href={`/dealer/auctions/${item.id}`}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 text-xs font-semibold transition-colors text-center shadow-2xs"
                    >
                      Inspect
                    </Link>

                    {isActive && !isClosed ? (
                      <button
                        type="button"
                        onClick={() => setBiddingAuction(item)}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-primary dark:bg-secondary text-white text-xs font-bold transition-opacity hover:opacity-95 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Raise Bid</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold text-center">
                        Awaiting Seller
                      </span>
                    )}
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
          key={biddingAuction.id}
          auction={biddingAuction}
          onClose={() => setBiddingAuction(null)}
          onBidSuccess={() => {
            setBiddingAuction(null);
            void refetch();
          }}
        />
      )}
    </div>
  );
}
