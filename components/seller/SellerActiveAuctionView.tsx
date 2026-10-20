"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Car,
  FileText,
  DollarSign,
  Gavel,
  ChevronRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Award,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import type { ListingDetailData } from "@/lib/types/seller";
import { apiClient } from "@/lib/api-client";

interface SellerActiveAuctionViewProps {
  listingId: string;
}

export function SellerActiveAuctionView({ listingId }: SellerActiveAuctionViewProps) {
  const router = useRouter();
  const [data, setData] = useState<ListingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Time remaining state
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 17, minutes: 42, seconds: 0 });

  // Fetch listing data
  const fetchListing = async (overrideStatus?: string) => {
    try {
      setIsLoading(true);
      const url = overrideStatus
        ? `/api/listings/${listingId}?status=${overrideStatus}`
        : `/api/listings/${listingId}`;
      const res = await apiClient.api.get<ListingDetailData>(url);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || "Failed to load listing details");
      }
    } catch {
      setError("Unable to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [listingId]);

  // Live countdown timer
  useEffect(() => {
    if (!data?.auction.auctionEndsAt || data.auction.status !== "ACTIVE") return;

    const interval = setInterval(() => {
      const target = new Date(data.auction.auctionEndsAt!).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.auction.auctionEndsAt, data?.auction.status]);

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-portal-primary animate-spin" />
          <p className="text-sm font-medium text-portal-text-muted">Connecting to sealed auction floor...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-portal-text">Listing Not Found</h3>
        <p className="text-sm text-portal-text-muted">{error || "Could not retrieve auction data."}</p>
        <Link
          href="/seller/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-portal-primary text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Seller Dashboard</span>
        </Link>
      </div>
    );
  }

  const { auction, photos, damageHotspots, specs } = data;
  const currentPhoto = photos[selectedPhotoIndex] || photos[0];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Live Simulation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/seller/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-portal-text-muted hover:text-portal-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Demo Stage Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-portal-surface border border-portal-border text-xs">
          <span className="text-[11px] font-mono text-portal-text-muted px-2">Demo Stage:</span>
          <button
            type="button"
            onClick={() => fetchListing("ACTIVE")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              auction.status === "ACTIVE"
                ? "bg-portal-primary text-white shadow-xs"
                : "text-portal-text-muted hover:text-portal-text"
            }`}
          >
            Live (24h)
          </button>
          <button
            type="button"
            onClick={() => fetchListing("UNSEALED")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              auction.status === "UNSEALED"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-portal-text-muted hover:text-portal-text"
            }`}
          >
            Unsealed (Bids Open)
          </button>
          <button
            type="button"
            onClick={() => fetchListing("ACCEPTED")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              auction.status === "ACCEPTED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-portal-text-muted hover:text-portal-text"
            }`}
          >
            Accepted (Voucher)
          </button>
        </div>
      </div>

      {/* Main Auction Status Hero Banner */}
      <div className="bg-portal-surface border border-portal-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-portal-border">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  auction.status === "ACTIVE"
                    ? "bg-[#8C383E]/10 dark:bg-[#E59344]/15 text-[#8C383E] dark:text-[#E59344] border border-[#8C383E]/20"
                    : auction.status === "UNSEALED"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span>
                  {auction.status === "ACTIVE"
                    ? "24-Hour Live Sealed Wholesale Auction"
                    : auction.status === "UNSEALED"
                    ? "Auction Concluded — Bids Unsealed"
                    : "Dealership Offer Accepted"}
                </span>
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-portal-surface-hover border border-portal-border text-portal-text-muted">
                VIN: {auction.vin}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-headline text-portal-text">
              {auction.year} {auction.make} {auction.model} {auction.trim}
            </h1>
            <p className="text-xs sm:text-sm text-portal-text-muted mt-1 flex items-center gap-2">
              <span>{auction.mileageKm.toLocaleString()} km</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-portal-primary" />
                <span>{auction.city}, {auction.province}</span>
              </span>
            </p>
          </div>

          {/* Right Action Block based on Status */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            {auction.status === "ACTIVE" && (
              <>
                <div className="flex items-center gap-3 bg-portal-surface-hover p-3 rounded-xl border border-portal-border">
                  <Clock className="w-5 h-5 text-portal-primary shrink-0" />
                  <div>
                    <span className="block text-[11px] font-medium text-portal-text-muted uppercase tracking-wider">
                      Auction Closes In
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-bold text-portal-text tracking-wider tabular-nums">
                      {String(timeLeft.hours).padStart(2, "0")}h {String(timeLeft.minutes).padStart(2, "0")}m {String(timeLeft.seconds).padStart(2, "0")}s
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-portal-text-muted">
                  <Lock className="w-3.5 h-3.5 text-portal-primary" />
                  <span>Sealed Bids: <strong className="text-portal-text">{auction.bidCount} Certified Dealers</strong></span>
                </div>
              </>
            )}

            {auction.status === "UNSEALED" && (
              <Link
                href={`/seller/listings/${listingId}/select-dealer`}
                id="btn-view-unsealed-bids"
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-portal-primary hover:bg-portal-primary-hover text-white shadow-md transition-all cursor-pointer"
              >
                <span>Review & Select Winning Dealer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            {auction.status === "ACCEPTED" && (
              <Link
                href={`/seller/listings/${listingId}/appointment`}
                id="btn-view-voucher"
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>View Dealership Voucher & Pass</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Invariant Banner & Key Telemetry Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-portal-surface-hover/80 border border-portal-border space-y-1">
            <span className="text-portal-text-muted block text-[11px] uppercase tracking-wider font-semibold">
              Reserve Asking Price
            </span>
            <span className="font-mono text-lg font-bold text-portal-text block">
              {formatCadCents(auction.reservePriceCents)}
            </span>
            <span className="text-[11px] text-portal-text-muted">
              {auction.reservePriceCents === 0 ? "No reserve wholesale auction" : "Guaranteed minimum asking threshold"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-portal-surface-hover/80 border border-portal-border space-y-1">
            <span className="text-portal-text-muted block text-[11px] uppercase tracking-wider font-semibold">
              Certified Dealer Activity
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-portal-primary">
                {auction.bidCount} Dealer Bids Placed
              </span>
            </div>
            <span className="text-[11px] text-portal-text-muted flex items-center gap-1">
              <Lock className="w-3 h-3 text-portal-primary" />
              <span>Sealed-bid invariant active</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-portal-surface-hover/80 border border-portal-border space-y-1">
            <span className="text-portal-text-muted block text-[11px] uppercase tracking-wider font-semibold">
              Legal Compliance Protection
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>OMVIC / AMVIC Regulated</span>
            </div>
            <span className="text-[11px] text-portal-text-muted">
              Protected by Canadian licensed dealer escrow
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Photo Showcase & Vehicle Inspection Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Photo Carousel (7 cols) */}
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
              {currentPhoto?.isCover && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-portal-primary text-white text-xs font-bold shadow-md flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auction Cover Photo</span>
                </div>
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
                    selectedPhotoIndex === idx
                      ? "border-portal-primary scale-105 shadow-xs"
                      : "border-portal-border opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={photo.url} alt="thumbnail" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          </div>

          {/* Declared Damage Hotspots Card */}
          <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold font-headline text-portal-text flex items-center justify-between">
              <span>Declared Condition Disclosures</span>
              <span className="text-xs font-mono text-portal-text-muted">
                {damageHotspots.length} Disclosed Areas
              </span>
            </h3>

            {damageHotspots.length === 0 ? (
              <p className="text-xs text-portal-text-muted">No cosmetic damage or mechanical defects declared.</p>
            ) : (
              <div className="space-y-2">
                {damageHotspots.map((spot) => (
                  <div
                    key={spot.id}
                    className="p-3 rounded-xl bg-portal-surface-hover/70 border border-portal-border flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-portal-text block">{spot.panel}</span>
                      <p className="text-portal-text-muted text-[11px] mt-0.5">{spot.description}</p>
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

        {/* Right Column: Complete Specs Sheet (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold font-headline text-portal-text">
              Verified Technical Specifications
            </h3>

            <div className="divide-y divide-portal-border text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Transmission</span>
                <span className="font-medium text-portal-text">{specs.transmission || "Automatic"}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Drivetrain</span>
                <span className="font-medium text-portal-text">{specs.drivetrain || "AWD"}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Exterior Colour</span>
                <span className="font-medium text-portal-text">{specs.exteriorColor || "Volcano Grey"}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Interior Trim</span>
                <span className="font-medium text-portal-text">{specs.interiorColor || "Black Leather"}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Key Pairs Included</span>
                <span className="font-medium text-portal-text">{specs.keysCount} Master Keys</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Collision History</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {specs.accidentDeclaration ? "Declaration Filed" : "Clean Title / Zero Accidents"}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-portal-text-muted">Registered Canadian Lien</span>
                <span className="font-medium text-portal-text">
                  {specs.hasLien ? "Lien Present (Escrow Settled)" : "Clear Unencumbered Title"}
                </span>
              </div>
            </div>
          </div>

          {/* Sealed Bid Rule Assurance Card */}
          <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 shadow-xs space-y-2.5">
            <h4 className="text-xs font-semibold text-portal-text uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-portal-primary" />
              <span>How AutoNexa Sealed Bidding Works</span>
            </h4>
            <p className="text-xs text-portal-text-muted leading-relaxed">
              Certified dealerships across Ontario and Quebec submit blind competitive offers. Bids are cryptographically
              sealed until the 24-hour clock expires, eliminating lowball sniping and maximizing wholesale return.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
