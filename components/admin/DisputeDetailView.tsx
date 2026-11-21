"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  FileCheck2,
  Loader2,
  Mail,
  Maximize2,
  Phone,
  Scale,
  Undo2,
  User,
  Wrench,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api-client";
import {
  useAdminDisputeDetail,
  useResolveDispute,
} from "@/hooks/useAdminDisputes";
import type { DisputeResolutionDecision } from "@/lib/types/admin";
import { formatCadCents } from "@/lib/utils";

const subscribeNoop = () => () => {};
const getTrueClient = () => true;
const getFalseServer = () => false;

interface DisputeDetailViewProps {
  id: string;
}

export function DisputeDetailView({ id }: DisputeDetailViewProps) {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getTrueClient,
    getFalseServer
  );

  const { data: dispute, isLoading, isError, error } =
    useAdminDisputeDetail(id);
  const resolveMutation = useResolveDispute(id);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [decisionModalAction, setDecisionModalAction] =
    useState<DisputeResolutionDecision | null>(null);
  const [adjustmentDollars, setAdjustmentDollars] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const photoCount = dispute?.vehicle.photos.length ?? 0;

  useEffect(() => {
    if (!lightboxOpen || photoCount === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev + 1) % photoCount);
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev === 0 ? photoCount - 1 : prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, photoCount]);

  useEffect(() => {
    if (lightboxOpen || decisionModalAction) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, decisionModalAction]);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3 text-portal-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-portal-primary mx-auto" />
        <p className="text-xs">Loading dispute arbitration dossier...</p>
      </div>
    );
  }

  if (isError || !dispute) {
    return (
      <div className="py-20 text-center space-y-4">
        <Scale className="w-12 h-12 mx-auto text-portal-text-muted opacity-30" />
        <h2 className="font-headline font-bold text-xl text-portal-text">
          {error instanceof ApiError
            ? error.failure.error
            : "Dispute Docket Not Found"}
        </h2>
        <p className="text-xs text-portal-text-muted">
          The requested arbitration case does not exist or could not be loaded.
        </p>
        <Link
          href="/admin/disputes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-portal-primary text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dispute Queue</span>
        </Link>
      </div>
    );
  }

  const photos = dispute.vehicle.photos;
  const safePhotoIdx =
    activePhotoIdx >= 0 && activePhotoIdx < photos.length ? activePhotoIdx : 0;
  const currentPhoto = photos[safePhotoIdx] ?? photos[0];
  const isFinalized =
    dispute.status === "RESOLVED" || dispute.status === "CLOSED";

  const handleCopy = (text: string, identifier: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const openDecisionModal = (action: DisputeResolutionDecision) => {
    setDecisionModalAction(action);
    setAdjustmentDollars(
      String(Math.round(dispute.disputedAdjustmentCents / 100))
    );
    setDecisionNotes("");
    setModalError(null);
  };

  const handleExecuteDecision = async () => {
    if (!decisionModalAction) return;
    setModalError(null);

    const trimmedNotes = decisionNotes.trim();
    if (trimmedNotes.length < 5) {
      setModalError(
        "Please record binding mediation findings (at least 5 characters)."
      );
      return;
    }

    let adjustmentCents: number | undefined;
    if (decisionModalAction === "APPROVE_ADJUSTMENT") {
      const parsedDollars = Number(adjustmentDollars);
      if (!Number.isFinite(parsedDollars) || parsedDollars < 0) {
        setModalError("Enter a valid non-negative CAD deduction amount.");
        return;
      }
      adjustmentCents = Math.round(parsedDollars * 100);
      if (adjustmentCents > dispute.agreedBidCents) {
        setModalError(
          "Approved deduction cannot exceed the agreed winning bid."
        );
        return;
      }
    }

    try {
      const result = await resolveMutation.mutateAsync({
        decision: decisionModalAction,
        ...(adjustmentCents !== undefined ? { adjustmentCents } : {}),
        notes: trimmedNotes,
      });

      setFeedbackNotice(result.message);
      setDecisionModalAction(null);
      setDecisionNotes("");
      setTimeout(() => setFeedbackNotice(null), 6000);
    } catch (err) {
      setModalError(
        err instanceof ApiError
          ? err.failure.error
          : "Unable to execute arbitration ruling."
      );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Breadcrumb Back Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-portal-border">
        <Link
          href="/admin/disputes"
          className="inline-flex items-center gap-2 text-xs font-bold text-portal-text-muted hover:text-portal-text transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Dispute Queue</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-portal-text-muted">Docket:</span>
            <span className="font-bold text-portal-text">
              {dispute.docketNumber}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(dispute.docketNumber, "docket")}
              className="hover:text-portal-text p-0.5 rounded cursor-pointer"
              title="Copy Docket ID"
            >
              {copiedText === "docket" ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-portal-text-muted" />
              )}
            </button>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
              dispute.status === "RESOLVED"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                : dispute.status === "ACTION_REQUIRED" ||
                    dispute.status === "CLOSED"
                  ? "bg-red-500/10 text-red-500 border border-red-500/25"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
            }`}
          >
            {dispute.status === "ACTION_REQUIRED"
              ? "Escalated Action"
              : dispute.status}
          </span>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedbackNotice && (
        <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Top Executive Docket Banner */}
      <div className="p-6 rounded-2xl border border-portal-border bg-portal-surface shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-portal-text-muted">
            <span className="px-2 py-0.5 rounded bg-portal-primary/10 text-portal-primary font-mono text-[10.5px] font-bold">
              {dispute.categoryLabel}
            </span>
            <span>•</span>
            <span>Opened {dispute.openedDateFormatted}</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-black text-portal-text tracking-tight">
            {dispute.vehicle.year} {dispute.vehicle.make} {dispute.vehicle.model}
          </h1>
          <p className="font-body text-xs sm:text-sm text-portal-text-muted">
            {dispute.vehicle.trim || "Standard Trim"} • VIN:{" "}
            <span className="font-mono font-semibold text-portal-text">
              {dispute.vehicle.vin}
            </span>{" "}
            • {dispute.vehicle.mileageKm.toLocaleString()} km
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 p-4 rounded-xl bg-portal-surface-hover/80 border border-portal-border">
          <div>
            <span className="text-[10px] uppercase font-bold text-portal-text-muted block font-mono">
              Agreed Winning Bid
            </span>
            <span className="font-headline text-lg sm:text-xl font-bold text-portal-text">
              {formatCadCents(dispute.agreedBidCents)}
            </span>
          </div>

          <div className="h-8 w-[1px] bg-portal-border" />

          <div>
            <span className="text-[10px] uppercase font-bold text-portal-text-muted block font-mono">
              Claimed Adjustment
            </span>
            <span className="font-headline text-lg sm:text-xl font-black text-amber-500">
              -{formatCadCents(dispute.disputedAdjustmentCents)}
            </span>
          </div>

          <div className="h-8 w-[1px] bg-portal-border" />

          <div>
            <span className="text-[10px] uppercase font-bold text-portal-text-muted block font-mono">
              Net Seller Payout
            </span>
            <span className="font-headline text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCadCents(dispute.netSettlementCents)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Dual-Party Identity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-portal-border">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-portal-text-muted" />
              <span className="font-bold text-xs uppercase tracking-wider text-portal-text font-mono">
                Seller Party (Consumer)
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-portal-primary">
              Declared: {dispute.seller.declaredConditionGrade}
            </span>
          </div>

          <div className="space-y-1 text-xs font-body">
            <p className="font-bold text-sm text-portal-text">
              {dispute.seller.name}
            </p>
            <p className="text-portal-text-muted">
              {dispute.seller.city}, {dispute.seller.province}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-portal-text-muted">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{dispute.seller.email}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{dispute.seller.phone}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-portal-border">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-portal-primary" />
              <span className="font-bold text-xs uppercase tracking-wider text-portal-text font-mono">
                Purchasing Dealership (Commercial)
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {dispute.dealership.regulator}-{dispute.dealership.licenseNumber}
            </span>
          </div>

          <div className="space-y-1 text-xs font-body">
            <p className="font-bold text-sm text-portal-text">
              {dispute.dealership.name}
            </p>
            <p className="text-portal-text-muted">
              {dispute.dealership.legalEntity}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-portal-text-muted font-body">
              <span className="inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>Buyer Officer: {dispute.dealership.contactOfficer}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-portal-text">
                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                <span>Inspector: {dispute.dealership.technician}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Evidence Stage & Photo Comparison Viewer */}
      <div className="p-6 rounded-2xl border border-portal-border bg-portal-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-headline font-bold text-base sm:text-lg text-portal-text">
              Inspection Photo Evidence Stage
            </h2>
            <p className="text-xs text-portal-text-muted mt-0.5">
              Compare signed hoist technician inspection findings against seller listing disclosures.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLightboxIndex(safePhotoIdx);
              setLightboxOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-bold hover:bg-portal-primary hover:text-white transition-all cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen Lightbox ({photos.length})</span>
          </button>
        </div>

        <div className="relative w-full h-72 sm:h-96 md:h-[480px] rounded-2xl overflow-hidden bg-black/40 border border-portal-border group/canvas">
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.label}
            fill
            unoptimized
            className="object-contain"
            priority
          />

          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-md shadow-md ${
                currentPhoto.isHoistEvidence
                  ? "bg-red-600/90 text-white border border-red-400/40"
                  : "bg-black/80 text-white border border-white/20"
              }`}
            >
              {currentPhoto.isHoistEvidence
                ? "Technician Hoist Evidence"
                : "Seller Listing Photo"}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold truncate">
              {currentPhoto.label}
            </span>
            <span className="text-xs font-mono opacity-70 shrink-0 ml-3">
              Photo {safePhotoIdx + 1} of {photos.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
          {photos.map((photo, idx) => {
            const active = idx === safePhotoIdx;
            return (
              <button
                key={`${photo.url}-${idx}`}
                type="button"
                onClick={() => setActivePhotoIdx(idx)}
                className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  active
                    ? "border-portal-primary scale-105 shadow-md"
                    : "border-portal-border opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={photo.url}
                  alt={photo.label}
                  fill
                  unoptimized
                  className="object-cover"
                />
                {photo.isHoistEvidence && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-black" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Inspection Hoist Findings & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-portal-text font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Dealership Incident Allegation &amp; Claim</span>
            </div>
            <p className="text-xs sm:text-sm text-portal-text leading-relaxed font-body">
              {dispute.allegationSummary}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-portal-text font-mono">
              <Wrench className="w-4 h-4 text-portal-primary" />
              <span>Certified Hoist Technician Diagnostic Notes</span>
            </div>
            <p className="text-xs text-portal-text-muted leading-relaxed font-mono p-3 rounded-xl bg-portal-surface-hover/70 border border-portal-border">
              {dispute.hoistEvidenceNotes}
            </p>
          </div>

          {dispute.complianceDecisionNotes && (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Recorded Arbitration Ruling Notes</span>
              </div>
              <p className="text-xs text-portal-text leading-relaxed font-body">
                {dispute.complianceDecisionNotes}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 p-5 rounded-2xl border border-portal-border bg-portal-surface space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-portal-text font-mono">
            <Clock className="w-4 h-4 text-portal-primary" />
            <span>Incident Audit Timeline</span>
          </div>

          <div className="space-y-4 text-xs font-body relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-portal-border">
            {dispute.timeline.map((event, idx) => (
              <div
                key={`${event.timestampIso}-${idx}`}
                className="relative pl-6 space-y-0.5"
              >
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-portal-surface-hover border border-portal-primary flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-portal-primary" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-portal-text-muted font-mono gap-2">
                  <span className="truncate">{event.actor}</span>
                  <span className="shrink-0">{event.timestamp}</span>
                </div>
                <p className="font-semibold text-portal-text text-[11px]">
                  {event.action}
                </p>
                <p className="text-[11px] text-portal-text-muted leading-relaxed">
                  {event.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Binding Compliance Arbitration Decision Console */}
      <div className="p-6 rounded-2xl border border-portal-border bg-portal-surface space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-4 h-4 text-portal-primary" />
            <span className="text-xs font-mono font-bold text-portal-primary uppercase">
              Statutory Escrow Settlement Console
            </span>
          </div>
          <h2 className="font-headline font-bold text-lg text-portal-text">
            {isFinalized
              ? `Arbitration Ruling Finalized (${dispute.resolutionDecision ?? dispute.status})`
              : "Execute Binding Arbitration Ruling"}
          </h2>
          <p className="text-xs text-portal-text-muted mt-0.5">
            {isFinalized
              ? "This docket is closed and locked. Settlement math, audit logs, and participant notices have been recorded."
              : "Select the binding mediation directive. Executing updates match settlement amounts in integer cents and notifies both parties."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            disabled={isFinalized || resolveMutation.isPending}
            onClick={() => openDecisionModal("APPROVE_ADJUSTMENT")}
            className="p-4 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-left space-y-1.5 cursor-pointer transition-all hover:border-emerald-500/60 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10.5px]">
                Recommended
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="font-bold text-xs text-portal-text group-hover:text-emerald-500 transition-colors">
              Approve -{formatCadCents(dispute.disputedAdjustmentCents)}{" "}
              Deduction
            </p>
            <p className="text-[11px] text-portal-text-muted leading-relaxed">
              Authorize net {formatCadCents(dispute.netSettlementCents)} settlement
              to seller (adjustable in dialog).
            </p>
          </button>

          <button
            type="button"
            disabled={isFinalized || resolveMutation.isPending}
            onClick={() => openDecisionModal("REJECT_CLAIM")}
            className="p-4 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-left space-y-1.5 cursor-pointer transition-all hover:border-portal-primary/60 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-portal-primary/10 text-portal-primary font-bold text-[10.5px]">
                Enforce Bid
              </span>
              <FileCheck2 className="w-4 h-4 text-portal-primary" />
            </div>
            <p className="font-bold text-xs text-portal-text group-hover:text-portal-primary transition-colors">
              Dismiss Claim (Release Full Bid)
            </p>
            <p className="text-[11px] text-portal-text-muted leading-relaxed">
              Ruling finds claim represents normal wear. Release original{" "}
              {formatCadCents(dispute.agreedBidCents)} to seller.
            </p>
          </button>

          <button
            type="button"
            disabled={isFinalized || resolveMutation.isPending}
            onClick={() => openDecisionModal("MUTUAL_CANCEL")}
            className="p-4 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-left space-y-1.5 cursor-pointer transition-all hover:border-red-500/60 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold text-[10.5px]">
                Void Contract
              </span>
              <Undo2 className="w-4 h-4 text-red-500" />
            </div>
            <p className="font-bold text-xs text-portal-text group-hover:text-red-500 transition-colors">
              Order Mutual Return &amp; Cancellation
            </p>
            <p className="text-[11px] text-portal-text-muted leading-relaxed">
              Void contract due to material discrepancy. Release vehicle back to
              unsealed status.
            </p>
          </button>
        </div>
      </div>

      {/* 7. Portaled Fullscreen Lightbox */}
      {mounted &&
        lightboxOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col justify-between p-4 sm:p-6 animate-fadeIn select-none"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="flex items-center justify-between text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">
                  {photos[lightboxIndex]?.label}
                </span>
                {photos[lightboxIndex]?.isHoistEvidence && (
                  <span className="px-2 py-0.5 rounded bg-red-600 text-[10.5px] font-bold">
                    Hoist Evidence
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div
              className="relative flex-1 w-full max-h-[80vh] flex items-center justify-center my-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={photos[lightboxIndex]?.url || currentPhoto.url}
                alt="Evidence"
                fill
                unoptimized
                className="object-contain"
              />

              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev === 0 ? photos.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 sm:left-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) => (prev + 1) % photos.length)
                }
                className="absolute right-2 sm:right-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div
              className="text-center text-xs text-white/70 font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              Photo {lightboxIndex + 1} of {photos.length}
            </div>
          </div>,
          document.body
        )}

      {/* 8. Portaled Arbitration Decision Confirmation Modal */}
      {mounted &&
        decisionModalAction &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
            onClick={() => {
              if (!resolveMutation.isPending) setDecisionModalAction(null);
            }}
          >
            <div
              className="relative w-full max-w-lg bg-portal-surface border border-portal-border rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3 border-b border-portal-border">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      decisionModalAction === "APPROVE_ADJUSTMENT"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : decisionModalAction === "REJECT_CLAIM"
                          ? "bg-portal-primary/10 border border-portal-primary/20 text-portal-primary"
                          : "bg-red-500/10 border border-red-500/20 text-red-500"
                    }`}
                  >
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-headline text-lg font-bold text-portal-text">
                      Confirm Binding Arbitration Order
                    </h3>
                    <p className="text-xs text-portal-text-muted mt-0.5">
                      Case Docket:{" "}
                      <span className="font-mono text-portal-text">
                        {dispute.docketNumber}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={resolveMutation.isPending}
                  onClick={() => setDecisionModalAction(null)}
                  className="p-1 rounded text-portal-text-muted hover:text-portal-text cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-portal-surface-hover/80 border border-portal-border text-xs space-y-1 font-body">
                <p className="font-bold text-portal-text">
                  {decisionModalAction === "APPROVE_ADJUSTMENT"
                    ? `Deduction Approval (Agreed Bid: ${formatCadCents(dispute.agreedBidCents)})`
                    : decisionModalAction === "REJECT_CLAIM"
                      ? `Claim Dismissal: Full ${formatCadCents(dispute.agreedBidCents)} Enforced`
                      : "Mutual Contract Void & Return Order"}
                </p>
                <p className="text-[11px] text-portal-text-muted leading-relaxed">
                  {decisionModalAction === "APPROVE_ADJUSTMENT"
                    ? `Adjust final match settlement below. Net settlement to ${dispute.seller.name} updates in integer CAD cents.`
                    : decisionModalAction === "REJECT_CLAIM"
                      ? `Dealership claim is dismissed. Seller ${dispute.seller.name} retains full original agreed bid of ${formatCadCents(dispute.agreedBidCents)}.`
                      : `Contract voided. ${dispute.dealership.name} claim is closed and the listing returns to UNSEALED status.`}
                </p>
              </div>

              {decisionModalAction === "APPROVE_ADJUSTMENT" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-portal-text block">
                    Approved Deduction ($ CAD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={adjustmentDollars}
                    onChange={(e) => {
                      setAdjustmentDollars(e.target.value);
                      setModalError(null);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-portal-border bg-portal-surface text-portal-text font-mono text-xs focus:ring-2 focus:ring-portal-primary/40 focus:outline-none"
                  />
                </div>
              )}

              {modalError && (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-500 font-semibold">
                  {modalError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-portal-text block">
                  Binding Mediation Directive &amp; Audit Rationale (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionNotes}
                  onChange={(e) => {
                    setDecisionNotes(e.target.value);
                    setModalError(null);
                  }}
                  placeholder="Record the official compliance findings and justification (minimum 5 characters)..."
                  className="w-full p-3 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs focus:ring-2 focus:ring-portal-primary/40 focus:outline-none placeholder:text-portal-text-muted font-body"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-portal-border">
                <button
                  type="button"
                  disabled={resolveMutation.isPending}
                  onClick={() => setDecisionModalAction(null)}
                  className="px-4 py-2.5 rounded-xl border border-portal-border text-xs font-bold text-portal-text hover:bg-portal-surface-hover cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resolveMutation.isPending}
                  onClick={() => void handleExecuteDecision()}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-2 disabled:opacity-50 ${
                    decisionModalAction === "APPROVE_ADJUSTMENT"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : decisionModalAction === "REJECT_CLAIM"
                        ? "bg-portal-primary hover:bg-portal-primary-hover"
                        : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {resolveMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <span>Execute Binding Ruling &amp; Release Escrow</span>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
