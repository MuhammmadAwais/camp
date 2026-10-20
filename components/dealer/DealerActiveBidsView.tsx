"use client";

import React, { useState } from "react";
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
  ChevronRight,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Building2,
} from "lucide-react";
import type { WholesaleAuctionItem } from "@/lib/types/dealer";
import { SealedBidSlip } from "@/components/dealer/SealedBidSlip";
import { formatCadCents } from "@/lib/utils";

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
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
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
    auctionEndsAt: new Date(Date.now() + (0 * 60 + 12) * 60 * 1000).toISOString(), // Sub-15min Crimson urgency state
    myCurrentBidCents: 4100000,
    totalBidsPlaced: 23,
    reserveStatus: "RESERVE_MET",
    carfaxClean: true,
    keysCount: 2,
    hasLien: false,
    leadStatus: "OUTBID_ESTIMATE",
    placedAt: "Today at 1:15 PM",
  },
];

export function DealerActiveBidsView() {
  const [bids, setBids] = useState<DealerActiveBidItem[]>(INITIAL_ACTIVE_BIDS);
  const [filterTab, setFilterTab] = useState<"ALL" | "LEAD" | "OUTBID">("ALL");
  const [biddingAuction, setBiddingAuction] = useState<WholesaleAuctionItem | null>(null);

  const filteredBids = bids.filter((b) => {
    if (filterTab === "LEAD") return b.leadStatus === "LEAD_ESTIMATE";
    if (filterTab === "OUTBID") return b.leadStatus === "OUTBID_ESTIMATE";
    return true;
  });

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

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Banner */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary text-xs font-bold font-mono uppercase tracking-wider">
              Wholesale Active Floor
            </span>
            <span className="text-xs text-portal-text-muted font-mono">
              Pfaff Porsche (OMVIC-481920)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-portal-text font-headline tracking-tight">
            Active Placed Bids
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Real-time telemetry on open 24h auctions where your dealership holds an active sealed bid.
          </p>
        </div>

        {/* Quick Financial Exposure Summary */}
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-portal-surface-hover border border-portal-border text-right font-mono">
            <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
              Committed Bid Volume
            </span>
            <span className="text-xl font-black text-portal-primary">
              {formatCadCents(totalCommittedCents)}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-portal-surface-hover border border-portal-border text-right font-mono">
            <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
              Active Lots
            </span>
            <span className="text-xl font-black text-portal-text">
              {bids.length} Auctions
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-portal-border pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
              filterTab === "ALL"
                ? "bg-portal-primary text-white"
                : "bg-portal-surface-hover text-portal-text-muted hover:text-portal-text"
            }`}
          >
            All Placed ({bids.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("LEAD")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
              filterTab === "LEAD"
                ? "bg-portal-primary text-white"
                : "bg-portal-surface-hover text-portal-text-muted hover:text-portal-text"
            }`}
          >
            Leading ({bids.filter((b) => b.leadStatus === "LEAD_ESTIMATE").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("OUTBID")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
              filterTab === "OUTBID"
                ? "bg-portal-primary text-white"
                : "bg-portal-surface-hover text-portal-text-muted hover:text-portal-text"
            }`}
          >
            Outbid Attention ({bids.filter((b) => b.leadStatus === "OUTBID_ESTIMATE").length})
          </button>
        </div>

        <Link
          href="/dealer/inventory"
          className="text-xs font-semibold text-portal-primary hover:underline flex items-center gap-1 font-mono"
        >
          <span>Explore All Inventory</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Active Bids Table / Cards List */}
      <div className="space-y-4">
        {filteredBids.map((item) => {
          const endsAt = new Date(item.auctionEndsAt).getTime();
          const msLeft = endsAt - Date.now();
          const hoursLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60)));
          const minsLeft = Math.max(0, Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60)));
          const isUrgent = msLeft > 0 && msLeft < 15 * 60 * 1000;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border bg-portal-surface p-5 shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                isUrgent
                  ? "border-red-500/50 ring-1 ring-red-500/20"
                  : "border-portal-border hover:border-portal-primary/40"
              }`}
            >
              {/* Left Info & Photo */}
              <div className="flex items-start sm:items-center gap-4">
                <Link
                  href={`/dealer/auctions/${item.id}`}
                  className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden bg-portal-surface-hover shrink-0 border border-portal-border group"
                >
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.model}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="144px"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                    Grade {item.damageGrade}
                  </div>
                </Link>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-portal-text-muted">
                      VIN: ···{item.vin.slice(-6)}
                    </span>
                    <span className="text-xs text-portal-text-muted">•</span>
                    <span className="font-mono text-xs text-portal-text-muted">
                      {item.mileageKm.toLocaleString()} km
                    </span>
                    <span className="text-xs text-portal-text-muted">•</span>
                    <span className="text-xs text-portal-text-muted flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-portal-primary" />
                      {item.city}, {item.province}
                    </span>
                  </div>

                  <Link
                    href={`/dealer/auctions/${item.id}`}
                    className="text-lg font-bold text-portal-text hover:text-portal-primary transition-colors block"
                  >
                    {item.year} {item.make} {item.model} {item.trim}
                  </Link>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {/* Status Badge */}
                    {item.leadStatus === "LEAD_ESTIMATE" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-mono font-bold border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Leading Corridor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-xs font-mono font-bold border border-amber-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Likely Outbid
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-md bg-portal-surface-hover text-portal-text-muted text-[11px] font-mono border border-portal-border flex items-center gap-1">
                      <Lock className="w-3 h-3 text-portal-primary" />
                      {item.totalBidsPlaced} total sealed bids
                    </span>

                    <span className="text-[11px] text-portal-text-muted font-mono">
                      Placed: {item.placedAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Bid Financials & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-portal-border">
                {/* Time Remaining */}
                <div className="text-left lg:text-right font-mono">
                  <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
                    Auction Closes In
                  </span>
                  <div
                    className={`text-sm font-bold flex items-center gap-1 ${
                      isUrgent ? "text-red-500 animate-pulse" : "text-portal-text"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {hoursLeft > 0 ? `${hoursLeft}h ` : ""}
                      {minsLeft}m left
                    </span>
                  </div>
                </div>

                {/* Dealership Bid Amount */}
                <div className="text-left lg:text-right font-mono">
                  <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
                    Your Active Bid
                  </span>
                  <span className="text-xl font-black text-portal-text">
                    {formatCadCents(item.myCurrentBidCents ?? 0)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dealer/auctions/${item.id}`}
                    className="px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-bold transition-colors"
                  >
                    Inspect
                  </Link>
                  <button
                    type="button"
                    onClick={() => setBiddingAuction(item)}
                    className="px-4 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Raise Bid</span>
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
