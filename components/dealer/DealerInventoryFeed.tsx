"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Gavel,
  Search,
  CheckCircle2,
  RefreshCw,
  Car,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import type { WholesaleAuctionItem, DamageGrade } from "@/lib/types/dealer";
import { SealedBidSlip } from "@/components/dealer/SealedBidSlip";
import { DealerAuctionCard } from "@/components/dealer/DealerAuctionCard";
import { apiClient } from "@/lib/api-client";

export function DealerInventoryFeed() {
  const [items, setItems] = useState<WholesaleAuctionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [makeFilter, setMakeFilter] = useState("ALL");
  const [maxMileage, setMaxMileage] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"closing" | "mileage" | "year">("closing");

  // Selected auction for bidding slip
  const [biddingAuction, setBiddingAuction] = useState<WholesaleAuctionItem | null>(null);
  const [bidSuccessMessage, setBidSuccessMessage] = useState<string | null>(null);

  // Load Inventory
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.api.get<{ items: WholesaleAuctionItem[] }>("/api/dealer/inventory");
      if (res.success && res.data?.items) {
        setItems(res.data.items);
      } else {
        const errText = !res.success ? res.error : "Failed to load inventory";
        setError(errText || "Failed to load inventory");
      }
    } catch {
      setError("Unable to connect to dealer feed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filtered & sorted inventory
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (makeFilter !== "ALL" && item.make.toUpperCase() !== makeFilter.toUpperCase()) {
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
          return new Date(a.auctionEndsAt).getTime() - new Date(b.auctionEndsAt).getTime();
        }
        if (sortBy === "mileage") {
          return a.mileageKm - b.mileageKm;
        }
        return b.year - a.year;
      });
  }, [items, makeFilter, maxMileage, searchQuery, sortBy]);

  // Handle successful bid placement
  const handleBidSuccess = (auctionId: string, amountCents: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === auctionId
          ? {
              ...item,
              myCurrentBidCents: amountCents,
              totalBidsPlaced: item.totalBidsPlaced + 1,
            }
          : item
      )
    );
    setBidSuccessMessage(`Sealed bid of ${formatCadCents(amountCents)} confirmed and placed!`);
    setTimeout(() => setBidSuccessMessage(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-portal-primary animate-spin" />
          <p className="text-sm font-medium text-portal-text-muted">Loading dealer inventory...</p>
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
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-portal-surface border border-portal-border shadow-2xs">
            <Car className="w-4 h-4 text-portal-text-muted" />
            <span className="text-xs font-medium text-portal-text-muted">Available:</span>
            <span className="font-mono text-xs font-bold text-portal-text">{items.length} Vehicles</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-portal-primary/10 border border-portal-primary/25 shadow-2xs">
            <Gavel className="w-4 h-4 text-portal-primary" />
            <span className="text-xs font-medium text-portal-primary">Your Bids:</span>
            <span className="font-mono text-xs font-bold text-portal-primary">
              {items.filter((i) => i.myCurrentBidCents).length} Active
            </span>
          </div>
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
          <option value="Porsche">Porsche</option>
          <option value="Tesla">Tesla</option>
          <option value="Ford">Ford</option>
          <option value="BMW">BMW</option>
          <option value="Toyota">Toyota</option>
        </select>

        {/* Mileage Filter */}
        <select
          value={maxMileage || ""}
          onChange={(e) => setMaxMileage(e.target.value ? parseInt(e.target.value, 10) : null)}
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
          onChange={(e) => setSortBy(e.target.value as any)}
          aria-label="Sort inventory listings"
          className="px-3.5 py-2.5 rounded-xl bg-portal-surface border border-portal-border text-xs text-portal-text focus:outline-none focus:ring-1 focus:ring-portal-primary cursor-pointer shadow-2xs"
        >
          <option value="closing">Closing Soonest</option>
          <option value="mileage">Lowest Mileage</option>
          <option value="year">Newest Year</option>
        </select>
      </div>

      {/* 3. Signature Notched Card Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-portal-surface rounded-2xl border border-portal-border space-y-3">
          <Car className="w-10 h-10 text-portal-text-muted mx-auto opacity-40" />
          <h3 className="font-headline text-base font-bold text-portal-text">No vehicles match your search</h3>
          <p className="text-xs text-portal-text-muted max-w-sm mx-auto">
            Try adjusting your filters or search terms to see available dealer inventory.
          </p>
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
          {filteredItems.map((item) => (
            <DealerAuctionCard
              key={item.id}
              item={item}
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
