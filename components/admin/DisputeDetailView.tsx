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
  Scale,
  Building2,
  User,
  ShieldAlert,
  Wrench,
  DollarSign,
  Undo2,
  FileCheck2,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import {
  INITIAL_DISPUTES,
  type DisputeItem,
  type DisputeStatus,
} from "@/lib/mock/admin-disputes";

interface DisputeDetailViewProps {
  id: string;
}

export function DisputeDetailView({ id }: DisputeDetailViewProps) {
  const router = useRouter();

  // Find dispute item in mock database
  const [dispute, setDispute] = useState<DisputeItem | null>(() => {
    return INITIAL_DISPUTES.find((d) => d.id === id) || INITIAL_DISPUTES[0];
  });

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [decisionModalAction, setDecisionModalAction] = useState<
    "APPROVE_ADJUSTMENT" | "REJECT_CLAIM" | "MUTUAL_CANCEL" | null
  >(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lightbox keyboard controls
  useEffect(() => {
    if (!lightboxOpen || !dispute) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev + 1) % dispute.vehicle.photos.length);
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev === 0 ? dispute.vehicle.photos.length - 1 : prev - 1
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, dispute]);

  // Scroll lock for modals
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

  if (!dispute) {
    return (
      <div className="py-20 text-center space-y-4">
        <Scale className="w-12 h-12 mx-auto text-portal-text-muted opacity-30" />
        <h2 className="font-headline font-bold text-xl text-portal-text">Dispute Docket Not Found</h2>
        <p className="text-xs text-portal-text-muted">The requested arbitration case does not exist.</p>
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

  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleExecuteDecision = () => {
    if (!decisionModalAction) return;

    let updatedStatus: DisputeStatus = "RESOLVED";
    let noticeMessage = "";

    if (decisionModalAction === "APPROVE_ADJUSTMENT") {
      updatedStatus = "RESOLVED";
      noticeMessage = `Arbitration Ruling Executed: Disputed adjustment of -${formatCadCents(
        dispute.disputedAdjustmentCents
      )} approved. Net escrow release authorized.`;
    } else if (decisionModalAction === "REJECT_CLAIM") {
      updatedStatus = "RESOLVED";
      noticeMessage = `Arbitration Ruling Executed: Claim dismissed as unsubstantiated normal wear. Original winning bid of ${formatCadCents(
        dispute.agreedBidCents
      )} enforced in full.`;
    } else if (decisionModalAction === "MUTUAL_CANCEL") {
      updatedStatus = "CLOSED";
      noticeMessage = `Arbitration Ruling Executed: Order for mutual cancellation and vehicle return issued. Escrow funds refunded.`;
    }

    setDispute((prev) =>
      prev
        ? {
            ...prev,
            status: updatedStatus,
            complianceDecisionNotes: decisionNotes.trim() || undefined,
            timeline: [
              ...prev.timeline,
              {
                timestamp: "Just now",
                actor: "AutoNexa Compliance Arbitration",
                action: decisionModalAction,
                note: decisionNotes.trim() || "Executed official binding resolution directive.",
              },
            ],
          }
        : null
    );

    setFeedbackNotice(noticeMessage);
    setDecisionModalAction(null);
    setDecisionNotes("");
    setTimeout(() => setFeedbackNotice(null), 6000);
  };

  const currentPhoto = dispute.vehicle.photos[activePhotoIdx] || dispute.vehicle.photos[0];

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
            <span className="font-bold text-portal-text">{dispute.docketNumber}</span>
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
                : dispute.status === "ACTION_REQUIRED"
                ? "bg-red-500/10 text-red-500 border border-red-500/25"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
            }`}
          >
            {dispute.status === "ACTION_REQUIRED" ? "Escalated Action" : dispute.status}
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

      {/* 2. Top Executive Docket Banner: Vehicle Title & Financial Telemetry */}
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
            {dispute.vehicle.trim} • VIN:{" "}
            <span className="font-mono font-semibold text-portal-text">{dispute.vehicle.vin}</span> •{" "}
            {dispute.vehicle.mileageKm.toLocaleString()} km
          </p>
        </div>

        {/* Financial Escrow Telemetry Card */}
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

      {/* 3. Dual-Party Identity Cards (Seller vs Dealership) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seller Dossier */}
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
            <p className="font-bold text-sm text-portal-text">{dispute.seller.name}</p>
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

        {/* Dealership Dossier */}
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
            <p className="font-bold text-sm text-portal-text">{dispute.dealership.name}</p>
            <p className="text-portal-text-muted">{dispute.dealership.legalEntity}</p>
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
              Compare certified hoist technician inspection findings against seller listing declarations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLightboxIndex(activePhotoIdx);
              setLightboxOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-bold hover:bg-portal-primary hover:text-white transition-all cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen Lightbox ({dispute.vehicle.photos.length})</span>
          </button>
        </div>

        {/* Main Photo Canvas */}
        <div className="relative w-full h-72 sm:h-96 md:h-[480px] rounded-2xl overflow-hidden bg-black/40 border border-portal-border group/canvas">
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.label}
            fill
            className="object-contain"
            priority
          />

          {/* Tag Overlay */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-md shadow-md ${
                currentPhoto.isHoistEvidence
                  ? "bg-red-600/90 text-white border border-red-400/40"
                  : "bg-black/80 text-white border border-white/20"
              }`}
            >
              {currentPhoto.isHoistEvidence ? "⚠️ Technician Hoist Evidence" : "Seller Listing Photo"}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold truncate">{currentPhoto.label}</span>
            <span className="text-xs font-mono opacity-70 shrink-0 ml-3">
              Photo {activePhotoIdx + 1} of {dispute.vehicle.photos.length}
            </span>
          </div>
        </div>

        {/* Photo Thumbnail Strip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
          {dispute.vehicle.photos.map((photo, idx) => {
            const active = idx === activePhotoIdx;
            return (
              <button
                key={photo.url}
                type="button"
                onClick={() => setActivePhotoIdx(idx)}
                className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  active
                    ? "border-portal-primary scale-105 shadow-md"
                    : "border-portal-border opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={photo.url} alt={photo.label} fill className="object-cover" />
                {photo.isHoistEvidence && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-black" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Inspection Hoist Findings & Allegation Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Summary & Technician Findings (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Dispute Allegation Report */}
          <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-portal-text font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Dealership Incident Allegation &amp; Claim</span>
            </div>
            <p className="text-xs sm:text-sm text-portal-text leading-relaxed font-body">
              {dispute.allegationSummary}
            </p>
          </div>

          {/* Technician Notes */}
          <div className="p-5 rounded-2xl border border-portal-border bg-portal-surface space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-portal-text font-mono">
              <Wrench className="w-4 h-4 text-portal-primary" />
              <span>Certified Hoist Technician Diagnostic Notes</span>
            </div>
            <p className="text-xs text-portal-text-muted leading-relaxed font-mono p-3 rounded-xl bg-portal-surface-hover/70 border border-portal-border">
              {dispute.hoistEvidenceNotes}
            </p>
          </div>

          {/* Compliance Decision Notes (if already decided) */}
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

        {/* Right: Case Timeline (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-portal-border bg-portal-surface space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-portal-text font-mono">
            <Clock className="w-4 h-4 text-portal-primary" />
            <span>Incident Audit Timeline</span>
          </div>

          <div className="space-y-4 text-xs font-body relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-portal-border">
            {dispute.timeline.map((event, idx) => (
              <div key={idx} className="relative pl-6 space-y-0.5">
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-portal-surface-hover border border-portal-primary flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-portal-primary" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-portal-text-muted font-mono">
                  <span>{event.actor}</span>
                  <span>{event.timestamp}</span>
                </div>
                <p className="font-semibold text-portal-text text-[11px]">{event.action}</p>
                <p className="text-[11px] text-portal-text-muted leading-relaxed">{event.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Binding Compliance Officer Arbitration Decision Terminal */}
      <div className="p-6 rounded-2xl border border-portal-border bg-portal-surface space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-4 h-4 text-portal-primary" />
            <span className="text-xs font-mono font-bold text-portal-primary uppercase">
              Statutory Escrow Settlement Console
            </span>
          </div>
          <h2 className="font-headline font-bold text-lg text-portal-text">
            Execute Binding Arbitration Ruling
          </h2>
          <p className="text-xs text-portal-text-muted mt-0.5">
            Select the binding mediation directive. Executing will disburse or refund escrow funds and notify both parties via verified CASL notice.
          </p>
        </div>

        {/* Quick Action Decision Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Action 1: Approve Adjustment */}
          <button
            type="button"
            onClick={() => setDecisionModalAction("APPROVE_ADJUSTMENT")}
            className="p-4 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-left space-y-1.5 cursor-pointer transition-all hover:border-emerald-500/60 group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10.5px]">
                Recommended
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="font-bold text-xs text-portal-text group-hover:text-emerald-500 transition-colors">
              Approve -{formatCadCents(dispute.disputedAdjustmentCents)} Deduction
            </p>
            <p className="text-[11px] text-portal-text-muted leading-relaxed">
              Disburse net ${formatCadCents(dispute.netSettlementCents)} to seller and credit balance to dealer.
            </p>
          </button>

          {/* Action 2: Reject Claim (Enforce Original Bid) */}
          <button
            type="button"
            onClick={() => setDecisionModalAction("REJECT_CLAIM")}
            className="p-4 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-left space-y-1.5 cursor-pointer transition-all hover:border-portal-primary/60 group"
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
              Ruling finds claim represents normal wear. Release original ${formatCadCents(dispute.agreedBidCents)} to seller.
            </p>
          </button>

          {/* Action 3: Order Mutual Cancellation */}
          <button
            type="button"
            onClick={() => setDecisionModalAction("MUTUAL_CANCEL")}
            className="p-4 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-left space-y-1.5 cursor-pointer transition-all hover:border-red-500/60 group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold text-[10.5px]">
                Void Contract
              </span>
              <Undo2 className="w-4 h-4 text-red-500" />
            </div>
            <p className="font-bold text-xs text-portal-text group-hover:text-red-500 transition-colors">
              Order Mutual Return &amp; Refund
            </p>
            <p className="text-[11px] text-portal-text-muted leading-relaxed">
              Void contract due to material defect. Return vehicle to seller and refund dealership deposit.
            </p>
          </button>
        </div>
      </div>

      {/* 7. Portaled Fullscreen Lightbox (z-[9999]) */}
      {mounted &&
        lightboxOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col justify-between p-4 sm:p-6 animate-fadeIn select-none"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Lightbox Header */}
            <div
              className="flex items-center justify-between text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">
                  {dispute.vehicle.photos[lightboxIndex]?.label}
                </span>
                {dispute.vehicle.photos[lightboxIndex]?.isHoistEvidence && (
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

            {/* Lightbox Center Stage */}
            <div
              className="relative flex-1 w-full max-h-[80vh] flex items-center justify-center my-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={dispute.vehicle.photos[lightboxIndex]?.url || ""}
                alt="Evidence"
                fill
                className="object-contain"
              />

              {/* Navigation Arrows */}
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev === 0 ? dispute.vehicle.photos.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 sm:left-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) => (prev + 1) % dispute.vehicle.photos.length)
                }
                className="absolute right-2 sm:right-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Lightbox Footer Counter */}
            <div
              className="text-center text-xs text-white/70 font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              Photo {lightboxIndex + 1} of {dispute.vehicle.photos.length}
            </div>
          </div>,
          document.body
        )}

      {/* 8. Portaled Arbitration Decision Confirmation Modal (z-[9999]) */}
      {mounted &&
        decisionModalAction &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
            onClick={() => setDecisionModalAction(null)}
          >
            <div
              className="relative w-full max-w-lg bg-portal-surface border border-portal-border rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
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
                      Case Docket: <span className="font-mono text-portal-text">{dispute.docketNumber}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDecisionModalAction(null)}
                  className="p-1 rounded text-portal-text-muted hover:text-portal-text cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary of Action */}
              <div className="p-3.5 rounded-xl bg-portal-surface-hover/80 border border-portal-border text-xs space-y-1 font-body">
                <p className="font-bold text-portal-text">
                  {decisionModalAction === "APPROVE_ADJUSTMENT"
                    ? `Deduction Approval: -${formatCadCents(dispute.disputedAdjustmentCents)}`
                    : decisionModalAction === "REJECT_CLAIM"
                    ? `Claim Dismissal: Full ${formatCadCents(dispute.agreedBidCents)} Enforced`
                    : "Mutual Contract Void & Return Order"}
                </p>
                <p className="text-[11px] text-portal-text-muted leading-relaxed">
                  {decisionModalAction === "APPROVE_ADJUSTMENT"
                    ? `Seller ${dispute.seller.name} will receive net EFT payout of ${formatCadCents(
                        dispute.netSettlementCents
                      )}. Dealership ${dispute.dealership.name} will receive a credit of ${formatCadCents(
                        dispute.disputedAdjustmentCents
                      )}.`
                    : decisionModalAction === "REJECT_CLAIM"
                    ? `Dealership claim is denied. Seller ${dispute.seller.name} will receive full original agreed bid of ${formatCadCents(
                        dispute.agreedBidCents
                      )}.`
                    : `Contract cancelled. Escrow balance will be refunded to ${dispute.dealership.name} and vehicle returned to ${dispute.seller.name}.`}
                </p>
              </div>

              {/* Rationale Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-portal-text block">
                  Binding Mediation Directive &amp; Audit Rationale (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Record the official compliance findings and regulatory justification for this arbitration ruling..."
                  className="w-full p-3 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs focus:ring-2 focus:ring-portal-primary/40 focus:outline-none placeholder:text-portal-text-muted font-body"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-portal-border">
                <button
                  type="button"
                  onClick={() => setDecisionModalAction(null)}
                  className="px-4 py-2.5 rounded-xl border border-portal-border text-xs font-bold text-portal-text hover:bg-portal-surface-hover cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDecision}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer transition-all ${
                    decisionModalAction === "APPROVE_ADJUSTMENT"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : decisionModalAction === "REJECT_CLAIM"
                      ? "bg-portal-primary hover:bg-portal-primary-hover"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Execute Binding Ruling &amp; Release Escrow
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
