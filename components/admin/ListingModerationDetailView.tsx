"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Car,
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Camera,
  Copy,
  Check,
  Maximize2,
  Phone,
  Mail,
  ShieldCheck,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import {
  INITIAL_MODERATION_QUEUE,
  type ModerationItem,
} from "@/lib/mock/admin-moderation";

interface ListingModerationDetailViewProps {
  id: string;
}

const PRESET_CORRECTION_NOTES = [
  "Odometer photo is blurry or obscured. Please upload a clear photo of the cluster with ignition on.",
  "Vehicle registration / ownership document missing or name on ownership does not match seller.",
  "Declared exterior scuff / paint scratch requires a dedicated close-up photo.",
  "Active lien documentation requested: please provide lender payout statement.",
  "Reserve price exceeds 15% fair wholesale dealer market estimate for this mileage & grade.",
];

export function ListingModerationDetailView({ id }: ListingModerationDetailViewProps) {
  const router = useRouter();

  // Find vehicle in mock database
  const [item, setItem] = useState<ModerationItem | null>(() => {
    return INITIAL_MODERATION_QUEUE.find((m) => m.id === id) || INITIAL_MODERATION_QUEUE[0];
  });

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [modalAction, setModalAction] = useState<"REQUEST_EDITS" | "REJECT" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [copiedVin, setCopiedVin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lightbox keyboard controls
  useEffect(() => {
    if (!lightboxOpen || !item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev + 1) % item.vehicle.photos.length);
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev === 0 ? item.vehicle.photos.length - 1 : prev - 1
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, item]);

  // Scroll lock for modals
  useEffect(() => {
    if (lightboxOpen || modalAction) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, modalAction]);

  if (!item) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-lg font-bold text-portal-text">Listing Not Found</h2>
        <p className="text-xs text-portal-text-muted">
          The requested vehicle submission ID does not exist in the moderation queue.
        </p>
        <Link
          href="/admin/moderation"
          className="inline-flex items-center gap-2 text-xs font-semibold text-portal-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Moderation Queue</span>
        </Link>
      </div>
    );
  }

  const handleApprove = () => {
    setItem((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
    setFeedbackNotice(`✓ Listing ${item.id} approved! 24h dealer sealed-bid auction launched.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAction) return;

    const newStatus = modalAction === "REQUEST_EDITS" ? "EDITS_REQUESTED" : "REJECTED";
    setItem((prev) => (prev ? { ...prev, status: newStatus } : null));

    setFeedbackNotice(
      modalAction === "REQUEST_EDITS"
        ? `Notice dispatched to ${item.seller.name}: "${actionReason.slice(0, 50)}..."`
        : `Listing rejected: "${actionReason.slice(0, 50)}..."`
    );
    setModalAction(null);
    setActionReason("");
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const copyVinToClipboard = () => {
    navigator.clipboard.writeText(item.vehicle.vin);
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between gap-4 border-b border-portal-border pb-4">
        <Link
          href="/admin/moderation"
          className="inline-flex items-center gap-2 text-xs font-semibold text-portal-text-muted hover:text-portal-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Moderation Queue</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-portal-text-muted">ID: {item.id}</span>
          <span
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
              item.status === "APPROVED"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : item.status === "PENDING"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {item.status === "EDITS_REQUESTED" ? "Corrections Required" : item.status}
          </span>
        </div>
      </div>

      {/* Floating Notice */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-portal-text-muted hover:text-portal-text cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Vehicle Header Banner */}
      <div className="p-6 rounded-2xl border border-portal-border bg-portal-surface flex flex-col sm:flex-row sm:items-start justify-between gap-6 shadow-xs">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-portal-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Submitted {item.submittedAt}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{item.seller.city}, {item.seller.province}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-headline text-portal-text tracking-tight">
            {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
          </h1>

          <p className="text-xs sm:text-sm text-portal-text-muted">
            {item.vehicle.trim}
            {item.vehicle.engineSpec && ` • ${item.vehicle.engineSpec}`}
          </p>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <div className="text-[10px] uppercase font-semibold text-portal-text-muted">
            Seller Reserve Floor
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-portal-text">
            {formatCadCents(item.vehicle.reservePriceCents)}
          </div>
          <span className="text-[11px] text-portal-text-muted font-medium">
            Sealed from competing dealers
          </span>
        </div>
      </div>

      {/* High-Resolution Media Review Stage */}
      <div className="p-6 rounded-2xl border border-portal-border bg-portal-surface space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-portal-primary" />
            <h2 className="text-sm font-bold text-portal-text">
              High-Resolution Photographic Verification
            </h2>
            <span className="text-xs text-portal-text-muted font-mono">
              ({item.vehicle.photos.length} Verified Photos)
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setLightboxIndex(activePhotoIdx);
              setLightboxOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-portal-primary hover:underline cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open Fullscreen Inspector</span>
          </button>
        </div>

        {/* Hero Stage Photo */}
        <div
          onClick={() => {
            setLightboxIndex(activePhotoIdx);
            setLightboxOpen(true);
          }}
          className="relative aspect-16/9 rounded-xl overflow-hidden bg-portal-surface-hover border border-portal-border cursor-pointer group"
        >
          <Image
            src={item.vehicle.photos[activePhotoIdx]?.url || item.vehicle.thumbnailUrl}
            alt={item.vehicle.photos[activePhotoIdx]?.label || "Vehicle Inspection Photo"}
            fill
            priority
            className="object-cover group-hover:scale-[1.01] transition-transform duration-300"
            sizes="(max-width: 1024px) 100vw, 80vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
            <span className="font-medium bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
              {item.vehicle.photos[activePhotoIdx]?.label || `Photo ${activePhotoIdx + 1}`}
            </span>
            <span className="text-[11px] opacity-80 font-mono">
              Click photo to zoom & verify odometer/panel gaps
            </span>
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
          {item.vehicle.photos.map((photo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActivePhotoIdx(idx)}
              className={`relative aspect-16/10 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                activePhotoIdx === idx
                  ? "ring-2 ring-portal-primary border-portal-primary shadow-xs"
                  : "border-portal-border opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={photo.url}
                alt={photo.label}
                fill
                className="object-cover"
                sizes="160px"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Tabular Specification & Compliance Vitals */}
      <div className="p-6 rounded-2xl border border-portal-border bg-portal-surface space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-portal-primary" />
          <h2 className="text-sm font-bold text-portal-text">
            NHTSA Decoded Vitals & Compliance
          </h2>
        </div>

        <div className="border border-portal-border rounded-xl overflow-hidden divide-y divide-portal-border text-xs">
          {/* Row 1: VIN & Odometer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-portal-border">
            <div className="p-3.5 flex items-center justify-between gap-2 bg-portal-surface">
              <span className="text-portal-text-muted font-medium">17-Char VIN:</span>
              <div className="flex items-center gap-2 font-mono font-bold text-portal-text">
                <span>{item.vehicle.vin}</span>
                <button
                  type="button"
                  onClick={copyVinToClipboard}
                  className="p-1 rounded hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text transition-colors cursor-pointer"
                  title="Copy VIN"
                >
                  {copiedVin ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3.5 flex items-center justify-between gap-2 bg-portal-surface">
              <span className="text-portal-text-muted font-medium">Odometer:</span>
              <span className="font-mono font-bold text-portal-text">
                {item.vehicle.mileageKm.toLocaleString()} km
              </span>
            </div>
          </div>

          {/* Row 2: Drivetrain & Transmission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-portal-border">
            <div className="p-3.5 flex items-center justify-between gap-2 bg-portal-surface">
              <span className="text-portal-text-muted font-medium">Drivetrain:</span>
              <span className="font-semibold text-portal-text">
                {item.vehicle.drivetrain}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between gap-2 bg-portal-surface">
              <span className="text-portal-text-muted font-medium">Transmission:</span>
              <span className="font-semibold text-portal-text">
                {item.vehicle.transmission}
              </span>
            </div>
          </div>

          {/* Row 3: Condition Grade & Lien Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-portal-border">
            <div className="p-3.5 flex items-center justify-between gap-2 bg-portal-surface">
              <span className="text-portal-text-muted font-medium">Condition Grade:</span>
              <span className="font-semibold text-portal-text">
                Grade {item.vehicle.damageGrade}{" "}
                <span className="text-portal-text-muted font-normal">
                  ({item.vehicle.damageHotspotCount} Scuffs Disclosed)
                </span>
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between gap-2 bg-portal-surface">
              <span className="text-portal-text-muted font-medium">Lien Status:</span>
              <span
                className={`font-semibold ${
                  item.vehicle.lienDisclosed
                    ? "text-amber-500"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {item.vehicle.lienDisclosed
                  ? item.vehicle.lienHolder || "Active Lien Declared"
                  : "Lien Free (Clear Title)"}
              </span>
            </div>
          </div>

          {/* Row 4: Keys & Carfax Record */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-portal-border">
            <div className="p-3.5 flex items-center justify-between gap-2 bg-portal-surface">
              <span className="text-portal-text-muted font-medium">Key Fobs:</span>
              <span className="font-semibold text-portal-text">
                {item.vehicle.keysCount} OEM Sets
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between gap-2 bg-portal-surface">
              <span className="text-portal-text-muted font-medium">Carfax Summary:</span>
              <span className="font-semibold text-portal-text">
                {item.vehicle.carfaxSummary
                  ? `${item.vehicle.carfaxSummary.owners} Owner • ${item.vehicle.carfaxSummary.accidents} Accidents`
                  : "Verified Clean"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Seller KYC & Attestation */}
      <div className="p-6 rounded-2xl border border-portal-border bg-portal-surface space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-portal-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-portal-primary/10 text-portal-primary font-bold text-xs flex items-center justify-center shrink-0">
              {item.seller.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <div className="text-xs font-bold text-portal-text">
                {item.seller.name}
              </div>
              <div className="text-[11px] text-portal-text-muted">
                {item.seller.city}, {item.seller.province}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-portal-text-muted">
            <a
              href={`tel:${item.seller.phone}`}
              className="hover:text-portal-primary flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{item.seller.phone}</span>
            </a>
            <a
              href={`mailto:${item.seller.email}`}
              className="hover:text-portal-primary flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{item.seller.email}</span>
            </a>
          </div>
        </div>

        <div className="text-xs space-y-1">
          <div className="text-[10px] font-semibold text-portal-text-muted uppercase">
            Seller&apos;s Stated Condition & Notes
          </div>
          <p className="text-portal-text-muted italic bg-portal-surface-hover/70 p-3 rounded-xl border border-portal-border/60">
            &ldquo;{item.vehicle.sellerNotes}&rdquo;
          </p>
        </div>
      </div>

      {/* Decision Actions Bar */}
      <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActionReason("");
              setModalAction("REQUEST_EDITS");
            }}
            className="px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-semibold transition-colors cursor-pointer"
          >
            Request Corrections
          </button>

          <button
            type="button"
            onClick={() => {
              setActionReason("");
              setModalAction("REJECT");
            }}
            className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-colors cursor-pointer"
          >
            Reject Submission
          </button>
        </div>

        <button
          type="button"
          disabled={item.status === "APPROVED"}
          onClick={handleApprove}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
            item.status === "APPROVED"
              ? "bg-emerald-600/40 text-white cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {item.status === "APPROVED"
              ? "Approved & Auction Active"
              : "Approve & Launch 24h Auction"}
          </span>
        </button>
      </div>

      {/* Lightbox Modal (Portaled) */}
      {lightboxOpen && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="flex items-center justify-between text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                </h3>
                <span className="text-xs text-white/70 font-mono">
                  {item.vehicle.photos[lightboxIndex]?.label || "Inspection Evidence"} • (
                  {lightboxIndex + 1} of {item.vehicle.photos.length})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="relative flex-1 flex items-center justify-center my-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full max-w-5xl h-full max-h-[75vh]">
                <Image
                  src={item.vehicle.photos[lightboxIndex]?.url || item.vehicle.thumbnailUrl}
                  alt="High-Resolution Vehicle Inspection View"
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {item.vehicle.photos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev === 0 ? item.vehicle.photos.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-2 sm:left-6 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {item.vehicle.photos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      (prev + 1) % item.vehicle.photos.length
                    )
                  }
                  className="absolute right-2 sm:right-6 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            <div
              className="flex items-center justify-center gap-2 overflow-x-auto py-2"
              onClick={(e) => e.stopPropagation()}
            >
              {item.vehicle.photos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative w-14 h-10 rounded-lg overflow-hidden border transition-all cursor-pointer shrink-0 ${
                    lightboxIndex === idx
                      ? "ring-2 ring-white border-white scale-105"
                      : "border-white/20 opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.label}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}

      {/* Action Dialog Modal (Portaled) */}
      {modalAction && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setModalAction(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start justify-between pb-3 border-b border-portal-border">
                <div>
                  <h3 className="text-base font-bold font-headline text-portal-text">
                    {modalAction === "REQUEST_EDITS"
                      ? "Request Listing Corrections"
                      : "Reject Listing Submission"}
                  </h3>
                  <p className="text-xs text-portal-text-muted mt-0.5">
                    Vehicle: {item.vehicle.year} {item.vehicle.make} {item.vehicle.model} (VIN: ···{item.vehicle.vin.slice(-6)})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  className="p-1 rounded-lg text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Template Presets */}
              {modalAction === "REQUEST_EDITS" && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-portal-text-muted block">
                    One-Click Regulatory Correction Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_CORRECTION_NOTES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActionReason(preset)}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-portal-surface-hover hover:bg-portal-primary/10 hover:text-portal-primary border border-portal-border text-portal-text transition-colors text-left cursor-pointer"
                      >
                        {preset.slice(0, 36)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleConfirmAction} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-portal-text">
                    {modalAction === "REQUEST_EDITS"
                      ? "Required Corrections Description (Sent via SMS & Email to Seller)"
                      : "Regulatory Refusal Justification Code"}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder={
                      modalAction === "REQUEST_EDITS"
                        ? "State exactly what the seller needs to fix..."
                        : "State statutory refusal reason..."
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-portal-border">
                  <button
                    type="button"
                    onClick={() => setModalAction(null)}
                    className="px-4 py-2 rounded-xl border border-portal-border text-xs text-portal-text-muted hover:text-portal-text cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer ${
                      modalAction === "REQUEST_EDITS"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {modalAction === "REQUEST_EDITS"
                      ? "Dispatch Correction Notice"
                      : "Confirm Listing Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
