"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Lock,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Car,
  DollarSign,
  Gavel,
  RefreshCw,
  Award,
  ChevronsUpDown,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import type { AuctionStatus } from "@/lib/types/seller";
import { useSellerListingDetail } from "@/hooks/useSellerDashboard";
import { useAuctionRealtime } from "@/hooks/useAuctionRealtime";
import { VehicleSwitcherModal } from "@/components/seller/VehicleSwitcherModal";

interface SellerActiveAuctionViewProps {
  listingId: string;
}

const STATUS_BADGE_LABELS: Record<AuctionStatus, string> = {
  DRAFT: "Draft Listing",
  PENDING_MODERATION: "Under Review",
  EDITS_REQUESTED: "Corrections Requested",
  REJECTED: "Submission Declined",
  ACTIVE: "Live 24h Auction",
  UNSEALED: "Auction Ended • Bids Ready",
  ACCEPTED: "Dealership Offer Accepted",
  COMPLETED: "Sale Completed",
  EXPIRED: "Auction Expired",
  CANCELLED: "Auction Cancelled",
};

export function SellerActiveAuctionView({
  listingId,
}: SellerActiveAuctionViewProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useSellerListingDetail(listingId);

  const realtime = useAuctionRealtime({
    listingId,
    auctionEndsAt: data?.auction.auctionEndsAt,
    serverTime: data?.serverTime,
    dataUpdatedAt,
    status: data?.auction.status,
    enabled: Boolean(data),
    portal: "seller",
  });

  const [photoSelection, setPhotoSelection] = useState<{
    listingId: string;
    index: number;
  }>({ listingId, index: 0 });
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  const selectedPhotoIndex =
    photoSelection.listingId === listingId ? photoSelection.index : 0;
  const setSelectedPhotoIndex = (index: number) => {
    setPhotoSelection({ listingId, index });
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-portal-primary animate-spin" />
          <p className="text-sm font-medium text-portal-text-muted">
            Loading vehicle auction details...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-portal-text">
          Listing Not Found
        </h3>
        <p className="text-sm text-portal-text-muted">
          {error instanceof Error
            ? error.message
            : "Could not retrieve auction data."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/seller/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-portal-primary text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Seller Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-portal-border bg-portal-surface text-portal-text cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const { auction, photos, damageHotspots, specs } = data;
  const safePhotoIndex = Math.min(
    selectedPhotoIndex,
    Math.max(0, photos.length - 1)
  );
  const currentPhoto = photos[safePhotoIndex] || photos[0];
  const { countdown } = realtime;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb, VIN & Vehicle Switcher Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/seller/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-portal-text-muted hover:text-portal-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-portal-border hidden sm:inline">•</span>
          <span className="text-xs font-mono text-portal-text-muted hidden sm:inline">
            VIN: {auction.vin}
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {auction.status === "ACTIVE" && realtime.isLive && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Sync</span>
            </span>
          )}

          {/* Prominent Vehicle Switcher Pill Button */}
          <button
            type="button"
            id="btn-switch-vehicle-auction"
            onClick={() => setVehicleModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-portal-surface border border-portal-border hover:border-portal-primary/50 text-xs font-medium text-portal-text shadow-2xs hover:bg-portal-surface-hover transition-all cursor-pointer group"
          >
            <Car className="w-3.5 h-3.5 text-portal-primary" />
            <span className="font-semibold">
              {auction.year} {auction.make} {auction.model}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
              {auction.status === "ACTIVE"
                ? `${auction.bidCount} ${auction.bidCount === 1 ? "Bid" : "Bids"}`
                : STATUS_BADGE_LABELS[auction.status]}
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-portal-text-muted group-hover:text-portal-text transition-colors" />
          </button>
        </div>
      </div>

      {/* Main Vehicle Header Card with Dashboard-Style 4-Metric Bar */}
      <div className="bg-gradient-to-b from-portal-surface/90 via-portal-surface/40 to-transparent backdrop-blur-xs rounded-2xl p-5 sm:p-6 space-y-6 border-0 shadow-none outline-none ring-0">
        {/* Title & Status Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-portal-surface-hover text-portal-text border-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    auction.status === "ACTIVE"
                      ? "bg-emerald-500 animate-pulse"
                      : auction.status === "PENDING_MODERATION" ||
                          auction.status === "EDITS_REQUESTED"
                        ? "bg-amber-500"
                        : "bg-portal-primary"
                  }`}
                />
                <span>{STATUS_BADGE_LABELS[auction.status]}</span>
              </span>
              <span className="text-xs font-mono text-portal-text-muted">
                VIN: {auction.vin}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-headline text-portal-text tracking-tight">
              {auction.year} {auction.make} {auction.model} {auction.trim}
            </h1>
            <p className="text-xs sm:text-sm text-portal-text-muted mt-1 flex items-center gap-2">
              <span className="font-mono">
                {auction.mileageKm.toLocaleString()} km
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-portal-primary" />
                <span>
                  {auction.city}, {auction.province}
                </span>
              </span>
            </p>
          </div>

          {/* Action Button based on state */}
          {auction.status === "UNSEALED" && (
            <Link
              href={`/seller/listings/${listingId}/select-dealer`}
              id="btn-view-unsealed-bids"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-portal-primary hover:bg-portal-primary-hover text-white shadow-md transition-all cursor-pointer self-start lg:self-auto"
            >
              <span>Review & Select Winning Dealer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {(auction.status === "ACCEPTED" ||
            auction.status === "COMPLETED") && (
            <Link
              href={`/seller/listings/${listingId}/appointment`}
              id="btn-view-voucher"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 shadow-md transition-all cursor-pointer self-start lg:self-auto"
            >
              <Award className="w-4 h-4" />
              <span>View Dealership Voucher</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* 4-Metric Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-portal-border-subtle/60">
          {/* Col 1: Reserve Price */}
          <div className="flex items-center justify-between pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Reserve Asking Price
              </span>
              <span className="font-headline text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block">
                {formatCadCents(auction.reservePriceCents)}
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                {auction.reservePriceCents === 0
                  ? "No reserve auction"
                  : "Confidential minimum"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Col 2: Dealer Activity */}
          <div className="flex items-center justify-between sm:border-l border-portal-border-subtle/60 sm:pl-4 pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Dealer Activity
              </span>
              <span className="font-headline text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block">
                {auction.bidCount}{" "}
                {auction.bidCount === 1 ? "Bid Placed" : "Bids Placed"}
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 flex items-center gap-1">
                <Lock className="w-3 h-3 text-portal-primary" />
                <span>Private sealed bids</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <Gavel className="w-5 h-5" />
            </div>
          </div>

          {/* Col 3: Time Remaining */}
          <div className="flex items-center justify-between lg:border-l border-portal-border-subtle/60 lg:pl-4 pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Time Remaining
              </span>
              <span className="font-mono text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block tabular-nums">
                {auction.status === "ACTIVE"
                  ? countdown.formatted
                  : auction.status === "UNSEALED"
                    ? "Ended"
                    : auction.status === "ACCEPTED" ||
                        auction.status === "COMPLETED"
                      ? "Finalized"
                      : "Pending"}
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                {auction.status === "ACTIVE" && countdown.isUrgent
                  ? "Closing soon"
                  : "24-hour auction floor"}
              </span>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                auction.status === "ACTIVE" && countdown.isUrgent
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse"
                  : "bg-portal-surface-hover text-portal-primary"
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Col 4: Consumer Protection */}
          <div className="flex items-center justify-between sm:border-l border-portal-border-subtle/60 sm:pl-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">
                Dealer Protection
              </span>
              <span className="font-headline text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block">
                Regulated Escrow
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                OMVIC & AMVIC compliant
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Photo Showcase & Vehicle Inspection Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Photo Carousel & Condition Hotspots (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden shadow-xs">
            <div className="relative w-full aspect-16/10 bg-portal-surface-hover">
              {currentPhoto && (
                <Image
                  src={currentPhoto.url}
                  alt={`${auction.year} ${auction.make} ${auction.model}`}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="p-3 bg-portal-surface border-t border-portal-border flex gap-2 overflow-x-auto scrollbar-none">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    safePhotoIndex === idx
                      ? "border-portal-primary scale-105 shadow-xs"
                      : "border-portal-border opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt="thumbnail"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Condition Disclosures Card */}
          <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold font-headline text-portal-text flex items-center justify-between">
              <span>Vehicle Condition & Flaws</span>
              <span className="text-xs font-mono text-portal-text-muted">
                {damageHotspots.length === 0
                  ? "Clean Body"
                  : `${damageHotspots.length} Disclosed`}
              </span>
            </h3>

            {damageHotspots.length === 0 ? (
              <p className="text-xs text-portal-text-muted">
                No cosmetic damage or mechanical flaws declared on this vehicle.
              </p>
            ) : (
              <div className="space-y-2">
                {damageHotspots.map((spot) => (
                  <div
                    key={spot.id}
                    className="p-3 rounded-xl bg-portal-surface-hover/70 border border-portal-border flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-portal-text block">
                        {spot.panel}
                      </span>
                      <p className="text-portal-text-muted text-[11px] mt-0.5">
                        {spot.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        spot.severity === "MINOR"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : spot.severity === "MODERATE"
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}
                    >
                      {spot.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Complete Specs Sheet & Auction Guidance (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold font-headline text-portal-text">
              Vehicle Specifications
            </h3>

            <div className="divide-y divide-portal-border text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Transmission</span>
                <span className="font-medium text-portal-text">
                  {specs.transmission || "Automatic"}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Drivetrain</span>
                <span className="font-medium text-portal-text">
                  {specs.drivetrain || "AWD"}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Exterior Colour</span>
                <span className="font-medium text-portal-text">
                  {specs.exteriorColor || "Not specified"}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Interior Trim</span>
                <span className="font-medium text-portal-text">
                  {specs.interiorColor || "Not specified"}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">
                  Key Pairs Included
                </span>
                <span className="font-medium text-portal-text">
                  {specs.keysCount} Keys
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Accident History</span>
                <span className="font-medium text-portal-text">
                  {specs.accidentDeclaration
                    ? "Accident history declared"
                    : "Clean History / No Accidents"}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Lien Status</span>
                <span className="font-medium text-portal-text">
                  {specs.hasLien
                    ? "Financing lien present (settled at closing)"
                    : "Clear Title / No Liens"}
                </span>
              </div>
            </div>
          </div>

          {/* How Bidding Works Card */}
          <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 shadow-xs space-y-2.5">
            <h4 className="text-xs font-semibold text-portal-text uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-portal-primary" />
              <span>How AutoNexa Bidding Works</span>
            </h4>
            <p className="text-xs text-portal-text-muted leading-relaxed">
              Verified Canadian dealers submit private bids during the 24-hour
              auction window. Bids remain confidential until the timer expires
              to ensure you receive the highest fair market offer.
            </p>
          </div>
        </div>
      </div>

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
          thumbnailUrl: photos?.[0]?.url,
        }}
      />
    </div>
  );
}
