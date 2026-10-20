"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Gavel,
  Clock,
  Lock,
  Search,
  Filter,
  ArrowUpDown,
  MapPin,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Layers,
  Car,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import type { WholesaleAuctionItem, DamageGrade } from "@/lib/types/dealer";
import { SealedBidSlip } from "@/components/dealer/SealedBidSlip";
import { apiClient } from "@/lib/api-client";

export function DealerInventoryFeed() {
  const [items, setItems] = useState<WholesaleAuctionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [makeFilter, setMakeFilter] = useState("ALL");
  const [maxMileage, setMaxMileage] = useState<number | null>(null);
  const [damageFilter, setDamageFilter] = useState<DamageGrade | "ALL">("ALL");
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
        const errText = !res.success ? res.error : "Failed to load wholesale exchange feed";
        setError(errText || "Failed to load wholesale exchange feed");
      }
    } catch {
      setError("Unable to connect to wholesale feed");
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
        if (damageFilter !== "ALL" && item.damageGrade !== damageFilter) {
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
  }, [items, makeFilter, maxMileage, damageFilter, searchQuery, sortBy]);

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
          <p className="text-sm font-medium text-portal-text-muted">Loading wholesale trading floor exchange...</p>
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

      {/* Exchange Banner & Realtime Telemetry Stats */}
      <div className="bg-portal-surface border border-portal-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-portal-primary/10 text-portal-primary border border-portal-primary/25 flex items-center gap-1">
                <Gavel className="w-3.5 h-3.5" />
                <span>Live Wholesale Auction Exchange</span>
              </span>
              <span className="text-xs font-mono text-portal-text-muted">
                Ontario & Quebec Certified Floor
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-headline text-portal-text">
              Live Dealer Wholesale Floor
            </h1>
            <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
              Participate in 24-hour sealed-bid wholesale acquisitions from verified private Canadian sellers.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 bg-portal-surface-hover rounded-xl border border-portal-border text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-semibold text-portal-text-muted block">Active Floor</span>
              <span className="font-mono text-xl font-bold text-portal-text">{items.length} Units</span>
            </div>
            <div className="p-3 bg-portal-surface-hover rounded-xl border border-portal-border text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-semibold text-portal-text-muted block">Your Bids</span>
              <span className="font-mono text-xl font-bold text-portal-primary">
                {items.filter((i) => i.myCurrentBidCents).length} Active
              </span>
            </div>
          </div>
        </div>

        {/* Faceted Filters Toolbar */}
        <div className="pt-4 border-t border-portal-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
            <input
              type="text"
              id="dealer-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by Make, Model, VIN, or City..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-portal-surface-hover border border-portal-border text-xs text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:ring-1 focus:ring-portal-primary"
            />
          </div>

          {/* Make Filter */}
          <select
            value={makeFilter}
            onChange={(e) => setMakeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-portal-surface-hover border border-portal-border text-xs text-portal-text focus:outline-none focus:ring-1 focus:ring-portal-primary cursor-pointer"
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
            className="px-3 py-2 rounded-xl bg-portal-surface-hover border border-portal-border text-xs text-portal-text focus:outline-none focus:ring-1 focus:ring-portal-primary cursor-pointer"
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
            className="px-3 py-2 rounded-xl bg-portal-surface-hover border border-portal-border text-xs text-portal-text focus:outline-none focus:ring-1 focus:ring-portal-primary cursor-pointer"
          >
            <option value="closing">Closing Soonest</option>
            <option value="mileage">Lowest Mileage</option>
            <option value="year">Newest Year</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          // Check if sub-15min urgency state
          const msLeft = Math.max(0, new Date(item.auctionEndsAt).getTime() - Date.now());
          const isUrgent = msLeft < 15 * 60 * 1000;
          const hours = Math.floor(msLeft / (1000 * 60 * 60));
          const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

          return (
            <div
              key={item.id}
              className={`bg-portal-surface border rounded-2xl overflow-hidden shadow-xs hover:border-portal-primary/60 transition-all flex flex-col justify-between ${
                isUrgent ? "border-red-500/50 ring-1 ring-red-500/20" : "border-portal-border"
              }`}
            >
              <Link href={`/dealer/auctions/${item.id}`} className="block group cursor-pointer">
                {/* Photo Header */}
                <div className="relative w-full aspect-16/10 bg-portal-surface-hover overflow-hidden">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.model}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  {/* Urgency / Countdown Pill */}
                  <div
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-md ${
                      isUrgent
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-black/75 text-white backdrop-blur-xs"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {hours > 0 ? `${hours}h ` : ""}
                      {minutes}m left
                    </span>
                  </div>

                  {/* Reserve / Sealed Bids Badge */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[11px] font-mono flex items-center gap-1">
                    <Lock className="w-3 h-3 text-portal-primary" />
                    <span>{item.totalBidsPlaced} bids</span>
                  </div>

                  {/* Damage Grade Pill */}
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold tracking-wider uppercase">
                    Grade {item.damageGrade} • {item.damageHotspotCount === 0 ? "Clean Body" : `${item.damageHotspotCount} Disclosed`}
                  </div>
                </div>

                {/* Body Specs */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-portal-text leading-snug group-hover:text-portal-primary transition-colors">
                      {item.year} {item.make} {item.model}
                    </h3>
                    <p className="text-xs text-portal-text-muted">{item.trim}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-portal-text-muted font-mono pt-1">
                    <div className="p-2 rounded-lg bg-portal-surface-hover">
                      <span className="block text-portal-text font-semibold">
                        {item.mileageKm.toLocaleString()} km
                      </span>
                      <span>Odometer</span>
                    </div>
                    <div className="p-2 rounded-lg bg-portal-surface-hover">
                      <span className="block text-portal-text font-semibold truncate">
                        {item.drivetrain}
                      </span>
                      <span>Drivetrain</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-portal-text-muted pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-portal-primary" />
                      <span>{item.city}, {item.province} ({item.distanceKm} km)</span>
                    </span>
                    <span className="font-mono text-[11px]">···{item.vin.slice(-6)}</span>
                  </div>
                </div>
              </Link>

              {/* Bottom Bid Action Bar */}
              <div className="p-4 pt-3 border-t border-portal-border bg-portal-surface-hover/50 flex items-center justify-between gap-2">
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-portal-text-muted">
                    Your Sealed Bid
                  </span>
                  <span className="font-mono text-sm font-bold text-portal-text">
                    {item.myCurrentBidCents
                      ? formatCadCents(item.myCurrentBidCents)
                      : "No Bid Placed"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dealer/auctions/${item.id}`}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-portal-text-muted hover:text-portal-text bg-portal-surface border border-portal-border hover:bg-portal-surface-hover transition-colors"
                  >
                    Inspect
                  </Link>
                  <button
                    type="button"
                    onClick={() => setBiddingAuction(item)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      item.myCurrentBidCents
                        ? "bg-portal-surface border border-portal-primary text-portal-primary hover:bg-portal-primary hover:text-white"
                        : "bg-portal-primary hover:bg-portal-primary-hover text-white"
                    }`}
                  >
                    {item.myCurrentBidCents ? "Raise Bid" : "Place Bid"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
