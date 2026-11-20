"use client";

import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Gavel,
  Search,
  CheckCircle2,
  RefreshCw,
  Car,
  AlertCircle,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import type {
  DealerInventoryResponse,
  WholesaleAuctionItem,
} from "@/lib/types/dealer";
import { SealedBidSlip } from "@/components/dealer/SealedBidSlip";
import { DealerAuctionCard } from "@/components/dealer/DealerAuctionCard";
import { dealerKeys } from "@/lib/query-keys";
import { useAuctionRealtime } from "@/hooks/useAuctionRealtime";
import { useDealerInventory } from "@/hooks/useDealerInventory";

type InventorySortOption = "closing" | "mileage" | "year" | "distance";

export function DealerInventoryFeed() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } =
    useDealerInventory();

  const realtime = useAuctionRealtime({
    serverTime: data?.serverTime,
    dataUpdatedAt,
    enabled: Boolean(data),
    portal: "dealer",
  });

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [makeFilter, setMakeFilter] = useState("ALL");
  const [maxMileage, setMaxMileage] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<InventorySortOption>("closing");

  // Selected auction for bidding slip
  const [biddingAuction, setBiddingAuction] =
    useState<WholesaleAuctionItem | null>(null);
  const [bidSuccessMessage, setBidSuccessMessage] = useState<string | null>(
    null
  );

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const dealerQuota = data?.dealerQuota;

  const availableMakes = useMemo(
    () => Array.from(new Set(items.map((item) => item.make))).sort(),
    [items]
  );

  // Filtered & sorted inventory
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (
          makeFilter !== "ALL" &&
          item.make.toUpperCase() !== makeFilter.toUpperCase()
        ) {
          return false;
        }
        if (maxMileage && item.mileageKm > maxMileage) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            item.make.toLowerCase().includes(q) ||
            item.model.toLowerCase().includes(q) ||
            item.vin.toLowerCase().includes(q) ||
            item.city.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "closing") {
          return (
            new Date(a.auctionEndsAt).getTime() -
            new Date(b.auctionEndsAt).getTime()
          );
        }
        if (sortBy === "mileage") {
          return a.mileageKm - b.mileageKm;
        }
        if (sortBy === "distance") {
          return a.distanceKm - b.distanceKm;
        }
        return b.year - a.year;
      });
  }, [items, makeFilter, maxMileage, searchQuery, sortBy]);

  // Handle successful bid placement
  const handleBidSuccess = (auctionId: string, amountCents: number) => {
    queryClient.setQueryData<DealerInventoryResponse>(
      dealerKeys.inventory(),
      (prev) => {
        if (!prev) return prev;
        let isNewBid = false;
        const nextItems = prev.items.map((item) => {
          if (item.id !== auctionId) return item;
          isNewBid = !item.myCurrentBidCents;
          return {
            ...item,
            myCurrentBidCents: amountCents,
            totalBidsPlaced: isNewBid
              ? item.totalBidsPlaced + 1
              : item.totalBidsPlaced,
          };
        });
        return {
          ...prev,
          items: nextItems,
          dealerQuota: {
            ...prev.dealerQuota,
            activeBidsCount: isNewBid
              ? prev.dealerQuota.activeBidsCount + 1
              : prev.dealerQuota.activeBidsCount,
          },
        };
      }
    );

    void queryClient.invalidateQueries({ queryKey: dealerKeys.inventory() });
    void queryClient.invalidateQueries({
      queryKey: dealerKeys.auction(auctionId),
    });

    setBidSuccessMessage(
      `Sealed bid of ${formatCadCents(amountCents)} confirmed and placed!`
    );
    setTimeout(() => setBidSuccessMessage(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-portal-primary animate-spin" />
          <p className="text-sm font-medium text-portal-text-muted">
            Loading dealer inventory...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="max-w-md w-full p-6 rounded-2xl bg-portal-surface border border-portal-border text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-error mx-auto" />
          <h2 className="font-headline text-lg font-bold text-portal-text">
            Unable to load trading floor
          </h2>
          <p className="text-xs text-portal-text-muted">
            {error instanceof Error
              ? error.message
              : "Please check your dealership verification status and try again."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-portal-primary text-white text-xs font-semibold hover:bg-portal-primary-hover transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Alert on Bid Success */}
      {bidSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold shadow-md animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bidSuccessMessage}</span>
        </div>
      )}

      {/* 1. Clean, Modern Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-portal-text">
            Dealer Inventory
          </h1>
          <p className="mt-1.5 font-body text-xs sm:text-sm text-portal-text-muted max-w-2xl font-normal">
            Active 24-hour sealed auctions from verified private sellers across Ontario & Quebec.
          </p>
        </div>

        {/* Quick Inventory Telemetry Chips */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-portal-surface border border-portal-border shadow-2xs">
            <Car className="w-4 h-4 text-portal-text-muted" />
            <span className="text-xs font-medium text-portal-text-muted">
              Available:
            </span>
            <span className="font-mono text-xs font-bold text-portal-text">
              {items.length} {items.length === 1 ? "Vehicle" : "Vehicles"}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-portal-primary/10 border border-portal-primary/25 shadow-2xs">
            <Gavel className="w-4 h-4 text-portal-primary" />
            <span className="text-xs font-medium text-portal-primary">
              Your Bids:
            </span>
            <span className="font-mono text-xs font-bold text-portal-primary">
              {items.filter((i) => i.myCurrentBidCents).length} Active
            </span>
          </div>
          {dealerQuota && dealerQuota.totalMonthlyQuota > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-portal-surface border border-portal-border shadow-2xs">
              <span className="text-xs font-medium text-portal-text-muted">
                Quota:
              </span>
              <span className="font-mono text-xs font-bold text-portal-text">
                {dealerQuota.usedThisMonth}/{dealerQuota.totalMonthlyQuota}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Streamlined Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Search Input */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <input
            type="text"
            id="dealer-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Make, Model, VIN, or City..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-portal-surface border border-portal-border text-xs text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:ring-1 focus:ring-portal-primary shadow-2xs transition-colors"
          />
        </div>

        {/* Make Filter */}
        <select
          value={makeFilter}
          onChange={(e) => setMakeFilter(e.target.value)}
          aria-label="Filter by manufacturer"
          className="px-3.5 py-2.5 rounded-xl bg-portal-surface border border-portal-border text-xs text-portal-text focus:outline-none focus:ring-1 focus:ring-portal-primary cursor-pointer shadow-2xs"
        >
          <option value="ALL">All Manufacturers</option>
          {availableMakes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>

        {/* Mileage Filter */}
        <select
          value={maxMileage || ""}
          onChange={(e) =>
            setMaxMileage(e.target.value ? parseInt(e.target.value, 10) : null)
          }
          aria-label="Filter by maximum mileage"
          className="px-3.5 py-2.5 rounded-xl bg-portal-surface border border-portal-border text-xs text-portal-text focus:outline-none focus:ring-1 focus:ring-portal-primary cursor-pointer shadow-2xs"
        >
          <option value="">Any Mileage</option>
          <option value="30000">Under 30,000 km</option>
          <option value="60000">Under 60,000 km</option>
          <option value="100000">Under 100,000 km</option>
        </select>

        {/* Sort Option */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as InventorySortOption)}
          aria-label="Sort inventory listings"
          className="px-3.5 py-2.5 rounded-xl bg-portal-surface border border-portal-border text-xs text-portal-text focus:outline-none focus:ring-1 focus:ring-portal-primary cursor-pointer shadow-2xs"
        >
          <option value="closing">Closing Soonest</option>
          <option value="mileage">Lowest Mileage</option>
          <option value="year">Newest Year</option>
          <option value="distance">Nearest Distance</option>
        </select>
      </div>

      {/* 3. Signature Notched Card Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-portal-surface rounded-2xl border border-portal-border space-y-3">
          <Car className="w-10 h-10 text-portal-text-muted mx-auto opacity-40" />
          <h3 className="font-headline text-base font-bold text-portal-text">
            {items.length === 0
              ? "No active auctions on the floor"
              : "No vehicles match your search"}
          </h3>
          <p className="text-xs text-portal-text-muted max-w-sm mx-auto">
            {items.length === 0
              ? "Approved seller vehicles will appear here as soon as their 24-hour bidding window opens."
              : "Try adjusting your filters or search terms to see available dealer inventory."}
          </p>
          {(searchQuery || makeFilter !== "ALL" || maxMileage !== null) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setMakeFilter("ALL");
                setMaxMileage(null);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-portal-surface-hover border border-portal-border text-portal-text hover:bg-portal-primary/10 hover:border-portal-primary/30 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
          {filteredItems.map((item) => (
            <DealerAuctionCard
              key={item.id}
              item={item}
              serverOffsetMs={realtime.countdown.serverOffsetMs}
              onOpenBid={(auction) => setBiddingAuction(auction)}
            />
          ))}
        </div>
      )}

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
