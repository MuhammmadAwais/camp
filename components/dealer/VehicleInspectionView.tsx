"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Lock,
  Gavel,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Calendar,
  Gauge,
  Key,
  Car,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Share2,
} from "lucide-react";
import type { WholesaleAuctionItem } from "@/lib/types/dealer";
import { SealedBidSlip } from "@/components/dealer/SealedBidSlip";
import { formatCadCents } from "@/lib/utils";

export type VehicleInspectionDetails = WholesaleAuctionItem & {
  engineSpec?: string;
  horsepower?: number;
  fuelType?: string;
  carfaxReport?: {
    ownersCount: number;
    accidentFree: boolean;
    serviceRecordsCount: number;
    lastReportedCity: string;
    registrationProvince: string;
    odometerRollbackRisk: boolean;
  };
  damageHotspots?: Array<{
    id: string;
    panel: string;
    severity: "MINOR" | "MODERATE" | "SEVERE";
    description: string;
    imageUrl?: string;
  }>;
  sellerNotes?: string;
};

interface VehicleInspectionViewProps {
  initialVehicle: VehicleInspectionDetails;
}

export function VehicleInspectionView({ initialVehicle }: VehicleInspectionViewProps) {
  const [vehicle, setVehicle] = useState<VehicleInspectionDetails>(initialVehicle);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isBidSlipOpen, setIsBidSlipOpen] = useState(false);
  const [copiedVin, setCopiedVin] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  }>({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  // Update countdown clock
  useEffect(() => {
    const updateCountdown = () => {
      const diff = new Date(vehicle.auctionEndsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, totalMs: diff });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [vehicle.auctionEndsAt]);

  const isUrgent = timeLeft.totalMs > 0 && timeLeft.totalMs < 15 * 60 * 1000;

  const handleCopyVin = () => {
    navigator.clipboard.writeText(vehicle.vin);
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  const handleBidSuccess = (_auctionId: string, newBidAmountCents: number) => {
    setVehicle((prev) => ({
      ...prev,
      myCurrentBidCents: newBidAmountCents,
      totalBidsPlaced: prev.myCurrentBidCents ? prev.totalBidsPlaced : prev.totalBidsPlaced + 1,
    }));
  };

  const photos = vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos : [vehicle.thumbnailUrl];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dealer/inventory"
          className="inline-flex items-center gap-2 text-xs font-semibold text-portal-text-muted hover:text-portal-text transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Wholesale Trading Floor</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyVin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text text-xs font-mono transition-colors cursor-pointer"
          >
            {copiedVin ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>VIN Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{vehicle.vin}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Title & Live Auction Status Bar */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary text-xs font-bold font-mono tracking-wider uppercase border border-portal-primary/20">
              Grade {vehicle.damageGrade} Condition
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold font-mono tracking-wider uppercase border ${
                vehicle.reserveStatus === "RESERVE_MET"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                  : vehicle.reserveStatus === "NO_RESERVE"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
                  : "bg-portal-surface-hover text-portal-text-muted border-portal-border"
              }`}
            >
              {vehicle.reserveStatus.replace("_", " ")}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-portal-surface-hover text-portal-text-muted text-xs font-mono border border-portal-border flex items-center gap-1">
              <MapPin className="w-3 h-3 text-portal-primary" />
              {vehicle.city}, {vehicle.province} ({vehicle.distanceKm} km away)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-sm font-medium text-portal-text-muted">{vehicle.trim}</p>
        </div>

        {/* Right Auction Urgency Clock & Bid CTA */}
        <div className="flex flex-wrap items-center gap-4 lg:self-center">
          {/* Digital Timer */}
          <div
            className={`px-4 py-3 rounded-xl border text-center font-mono ${
              isUrgent
                ? "bg-red-600 text-white border-red-700 animate-pulse"
                : "bg-portal-surface-hover border-portal-border text-portal-text"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold tracking-wider opacity-90 mb-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Auction Closes In</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight">
              {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
              {String(timeLeft.seconds).padStart(2, "0")}
            </div>
          </div>

          {/* Place / Revise Bid Action */}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setIsBidSlipOpen(true)}
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-portal-primary hover:bg-portal-primary-hover text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gavel className="w-4 h-4" />
              <span>{vehicle.myCurrentBidCents ? "Revise Sealed Bid" : "Place Sealed Bid"}</span>
            </button>
            <span className="text-[10px] text-portal-text-muted text-center font-mono">
              OMVIC / AMVIC Binding
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Photo Gallery & Damage Inspector */}
        <div className="lg:col-span-8 space-y-6">
          {/* High-Resolution Media Gallery */}
          <div className="rounded-2xl border border-portal-border bg-portal-surface p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-portal-primary" />
                <h2 className="text-sm font-bold text-portal-text uppercase tracking-wider font-mono">
                  Vehicle Gallery ({photos.length} High-Res Photos)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-portal-text-muted hover:text-portal-text font-mono transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full-Screen Lightbox</span>
              </button>
            </div>

            {/* Main Stage Viewport */}
            <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden bg-black/90 border border-portal-border group">
              <Image
                src={photos[selectedPhotoIndex]}
                alt={`${vehicle.make} ${vehicle.model} - Photo ${selectedPhotoIndex + 1}`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 65vw"
              />

              {/* Prev / Next Chevrons */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Bottom Photo Index Indicator */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs text-white text-xs font-mono font-medium">
                {selectedPhotoIndex + 1} / {photos.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    selectedPhotoIndex === idx
                      ? "border-portal-primary scale-102 ring-2 ring-portal-primary/20"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={url} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          </div>

          {/* Declared Damage Hotspots Inspector */}
          <div className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-portal-primary" />
                <h2 className="text-sm font-bold text-portal-text uppercase tracking-wider font-mono">
                  Condition & Declared Imperfections
                </h2>
              </div>
              <span className="text-xs font-mono text-portal-text-muted">
                {vehicle.damageHotspots && vehicle.damageHotspots.length > 0
                  ? `${vehicle.damageHotspots.length} Disclosed by Seller`
                  : "0 Imperfections Disclosed"}
              </span>
            </div>

            {vehicle.damageHotspots && vehicle.damageHotspots.length > 0 ? (
              <div className="space-y-3">
                {vehicle.damageHotspots.map((dmg, idx) => (
                  <div
                    key={dmg.id || idx}
                    className="p-4 rounded-xl border border-portal-border bg-portal-surface-hover/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-portal-primary/10 text-portal-primary font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-portal-text">{dmg.panel}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            dmg.severity === "MINOR"
                              ? "bg-amber-500/10 text-amber-500"
                              : dmg.severity === "MODERATE"
                              ? "bg-orange-500/10 text-orange-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {dmg.severity}
                        </span>
                      </div>
                      <p className="text-xs text-portal-text-muted pl-7 leading-relaxed">
                        {dmg.description}
                      </p>
                    </div>

                    {dmg.imageUrl && (
                      <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-portal-border shrink-0 self-center sm:self-auto">
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
              <div className="p-6 rounded-xl border border-dashed border-portal-border text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-portal-text">Pristine Condition Declared</h4>
                <p className="text-xs text-portal-text-muted max-w-md mx-auto">
                  The seller declared no dents, paint chips, or structural scratches on any of the
                  exterior panels. Covered by AutoNexa inaccurate description protection.
                </p>
              </div>
            )}
          </div>

          {/* Seller Verified Notes */}
          {vehicle.sellerNotes && (
            <div className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-portal-primary" />
                <h2 className="text-sm font-bold text-portal-text uppercase tracking-wider font-mono">
                  Seller Notes & Included Accessories
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-portal-text-muted leading-relaxed whitespace-pre-line p-4 rounded-xl bg-portal-surface-hover/60 border border-portal-border">
                {vehicle.sellerNotes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Sticky Telemetry, Bidding Slip & Spec Sheet */}
        <div className="lg:col-span-4 space-y-6">
          {/* Dealer Sealed-Bid Status Card */}
          <div className="rounded-2xl border border-portal-border bg-portal-surface p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-portal-border">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-portal-text">
                Your Dealership Bid
              </span>
              <span className="px-2 py-0.5 rounded bg-portal-primary/10 text-portal-primary font-mono text-xs font-bold">
                Pfaff Porsche
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-portal-text-muted font-mono uppercase">
                Active Placed Amount
              </span>
              <div className="text-2xl font-black font-mono text-portal-text">
                {vehicle.myCurrentBidCents
                  ? formatCadCents(vehicle.myCurrentBidCents)
                  : "No Bid Submitted"}
              </div>
            </div>

            {/* Invariant Sealed-Bid Telemetry */}
            <div className="p-3.5 rounded-xl bg-portal-surface-hover/80 border border-portal-border space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-portal-text-muted flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-portal-primary" />
                  <span>Total Sealed Bids</span>
                </span>
                <span className="font-bold text-portal-text">
                  {vehicle.totalBidsPlaced} Registered
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-portal-text-muted">Reserve Status</span>
                <span
                  className={`font-bold ${
                    vehicle.reserveStatus === "RESERVE_MET"
                      ? "text-emerald-500"
                      : "text-amber-500"
                  }`}
                >
                  {vehicle.reserveStatus.replace("_", " ")}
                </span>
              </div>
              <p className="text-[10px] text-portal-text-muted leading-tight pt-1 border-t border-portal-border/60">
                Sealed-Bid Secrecy Rule: Individual competitor dollar amounts remain encrypted until
                the 24h auction countdown elapses.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsBidSlipOpen(true)}
              className="w-full py-3 rounded-xl font-bold text-xs bg-portal-primary hover:bg-portal-primary-hover text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gavel className="w-4 h-4" />
              <span>{vehicle.myCurrentBidCents ? "Revise Bid Higher" : "Submit Sealed Bid"}</span>
            </button>
          </div>

          {/* Carfax Clean & Title Summary */}
          <div className="rounded-2xl border border-portal-border bg-portal-surface p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-portal-border">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-portal-text">
                Carfax Canadian Title Verification
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-portal-text-muted">Accident History:</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accident-Free
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-portal-text-muted">Previous Owners:</span>
                <span className="font-mono font-bold text-portal-text">
                  {vehicle.carfaxReport?.ownersCount ?? 1} Owner
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-portal-text-muted">Documented Service Records:</span>
                <span className="font-mono font-bold text-portal-text">
                  {vehicle.carfaxReport?.serviceRecordsCount ?? 6} Events
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-portal-text-muted">Canadian Lien Status:</span>
                <span className="font-bold text-emerald-500">Lien-Free Disclosed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-portal-text-muted">Provincial Registration:</span>
                <span className="font-mono font-bold text-portal-text">
                  {vehicle.carfaxReport?.registrationProvince ?? "Ontario"}
                </span>
              </div>
            </div>
          </div>

          {/* Decoded Specifications Matrix */}
          <div className="rounded-2xl border border-portal-border bg-portal-surface p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-portal-border">
              <Gauge className="w-4 h-4 text-portal-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-portal-text">
                Decoded Technical Specifications
              </h3>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-portal-border/50">
                <span className="text-portal-text-muted">Odometer</span>
                <span className="font-bold text-portal-text">
                  {vehicle.mileageKm.toLocaleString()} km
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-portal-border/50">
                <span className="text-portal-text-muted">Engine</span>
                <span className="font-bold text-portal-text truncate max-w-[180px]">
                  {vehicle.engineSpec ?? "2.9L Twin-Turbo"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-portal-border/50">
                <span className="text-portal-text-muted">Drivetrain</span>
                <span className="font-bold text-portal-text truncate max-w-[180px]">
                  {vehicle.drivetrain}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-portal-border/50">
                <span className="text-portal-text-muted">Transmission</span>
                <span className="font-bold text-portal-text truncate max-w-[180px]">
                  {vehicle.transmission}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-portal-border/50">
                <span className="text-portal-text-muted">Exterior Paint</span>
                <span className="font-bold text-portal-text truncate max-w-[180px]">
                  {vehicle.exteriorColor}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-portal-border/50">
                <span className="text-portal-text-muted">Interior Trim</span>
                <span className="font-bold text-portal-text truncate max-w-[180px]">
                  {vehicle.interiorColor}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-portal-border/50">
                <span className="text-portal-text-muted">Key Fobs</span>
                <span className="font-bold text-portal-text">{vehicle.keysCount} OEM Sets</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-portal-text-muted">Fuel Requirement</span>
                <span className="font-bold text-portal-text">
                  {vehicle.fuelType ?? "Premium 91+"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sealed Bid Placement Slip Modal */}
      {isBidSlipOpen && (
        <SealedBidSlip
          auction={vehicle}
          onClose={() => setIsBidSlipOpen(false)}
          onBidSuccess={handleBidSuccess}
        />
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="flex items-center justify-between text-white">
            <span className="font-mono text-xs opacity-75">
              {vehicle.year} {vehicle.make} {vehicle.model} • Photo {selectedPhotoIndex + 1} of{" "}
              {photos.length}
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
                src={photos[selectedPhotoIndex]}
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
                    setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
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
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex(idx);
                }}
                className={`relative w-16 h-12 rounded-md overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  selectedPhotoIndex === idx
                    ? "border-portal-primary scale-105"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <Image src={url} alt={`Thumb ${idx}`} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
