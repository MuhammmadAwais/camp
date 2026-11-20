"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Lock,
  Gavel,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  MapPin,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ArrowUpRight,
  ChevronsUpDown,
  RefreshCw,
} from "lucide-react";
import type { VehicleInspectionDetails } from "@/lib/types/dealer";
import { SealedBidSlip } from "@/components/dealer/SealedBidSlip";
import { DealerBidSwitcherModal } from "@/components/dealer/DealerBidSwitcherModal";
import { useDealerAuctionDetail } from "@/hooks/useDealerInventory";
import { dealerKeys } from "@/lib/query-keys";
import { formatCadCents } from "@/lib/utils";

export type { VehicleInspectionDetails } from "@/lib/types/dealer";

interface VehicleInspectionViewProps {
  auctionId: string;
}

const emptySubscribe = () => () => {};

export function VehicleInspectionView({ auctionId }: VehicleInspectionViewProps) {
  const queryClient = useQueryClient();
  const {
    data: vehicle,
    isLoading,
    isError,
    error,
    refetch,
  } = useDealerAuctionDetail(auctionId);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [photoSelection, setPhotoSelection] = useState<{
    auctionId: string;
    index: number;
  }>({ auctionId, index: 0 });
  const [lightboxAuctionId, setLightboxAuctionId] = useState<string | null>(
    null
  );
  const [isBidSlipOpen, setIsBidSlipOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [copiedVin, setCopiedVin] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const selectedPhotoIndex =
    photoSelection.auctionId === auctionId ? photoSelection.index : 0;
  const setSelectedPhotoIndex = (
    updater: number | ((prev: number) => number)
  ) => {
    setPhotoSelection((prev) => {
      const current = prev.auctionId === auctionId ? prev.index : 0;
      const next = typeof updater === "function" ? updater(current) : updater;
      return { auctionId, index: next };
    });
  };

  const isLightboxOpen = lightboxAuctionId === auctionId;
  const setIsLightboxOpen = (open: boolean) => {
    setLightboxAuctionId(open ? auctionId : null);
  };

  // Lock background scroll and listen for Escape key when lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxAuctionId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen]);

  const auctionEndsAt = vehicle?.auctionEndsAt;
  useEffect(() => {
    if (!auctionEndsAt) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [auctionEndsAt]);

  const timeLeft = useMemo(() => {
    if (!mounted || !auctionEndsAt) {
      return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    }
    const diff = new Date(auctionEndsAt).getTime() - nowMs;
    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { hours, minutes, seconds, totalMs: diff };
  }, [mounted, auctionEndsAt, nowMs]);

  if (isLoading) {
    return (
      <div className="min-h-[520px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-portal-primary animate-spin" />
          <p className="text-sm font-medium text-portal-text-muted">
            Loading vehicle inspection dossier...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="min-h-[460px] flex items-center justify-center">
        <div className="max-w-md w-full p-6 rounded-2xl bg-portal-surface border border-portal-border text-center space-y-4">
          <AlertCircle className="w-9 h-9 text-error mx-auto" />
          <div className="space-y-1">
            <h2 className="font-headline text-lg font-bold text-portal-text">
              Vehicle inspection sheet unavailable
            </h2>
            <p className="text-xs text-portal-text-muted">
              {error instanceof Error
                ? error.message
                : "This auction could not be found or is no longer active."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-1">
            <Link
              href="/dealer/inventory"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-xs font-semibold text-portal-text hover:border-portal-primary/40 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Inventory</span>
            </Link>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-portal-primary text-white text-xs font-semibold hover:bg-portal-primary-hover transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isUrgent =
    vehicle.isAuctionOpen && timeLeft.totalMs > 0 && timeLeft.totalMs < 15 * 60 * 1000;

  const photos =
    vehicle.photos && vehicle.photos.length > 0
      ? vehicle.photos
      : [vehicle.thumbnailUrl];
  const safePhotoIndex = Math.min(
    selectedPhotoIndex,
    Math.max(0, photos.length - 1)
  );

  const handleCopyVin = () => {
    void navigator.clipboard.writeText(vehicle.vin);
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  const handleBidSuccess = (_auctionId: string, newBidAmountCents: number) => {
    queryClient.setQueryData<VehicleInspectionDetails>(
      dealerKeys.auction(auctionId),
      (prev) => {
        if (!prev) return prev;
        const hadBid = Boolean(prev.myCurrentBidCents);
        return {
          ...prev,
          myCurrentBidCents: newBidAmountCents,
          totalBidsPlaced: hadBid
            ? prev.totalBidsPlaced
            : prev.totalBidsPlaced + 1,
        };
      }
    );
    void queryClient.invalidateQueries({ queryKey: dealerKeys.inventory() });
    void queryClient.invalidateQueries({
      queryKey: dealerKeys.auction(auctionId),
    });
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Top Breadcrumb & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dealer/inventory"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-portal-text-muted hover:text-portal-text transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Inventory</span>
          </Link>
          <span className="text-portal-border hidden sm:inline">•</span>

          {/* Consolidated Single Copy VIN Pill */}
          <button
            type="button"
            onClick={handleCopyVin}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text text-xs font-mono transition-colors cursor-pointer shadow-2xs"
            title="Click to copy full 17-digit VIN"
          >
            {copiedVin ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  VIN Copied
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>VIN: {vehicle.vin}</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Active Bids Switcher Pill Button */}
          <button
            type="button"
            id="btn-switch-dealer-bids"
            onClick={() => setIsSwitcherOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-portal-surface border border-portal-border hover:border-portal-primary/50 text-xs font-medium text-portal-text shadow-2xs hover:bg-portal-surface-hover transition-all cursor-pointer group"
          >
            <Gavel className="w-3.5 h-3.5 text-portal-primary" />
            <span className="font-semibold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-portal-surface-hover text-portal-text-muted text-[10px] font-mono font-medium border border-portal-border">
              {vehicle.myCurrentBidCents
                ? `Your Bid: ${formatCadCents(vehicle.myCurrentBidCents)}`
                : `${vehicle.totalBidsPlaced} ${vehicle.totalBidsPlaced === 1 ? "Bid" : "Bids"}`}
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-portal-text-muted group-hover:text-portal-text transition-colors" />
          </button>
        </div>
      </div>

      {/* 2. Main Vehicle Header Banner */}
      <div className="bg-gradient-to-b from-portal-surface/90 via-portal-surface/40 to-transparent backdrop-blur-xs rounded-2xl p-5 sm:p-6 space-y-6 border-0 shadow-none">
        {/* Title & Live Status Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {vehicle.isAuctionOpen ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live 24h Auction</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium font-mono bg-portal-surface-hover text-portal-text-muted border border-portal-border/60">
                  <span>Auction Closed • {vehicle.status}</span>
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium font-mono uppercase bg-portal-surface-hover text-portal-text-muted border border-portal-border/60">
                Grade {vehicle.damageGrade} Condition
              </span>
              {vehicle.hasLien ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Lien Disclosed
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-portal-surface-hover text-portal-text-muted border border-portal-border/60">
                  Lien-Free Title
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-headline text-portal-text tracking-tight">
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
            </h1>
            <p className="text-xs sm:text-sm text-portal-text-muted mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-mono font-medium text-portal-text">
                {vehicle.mileageKm.toLocaleString()} km
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-portal-primary" />
                <span>
                  {vehicle.city}, {vehicle.province} ({vehicle.distanceKm} km away)
                </span>
              </span>
              <span>•</span>
              <span>{vehicle.drivetrain}</span>
            </p>
          </div>

          {/* Regulatory Compliance Badge */}
          <div className="flex items-center gap-2 self-start lg:self-center px-3.5 py-2 rounded-xl bg-portal-surface border border-portal-border shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-portal-text-muted">
                Wholesale Compliance
              </span>
              <span className="block text-xs font-semibold text-portal-text">
                OMVIC & AMVIC Regulated
              </span>
            </div>
          </div>
        </div>

        {/* 4-Metric Appraisal & Auction State Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-portal-border-subtle/60">
          {/* Metric 1: Floor Competition */}
          <div className="flex items-center justify-between pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider">
                Floor Activity
              </span>
              <span className="font-headline text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block">
                {vehicle.totalBidsPlaced}{" "}
                {vehicle.totalBidsPlaced === 1 ? "Sealed Bid" : "Sealed Bids"}
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 flex items-center gap-1">
                <Lock className="w-3 h-3 text-portal-primary" />
                <span>Confidential bids placed</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <Gavel className="w-5 h-5" />
            </div>
          </div>

          {/* Metric 2: Time Remaining */}
          <div className="flex items-center justify-between sm:border-l border-portal-border-subtle/60 sm:pl-4 pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider">
                Time Remaining
              </span>
              <span className="font-mono text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block tabular-nums">
                {String(timeLeft.hours).padStart(2, "0")}h{" "}
                {String(timeLeft.minutes).padStart(2, "0")}m{" "}
                {String(timeLeft.seconds).padStart(2, "0")}s
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                {!vehicle.isAuctionOpen
                  ? "Bidding window ended"
                  : isUrgent
                    ? "Closing soon"
                    : "24-hour closing floor"}
              </span>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isUrgent
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse"
                  : "bg-portal-surface-hover text-portal-primary"
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Metric 3: Title & Escrow */}
          <div className="flex items-center justify-between lg:border-l border-portal-border-subtle/60 lg:pl-4 pr-0 sm:pr-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider">
                Wholesale Protection
              </span>
              <span className="font-headline text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block">
                Verified Escrow
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                Guaranteed settlement
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Metric 4: Declared Condition */}
          <div className="flex items-center justify-between sm:border-l border-portal-border-subtle/60 sm:pl-4">
            <div>
              <span className="text-portal-text-muted block text-[11px] font-semibold uppercase tracking-wider">
                Condition Declared
              </span>
              <span className="font-headline text-lg sm:text-xl font-black text-portal-text tracking-tight mt-0.5 block">
                Grade {vehicle.damageGrade}
              </span>
              <span className="text-[11px] text-portal-text-muted mt-0.5 block">
                {vehicle.damageHotspots.length > 0
                  ? `${vehicle.damageHotspots.length} declared ${vehicle.damageHotspots.length === 1 ? "imperfection" : "imperfections"}`
                  : "Pristine inspection record"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-portal-surface-hover flex items-center justify-center shrink-0 text-portal-primary">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column (7 cols): Immersive Gallery & Unified Condition Dossier */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          {/* High-Resolution Media Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-16/10 w-full rounded-2xl overflow-hidden bg-black/90 border border-portal-border group shadow-sm">
              <Image
                src={photos[safePhotoIndex]}
                alt={`${vehicle.make} ${vehicle.model} - Photo ${safePhotoIndex + 1}`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />

              {/* Top Controls Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] font-mono font-medium pointer-events-auto">
                  {safePhotoIndex + 1} / {photos.length} Photos
                </span>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-white text-[11px] font-mono backdrop-blur-md transition-colors cursor-pointer pointer-events-auto"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Lightbox</span>
                </button>
              </div>

              {/* Prev / Next Chevrons */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPhotoIndex((prev) =>
                        prev > 0 ? prev - 1 : photos.length - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPhotoIndex((prev) =>
                        prev < photos.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              {photos.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    safePhotoIndex === idx
                      ? "border-portal-primary scale-102 ring-2 ring-portal-primary/20 shadow-xs"
                      : "border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Unified Condition & Disclosures Section */}
          <div className="pt-2 space-y-4">
            <div className="flex items-center justify-between border-b border-portal-border pb-2.5">
              <h2 className="text-sm font-bold text-portal-text font-headline tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-portal-primary" />
                <span>Condition & Seller Disclosures</span>
              </h2>
              <span className="text-xs font-mono text-portal-text-muted">
                {vehicle.damageHotspots.length > 0
                  ? `${vehicle.damageHotspots.length} declared ${vehicle.damageHotspots.length === 1 ? "imperfection" : "imperfections"}`
                  : "Clean body declared"}
              </span>
            </div>

            {/* Disclosed Imperfections */}
            {vehicle.damageHotspots.length > 0 ? (
              <div className="space-y-3">
                {vehicle.damageHotspots.map((dmg, idx) => (
                  <div
                    key={dmg.id || idx}
                    className="p-4 rounded-2xl border border-portal-border bg-portal-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-portal-primary/10 text-portal-primary font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-portal-text">
                          {dmg.panel}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            dmg.severity === "MINOR"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : dmg.severity === "MODERATE"
                                ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}
                        >
                          {dmg.severity}
                        </span>
                      </div>
                      <p className="text-xs text-portal-text-muted pl-7 leading-relaxed">
                        {dmg.description || "Disclosed by seller on inspection map."}
                      </p>
                    </div>

                    {dmg.imageUrl && (
                      <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-portal-border shrink-0 self-center sm:self-auto shadow-2xs">
                        <Image
                          src={dmg.imageUrl}
                          alt={dmg.panel}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-portal-border bg-portal-surface flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-portal-text">
                    Pristine Condition Declared
                  </h4>
                  <p className="text-xs text-portal-text-muted">
                    No structural, cosmetic, or paint damage declared on any exterior panel.
                  </p>
                </div>
              </div>
            )}

            {/* Seller Notes Quote Block */}
            {vehicle.sellerNotes && (
              <div className="p-4 rounded-2xl border-l-3 border-portal-primary bg-portal-surface/80 border-y border-r border-portal-border space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider font-mono text-portal-text-muted">
                  <FileText className="w-3.5 h-3.5 text-portal-primary" />
                  <span>Seller Notes & Vehicle Provenance</span>
                </div>
                <p className="text-xs sm:text-sm text-portal-text-muted leading-relaxed whitespace-pre-line italic">
                  &ldquo;{vehicle.sellerNotes}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Single Unified Dealership Console */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
            {/* Tier 1: Action Console */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-portal-text-muted">
                  Your Dealership Bid
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-portal-surface-hover text-portal-text-muted font-mono text-[11px] truncate max-w-[230px]">
                  {vehicle.dealershipName} • Verified Dealer
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-headline text-portal-text tracking-tight">
                  {vehicle.myCurrentBidCents
                    ? formatCadCents(vehicle.myCurrentBidCents)
                    : "No Bid Placed"}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {vehicle.myCurrentBidCents ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Sealed Bid
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10.5px] font-medium bg-portal-surface-hover text-portal-text-muted border border-portal-border">
                      Floor Open
                    </span>
                  )}
                  <span className="text-xs text-portal-text-muted">
                    • {vehicle.totalBidsPlaced}{" "}
                    {vehicle.totalBidsPlaced === 1 ? "bid" : "bids"} placed
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={!vehicle.isAuctionOpen}
                onClick={() => setIsBidSlipOpen(true)}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-portal-primary hover:bg-portal-primary-hover text-white transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>
                  {!vehicle.isAuctionOpen
                    ? "Auction Closed"
                    : vehicle.myCurrentBidCents
                      ? "Revise Bid Higher"
                      : "Submit Sealed Bid"}
                </span>
              </button>

              <p className="text-[11px] text-center text-portal-text-muted">
                Sealed & private to your dealership until countdown elapses
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-portal-border/60" />

            {/* Tier 2: Vehicle Vitals */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-portal-text-muted block">
                Appraisal Vitals
              </span>
              <dl className="divide-y divide-portal-border/60 text-xs">
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-portal-text-muted font-medium">Odometer</dt>
                  <dd className="font-mono font-bold text-portal-text text-sm">
                    {vehicle.mileageKm.toLocaleString()} km
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-portal-text-muted font-medium">Powertrain</dt>
                  <dd className="font-semibold text-portal-text text-right">
                    {vehicle.engineSpec || "Standard Powertrain"}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-portal-text-muted font-medium">Transmission</dt>
                  <dd className="font-semibold text-portal-text text-right">
                    {vehicle.transmission}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-portal-text-muted font-medium">Drivetrain</dt>
                  <dd className="font-semibold text-portal-text text-right">
                    {vehicle.drivetrain}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-portal-text-muted font-medium">Exterior Color</dt>
                  <dd className="font-semibold text-portal-text text-right">
                    {vehicle.exteriorColor}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-portal-text-muted font-medium">Interior Trim</dt>
                  <dd className="font-semibold text-portal-text text-right">
                    {vehicle.interiorColor}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Divider */}
            <div className="border-t border-portal-border/60" />

            {/* Tier 3: Verified Title & Provenance */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-portal-text-muted flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Title & History Verification</span>
              </span>

              <dl className="divide-y divide-portal-border/60 text-xs">
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-portal-text-muted font-medium">
                    Accident History
                  </dt>
                  {vehicle.carfaxReport.accidentFree &&
                  !vehicle.accidentDeclaration ? (
                    <dd className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accident-Free</span>
                    </dd>
                  ) : (
                    <dd className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        {vehicle.accidentCount || 1}{" "}
                        {(vehicle.accidentCount || 1) === 1
                          ? "Accident"
                          : "Accidents"}{" "}
                        Declared
                      </span>
                    </dd>
                  )}
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-portal-text-muted font-medium">Ownership</dt>
                  <dd className="font-semibold text-portal-text text-right">
                    {vehicle.carfaxReport.ownersCount} Registered{" "}
                    {vehicle.carfaxReport.ownersCount === 1 ? "Owner" : "Owners"}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-portal-text-muted font-medium">
                    Title & Lien
                  </dt>
                  {vehicle.hasLien ? (
                    <dd className="font-semibold text-amber-600 dark:text-amber-400 text-right">
                      Active Lien Disclosed
                    </dd>
                  ) : (
                    <dd className="font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                      Lien-Free Disclosed
                    </dd>
                  )}
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-portal-text-muted font-medium">
                    Registration
                  </dt>
                  <dd className="font-medium text-portal-text text-right">
                    {vehicle.carfaxReport.registrationProvince}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-portal-text-muted font-medium">
                    Arbitration Terms
                  </dt>
                  <dd className="font-medium text-portal-text text-right">
                    48-Hour Inspection Guarantee
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Dealer Bids / Vehicle Switcher Modal */}
      <DealerBidSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        currentAuctionId={vehicle.id}
      />

      {/* Sealed Bid Placement Slip Modal */}
      {isBidSlipOpen && (
        <SealedBidSlip
          auction={vehicle}
          onClose={() => setIsBidSlipOpen(false)}
          onBidSuccess={handleBidSuccess}
        />
      )}

      {/* Lightbox Modal (Portaled to document.body to dim full screen including sidebar) */}
      {isLightboxOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
            onClick={() => setIsLightboxOpen(false)}
          >
            <div className="flex items-center justify-between text-white">
              <span className="font-mono text-xs opacity-75">
                {vehicle.year} {vehicle.make} {vehicle.model} • Photo{" "}
                {safePhotoIndex + 1} of {photos.length}
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono transition-colors cursor-pointer"
              >
                Close [ESC]
              </button>
            </div>

            <div
              className="relative flex-1 max-h-[80vh] my-auto flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full max-w-5xl">
                <Image
                  src={photos[safePhotoIndex]}
                  alt="Full preview"
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPhotoIndex((prev) =>
                        prev > 0 ? prev - 1 : photos.length - 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPhotoIndex((prev) =>
                        prev < photos.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            <div className="flex justify-center gap-2 overflow-x-auto py-2 no-scrollbar">
              {photos.map((url, idx) => (
                <button
                  key={`lb-${url}-${idx}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotoIndex(idx);
                  }}
                  className={`relative w-16 h-12 rounded-md overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    safePhotoIndex === idx
                      ? "border-portal-primary scale-105"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Thumb ${idx}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
