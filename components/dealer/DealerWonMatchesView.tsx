"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  QrCode,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ExternalLink,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  X,
  Printer,
  Sparkles,
  XCircle,
  Check,
  RotateCcw,
  Receipt,
  Car,
  Info,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";

// Automaker Brand Logo Mapping
const CAR_BRAND_LOGOS: Record<string, string> = {
  toyota: "/car-company-logos/image_16 - Copy.png",
  jeep: "/car-company-logos/image_15.png",
  ford: "/car-company-logos/image_14.svg",
  honda: "/car-company-logos/image_12.png",
  polestar: "/car-company-logos/image_11.png",
  mitsubishi: "/car-company-logos/image_10.png",
  hyundai: "/car-company-logos/image_09.png",
  cadillac: "/car-company-logos/image_13.png",
};

export type WonMatchStatus =
  | "APPOINTMENT_CONFIRMED"
  | "COMPLETED"
  | "RENEGOTIATED_LOWER"
  | "NO_SHOW"
  | "DECLINED_AFTER_INSPECTION";

export type WonMatchItem = {
  id: string;
  voucherCode: string;
  vehicle: {
    vin: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    mileageKm: number;
    thumbnailUrl: string;
    damageGrade: string;
    auctionId?: string;
  };
  seller: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  };
  acceptedBidAmountCents: number; // Integer CAD cents invariant
  wonAt: string;
  appointmentWindowExpiresAt: string;
  status: WonMatchStatus;
  finalTransactionCents?: number;
  inspectionNotes?: string;
  appointmentLocation?: string;
};

const INITIAL_WON_MATCHES: WonMatchItem[] = [
  {
    id: "match-porsche-macan",
    voucherCode: "ANX-ON-948120",
    vehicle: {
      vin: "WP1AF2AY5NL128491",
      year: 2022,
      make: "Porsche",
      model: "Macan",
      trim: "GTS AWD",
      mileageKm: 38450,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      damageGrade: "A",
      auctionId: "auc-porsche-macan-2022",
    },
    seller: {
      name: "Marcus Sterling",
      phone: "+1 (416) 555-0194",
      email: "m.sterling@outlook.com",
      address: "180 University Avenue",
      city: "Toronto",
      province: "ON",
      postalCode: "M5H 0A2",
    },
    acceptedBidAmountCents: 3825000, // $38,250.00
    wonAt: "Yesterday at 4:45 PM",
    appointmentWindowExpiresAt: new Date(Date.now() + 34 * 60 * 60 * 1000).toISOString(),
    status: "APPOINTMENT_CONFIRMED",
    finalTransactionCents: 3825000,
    appointmentLocation: "Pfaff Porsche Markham service bay",
    inspectionNotes: "Confirmed appointment for tomorrow at 2:00 PM at Pfaff Porsche Markham service bay.",
  },
  {
    id: "match-audi-q7",
    voucherCode: "ANX-ON-621804",
    vehicle: {
      vin: "WA1VAAF74KD019283",
      year: 2021,
      make: "Audi",
      model: "Q7",
      trim: "55 Progressiv quattro",
      mileageKm: 46200,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
      damageGrade: "B",
      auctionId: "auc-audi-q7-2021",
    },
    seller: {
      name: "Elena Rostova",
      phone: "+1 (905) 555-7381",
      email: "elena.r@gmail.com",
      address: "42 Bayview Hill",
      city: "Richmond Hill",
      province: "ON",
      postalCode: "L4C 9V3",
    },
    acceptedBidAmountCents: 4150000, // $41,500.00
    wonAt: "3 days ago",
    appointmentWindowExpiresAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    finalTransactionCents: 4150000,
    appointmentLocation: "Pfaff Audi Vaughan intake desk",
    inspectionNotes: "Physical inspection passed. Both sets of keys received. Bill of Sale signed and EFT payout issued to seller.",
  },
];

export function DealerWonMatchesView() {
  const [matches, setMatches] = useState<WonMatchItem[]>(INITIAL_WON_MATCHES);
  const [filterTab, setFilterTab] = useState<"ALL" | "SCHEDULED" | "COMPLETED">("ALL");
  const [editingMatch, setEditingMatch] = useState<WonMatchItem | null>(null);
  const [selectedQrMatch, setSelectedQrMatch] = useState<WonMatchItem | null>(null);
  const [newStatus, setNewStatus] = useState<WonMatchStatus>("COMPLETED");
  const [finalPriceInput, setFinalPriceInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll and listen for Escape key whenever any modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(editingMatch || selectedQrMatch);
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingMatch(null);
        setSelectedQrMatch(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingMatch, selectedQrMatch]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (filterTab === "SCHEDULED") return m.status === "APPOINTMENT_CONFIRMED";
      if (filterTab === "COMPLETED") return m.status === "COMPLETED";
      return true;
    });
  }, [matches, filterTab]);

  const openInspectionModal = (match: WonMatchItem) => {
    setEditingMatch(match);
    setNewStatus(match.status);
    setFinalPriceInput(
      match.finalTransactionCents
        ? (match.finalTransactionCents / 100).toString()
        : (match.acceptedBidAmountCents / 100).toString()
    );
    setNotesInput(match.inspectionNotes || "");
  };

  const handleSelectStatus = (status: WonMatchStatus) => {
    setNewStatus(status);
    if (!editingMatch) return;

    if (status === "COMPLETED") {
      setFinalPriceInput((editingMatch.acceptedBidAmountCents / 100).toString());
    } else if (status === "DECLINED_AFTER_INSPECTION" || status === "NO_SHOW") {
      setFinalPriceInput("0");
    }
  };

  const handleAddQuickTag = (tag: string) => {
    setNotesInput((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag + ".";
      if (trimmed.toLowerCase().includes(tag.toLowerCase())) return prev;
      return trimmed.replace(/\.*$/, "") + ` • ${tag}.`;
    });
  };

  const handleApplyPriceDelta = (deltaDollars: number) => {
    if (!editingMatch) return;
    const baseDollars = editingMatch.acceptedBidAmountCents / 100;
    const newAmount = Math.max(0, baseDollars + deltaDollars);
    setFinalPriceInput(newAmount.toString());
  };

  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    const parsedPrice = parseFloat(finalPriceInput.replace(/[^0-9.]/g, ""));
    const priceCents = isNaN(parsedPrice)
      ? editingMatch.acceptedBidAmountCents
      : Math.round(parsedPrice * 100);

    setMatches((prev) =>
      prev.map((m) =>
        m.id === editingMatch.id
          ? {
              ...m,
              status: newStatus,
              finalTransactionCents: priceCents,
              inspectionNotes: notesInput,
            }
          : m
      )
    );

    setSaveSuccess(editingMatch.voucherCode);
    setEditingMatch(null);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const totalCompletedValueCents = matches
    .filter((m) => m.status === "COMPLETED")
    .reduce((acc, m) => acc + (m.finalTransactionCents ?? m.acceptedBidAmountCents), 0);

  const totalWonValueCents = matches.reduce(
    (acc, m) => acc + (m.acceptedBidAmountCents ?? 0),
    0
  );

  const scheduledCount = matches.filter((m) => m.status === "APPOINTMENT_CONFIRMED").length;
  const completedCount = matches.filter((m) => m.status === "COMPLETED").length;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Clean Open Page Header (Borderless, Direct Typography, FinTech Dashboard) */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-headline text-portal-text tracking-tight">
              Won Matches & Handover
            </h1>
            <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-2xl">
              Coordinate physical vehicle intake, appointment verification, and offline inspection settlements.
            </p>
          </div>

          <Link
            href="/dealer/inventory"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-bold transition-all shadow-2xs self-start lg:self-auto cursor-pointer group"
          >
            <span>Explore Wholesale Floor</span>
            <ArrowUpRight className="w-4 h-4 text-portal-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Single Unified Stats Overview Bar matching Reference Image 2 */}
        <div className="rounded-2xl border border-portal-border bg-portal-surface p-4 sm:p-6 shadow-xs">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-portal-border">
            {[
              {
                label: "TOTAL WON VALUE",
                value: formatCadCents(totalWonValueCents),
                icon: DollarSign,
                trend: "Agreed Wholesale Volume",
                isPositive: true,
                highlight: false,
                isCircle: false,
              },
              {
                label: "TOTAL WON LOTS",
                value: `${matches.length} Lots`,
                icon: Trophy,
                trend: "Accepted Seller Offers",
                isPositive: false,
                highlight: false,
                isCircle: false,
              },
              {
                label: "CONFIRMED INTAKE",
                value: `${scheduledCount} Scheduled`,
                icon: Calendar,
                trend: "Service Bay Appointments",
                isPositive: true,
                highlight: false,
                isCircle: true,
              },
              {
                label: "SETTLED HANDOVERS",
                value: formatCadCents(totalCompletedValueCents),
                icon: CheckCircle2,
                trend: `${completedCount} Completed Sales`,
                isPositive: true,
                highlight: true,
                isCircle: true,
              },
            ].map(({ label, value, icon: Icon, trend, isPositive, highlight, isCircle }, idx) => (
              <div
                key={label}
                className={`flex items-center justify-between gap-4 transition-colors ${
                  idx === 0 ? "lg:pr-6" : idx === 3 ? "lg:pl-6" : "lg:px-6"
                }`}
              >
                {/* Left Side: Metric Information */}
                <div className="min-w-0 flex-1">
                  <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-portal-text-muted truncate">
                    {label}
                  </dt>
                  <dd className="mt-1 font-headline text-2xl sm:text-3xl font-bold text-portal-text tracking-tight tabular-nums truncate">
                    {value}
                  </dd>
                  <div className="mt-1 flex items-center gap-1.5 font-body text-xs truncate">
                    {isPositive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>{trend}</span>
                      </span>
                    ) : (
                      <span className="text-portal-text-muted font-normal">{trend}</span>
                    )}
                    {highlight && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        VERIFIED
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Icon */}
                {isCircle ? (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-portal-border/80 bg-portal-surface-hover/50 flex items-center justify-center shrink-0 text-portal-primary">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-portal-primary" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center shrink-0 text-portal-primary pr-1">
                    <Icon className="w-6 h-6 text-portal-primary" />
                  </div>
                )}
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* 2. Filter Pills & Toast */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-portal-surface border border-portal-border shadow-2xs text-xs self-start">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "ALL"
                ? "bg-portal-primary text-white shadow-2xs"
                : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
            }`}
          >
            <span>All Won Matches</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                filterTab === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-portal-surface-hover text-portal-text-muted"
              }`}
            >
              {matches.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("SCHEDULED")}
            className={`px-3 py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "SCHEDULED"
                ? "bg-sky-600 text-white shadow-2xs"
                : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Scheduled Intake</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                filterTab === "SCHEDULED"
                  ? "bg-white/20 text-white"
                  : "bg-portal-surface-hover text-portal-text-muted"
              }`}
            >
              {scheduledCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === "COMPLETED"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settled & Paid</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                filterTab === "COMPLETED"
                  ? "bg-white/20 text-white"
                  : "bg-portal-surface-hover text-portal-text-muted"
              }`}
            >
              {completedCount}
            </span>
          </button>
        </div>

        {saveSuccess && (
          <div className="p-2.5 px-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Inspection log updated for voucher #{saveSuccess}.</span>
          </div>
        )}
      </div>

      {/* 3. Modernized Won Match Cards (Less Boxy, Seamless Hierarchy) */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-portal-border bg-portal-surface p-8 space-y-3">
            <Trophy className="w-10 h-10 text-portal-text-muted mx-auto opacity-40" />
            <h3 className="text-base font-bold text-portal-text">No Matching Won Vehicles</h3>
            <p className="text-xs text-portal-text-muted max-w-sm mx-auto">
              No won lots match your selected filter.
            </p>
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isCompleted = match.status === "COMPLETED";
            const logoPath = CAR_BRAND_LOGOS[match.vehicle.make.toLowerCase()];

            return (
              <div
                key={match.id}
                className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 transition-all shadow-2xs hover:shadow-md relative overflow-hidden group space-y-5"
              >
                {/* Top Row: Voucher, Status, Agreed Price & Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-portal-border/60">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Status Badge */}
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-500/25">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed & Settled</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-mono font-bold border border-sky-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        <span>Appointment Confirmed</span>
                      </span>
                    )}

                    <span className="text-xs font-mono font-bold text-portal-primary">
                      Voucher #{match.voucherCode}
                    </span>

                    <span className="text-portal-border hidden sm:inline">•</span>

                    <span className="text-[11px] text-portal-text-muted font-mono">
                      Seller accepted {match.wonAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 self-start sm:self-auto">
                    <div className="text-right font-mono">
                      <span className="text-[10px] uppercase font-semibold text-portal-text-muted block">
                        Agreed Wholesale Price
                      </span>
                      <span className="text-lg sm:text-xl font-black text-portal-text block">
                        {formatCadCents(match.acceptedBidAmountCents)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openInspectionModal(match)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-portal-surface border border-portal-border hover:bg-portal-primary hover:text-white hover:border-portal-primary text-portal-text text-xs font-bold transition-all shadow-2xs cursor-pointer group/btn"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-portal-primary group-hover/btn:text-white transition-colors" />
                      <span>Log Outcome</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Main Content Area: Vehicle Dossier & Seller Information (Clean, Open Flow) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left: Vehicle Info & Photo (6 cols) */}
                  <div className="lg:col-span-6 flex items-start sm:items-center gap-4">
                    <Link
                      href={`/dealer/auctions/${match.vehicle.auctionId || "auc-porsche-macan-2022"}`}
                      className="relative w-32 h-22 sm:w-38 sm:h-26 rounded-xl overflow-hidden bg-portal-surface-hover shrink-0 border border-portal-border group/photo shadow-2xs block"
                    >
                      <Image
                        src={match.vehicle.thumbnailUrl}
                        alt={`${match.vehicle.make} ${match.vehicle.model}`}
                        fill
                        className="object-cover group-hover/photo:scale-105 transition-transform duration-300"
                        sizes="150px"
                      />

                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                        Grade {match.vehicle.damageGrade}
                      </div>

                      {logoPath && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/60 backdrop-blur-xs flex items-center justify-center p-0.5">
                          <Image
                            src={logoPath}
                            alt={match.vehicle.make}
                            width={18}
                            height={18}
                            className="object-contain brightness-0 invert opacity-90"
                          />
                        </div>
                      )}
                    </Link>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-portal-text-muted font-mono">
                        <span>VIN: ···{match.vehicle.vin.slice(-6)}</span>
                        <span>•</span>
                        <span className="font-medium text-portal-text">
                          {match.vehicle.mileageKm.toLocaleString()} km
                        </span>
                      </div>

                      <Link
                        href={`/dealer/auctions/${match.vehicle.auctionId || "auc-porsche-macan-2022"}`}
                        className="text-base sm:text-lg font-bold font-headline text-portal-text hover:text-portal-primary transition-colors block truncate"
                      >
                        {match.vehicle.year} {match.vehicle.make} {match.vehicle.model}
                      </Link>

                      <p className="text-xs text-portal-text-muted truncate">
                        {match.vehicle.trim}
                      </p>

                      <Link
                        href={`/dealer/auctions/${match.vehicle.auctionId || "auc-porsche-macan-2022"}`}
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-portal-primary hover:underline pt-0.5"
                      >
                        <span>View Inspection Dossier</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Right: Unsealed Seller Contact & Digital Intake Pass (6 cols) */}
                  <div className="lg:col-span-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:border-l border-portal-border/60 sm:pl-6">
                    {/* Scannable Contact Details */}
                    <div className="space-y-2 text-xs flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-portal-text">{match.seller.name}</span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold px-1.5 py-0.2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          ID Verified
                        </span>
                      </div>

                      <div className="space-y-1 text-portal-text-muted">
                        <div className="flex items-center gap-2 font-mono">
                          <Phone className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                          <a
                            href={`tel:${match.seller.phone}`}
                            className="hover:text-portal-text hover:underline transition-colors"
                          >
                            {match.seller.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <Mail className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                          <a
                            href={`mailto:${match.seller.email}`}
                            className="hover:text-portal-text hover:underline truncate max-w-[200px] transition-colors"
                          >
                            {match.seller.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                          <span>
                            {match.seller.city}, {match.seller.province}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Digital Pass Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedQrMatch(match)}
                      className="p-3.5 rounded-xl border border-portal-border bg-portal-surface-hover hover:border-portal-primary/50 text-center space-y-1.5 transition-all cursor-pointer shadow-2xs shrink-0 self-stretch sm:self-auto group/qr"
                      title="Click to view full digital intake pass & QR code"
                    >
                      <div className="w-12 h-12 rounded-lg bg-portal-surface border border-portal-border flex items-center justify-center mx-auto shadow-2xs group-hover/qr:scale-105 transition-transform">
                        <QrCode className="w-7 h-7 text-portal-text" />
                      </div>
                      <span className="text-[10px] font-mono text-portal-text-muted uppercase block">
                        Intake Pass QR
                      </span>
                      <span className="text-[11px] font-mono font-bold text-portal-primary block">
                        #{match.voucherCode}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Appointment Status & Operational Notes */}
                <div className="pt-3 border-t border-portal-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start sm:items-center gap-2 text-portal-text-muted">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <Calendar className="w-4 h-4 text-sky-500 shrink-0 mt-0.5 sm:mt-0" />
                    )}
                    <span className="leading-relaxed">
                      {match.inspectionNotes || "Appointment confirmed for physical vehicle appraisal."}
                    </span>
                  </div>

                  <div className="font-mono text-portal-text-muted text-[11px] shrink-0">
                    {isCompleted ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Final Payout Settled
                      </span>
                    ) : (
                      <span>Appointment Window: 34h remaining</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Digital QR Voucher Pass Modal */}
      {mounted &&
        selectedQrMatch &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedQrMatch(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-2xl space-y-5 text-center relative animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="intake-pass-title"
            >
              <button
                type="button"
                onClick={() => setSelectedQrMatch(null)}
                className="absolute top-4 right-4 text-portal-text-muted hover:text-portal-text w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-portal-surface-hover"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5 pt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-portal-primary/10 text-portal-primary border border-portal-primary/20 uppercase tracking-wide">
                  Dealership Intake Pass
                </span>
                <h3 id="intake-pass-title" className="text-xl font-bold font-headline text-portal-text tracking-tight">
                  Voucher #{selectedQrMatch.voucherCode}
                </h3>
                <p className="text-xs text-portal-text-muted font-mono">
                  {selectedQrMatch.vehicle.year} {selectedQrMatch.vehicle.make} {selectedQrMatch.vehicle.model} • VIN {selectedQrMatch.vehicle.vin.slice(-6)}
                </p>
              </div>

              {/* QR Code Graphic Container */}
              <div className="p-6 rounded-2xl bg-white border border-portal-border shadow-sm mx-auto w-48 h-48 flex flex-col items-center justify-center space-y-2">
                <QrCode className="w-36 h-36 text-neutral-900" />
              </div>

              <div className="space-y-2 text-xs text-portal-text-muted font-mono bg-portal-surface-hover/50 p-3.5 rounded-xl border border-portal-border text-left">
                <div className="flex items-center justify-between">
                  <span className="text-portal-text-muted">Agreed Winning Bid:</span>
                  <span className="font-bold text-portal-text">{formatCadCents(selectedQrMatch.acceptedBidAmountCents)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-portal-text-muted">Registered Seller:</span>
                  <span className="font-semibold text-portal-text">{selectedQrMatch.seller.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-portal-text-muted">Phone:</span>
                  <span className="text-portal-text">{selectedQrMatch.seller.phone}</span>
                </div>
              </div>

              <p className="text-[11px] text-portal-text-muted leading-relaxed">
                Scan using the Dealership Intake Scanner at the service drive desk to confirm VIN verification & initiate electronic payout.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-xl border border-portal-border hover:bg-portal-surface-hover text-xs font-semibold text-portal-text flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQrMatch(null)}
                  className="flex-1 py-2 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Inspection Outcome & Settlement Modal */}
      {mounted &&
        editingMatch &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setEditingMatch(null)}
          >
            <div
              className="w-full max-w-2xl rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 shadow-2xl space-y-5 my-auto animate-in zoom-in-95 duration-200 text-portal-text relative max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="settlement-modal-title"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-portal-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-portal-primary/10 text-portal-primary border border-portal-primary/20 uppercase tracking-wide">
                      Dealership Intake & Settlement
                    </span>
                    <span className="text-xs text-portal-text-muted font-mono">
                      #{editingMatch.voucherCode}
                    </span>
                  </div>
                  <h2 id="settlement-modal-title" className="text-lg sm:text-xl font-bold font-headline text-portal-text tracking-tight">
                    Log Inspection & Settlement Outcome
                  </h2>
                  <p className="text-xs text-portal-text-muted">
                    Record hoist inspection findings, adjust final payout for undisclosed flaws, and issue settlement approval.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="text-portal-text-muted hover:text-portal-text w-8 h-8 rounded-xl border border-transparent hover:border-portal-border hover:bg-portal-surface-hover flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Vehicle Context Dossier Strip */}
              <div className="rounded-xl border border-portal-border bg-portal-surface-hover/40 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-11 rounded-lg overflow-hidden border border-portal-border shrink-0 bg-portal-surface">
                    <Image
                      src={editingMatch.vehicle.thumbnailUrl}
                      alt={editingMatch.vehicle.model}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-portal-text flex items-center gap-2">
                      <span>{editingMatch.vehicle.year} {editingMatch.vehicle.make} {editingMatch.vehicle.model}</span>
                      <span className="text-[11px] font-normal text-portal-text-muted">({editingMatch.vehicle.trim})</span>
                    </div>
                    <div className="text-[11px] text-portal-text-muted font-mono flex items-center gap-2 mt-0.5">
                      <span>VIN: {editingMatch.vehicle.vin}</span>
                      <span>•</span>
                      <span>{editingMatch.vehicle.mileageKm.toLocaleString()} km</span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-portal-border">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-portal-text-muted block">
                    Agreed Winning Offer
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-portal-primary">
                    {formatCadCents(editingMatch.acceptedBidAmountCents)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveInspection} className="space-y-4">
                {/* 1. Status Selection Grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-portal-text uppercase tracking-wider font-mono">
                    1. Inspection & Handover Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        value: "COMPLETED" as WonMatchStatus,
                        title: "Inspection Passed (Full Payout)",
                        desc: "Vehicle appraisal verified. Authorize full agreed CAD payout to seller.",
                        icon: CheckCircle2,
                        accent: "text-emerald-500",
                        activeBorder: "border-emerald-500/80 bg-emerald-500/5 ring-1 ring-emerald-500/20",
                      },
                      {
                        value: "APPOINTMENT_CONFIRMED" as WonMatchStatus,
                        title: "Intake Scheduled / In Progress",
                        desc: "Appointment confirmed. Vehicle currently awaiting or on the hoist.",
                        icon: Calendar,
                        accent: "text-sky-500",
                        activeBorder: "border-sky-500/80 bg-sky-500/5 ring-1 ring-sky-500/20",
                      },
                      {
                        value: "RENEGOTIATED_LOWER" as WonMatchStatus,
                        title: "Price Adjusted for Undisclosed Flaws",
                        desc: "Mechanical or body flaws found. Mutual reduced CAD price agreed.",
                        icon: AlertTriangle,
                        accent: "text-amber-500",
                        activeBorder: "border-amber-500/80 bg-amber-500/5 ring-1 ring-amber-500/20",
                      },
                      {
                        value: "DECLINED_AFTER_INSPECTION" as WonMatchStatus,
                        title: "Declined Dealership Purchase",
                        desc: "Severe structural/mechanical flaws. Transaction voided, $0 payout.",
                        icon: XCircle,
                        accent: "text-rose-500",
                        activeBorder: "border-rose-500/80 bg-rose-500/5 ring-1 ring-rose-500/20",
                      },
                    ].map((opt) => {
                      const isSelected = newStatus === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectStatus(opt.value)}
                          className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? opt.activeBorder
                              : "border-portal-border bg-portal-surface hover:bg-portal-surface-hover/70"
                          }`}
                        >
                          <div className={`mt-0.5 p-1 rounded-md shrink-0 ${isSelected ? "bg-portal-surface" : ""}`}>
                            <Icon className={`w-4 h-4 ${opt.accent}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-portal-text block">
                                {opt.title}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-portal-text-muted leading-snug mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Final Settlement Price in CAD */}
                {newStatus === "DECLINED_AFTER_INSPECTION" ? (
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2.5">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Dealership purchase declined. The auction match will be voided with $0.00 CAD payout to seller.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 p-3.5 rounded-xl border border-portal-border bg-portal-surface-hover/30">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-portal-text uppercase tracking-wider font-mono">
                        2. Final Settlement Payout (CAD)
                      </label>
                      {/* Price Delta Badge */}
                      {(() => {
                        const originalOffer = editingMatch.acceptedBidAmountCents / 100;
                        const currentVal = parseFloat(finalPriceInput.replace(/[^0-9.]/g, "")) || 0;
                        const diff = currentVal - originalOffer;
                        if (diff === 0) {
                          return (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              ✓ 100% of Agreed Offer
                            </span>
                          );
                        } else if (diff < 0) {
                          const pct = ((Math.abs(diff) / originalOffer) * 100).toFixed(1);
                          return (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              ▼ -${Math.abs(diff).toLocaleString()} CAD (-{pct}% deduction)
                            </span>
                          );
                        } else {
                          return (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                              ▲ +${diff.toLocaleString()} CAD premium
                            </span>
                          );
                        }
                      })()}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-portal-text-muted text-sm font-bold">
                        $
                      </span>
                      <input
                        type="text"
                        value={finalPriceInput}
                        onChange={(e) => setFinalPriceInput(e.target.value)}
                        placeholder="38250.00"
                        className="w-full pl-8 pr-16 py-2.5 rounded-xl border border-portal-border bg-portal-surface text-portal-text font-mono text-base font-bold focus:outline-hidden focus:ring-2 focus:ring-portal-primary"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-portal-text-muted text-xs">
                        CAD
                      </span>
                    </div>

                    {/* Quick Adjustment Chips */}
                    {newStatus === "RENEGOTIATED_LOWER" && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-portal-text-muted font-mono mr-1">Quick Deduction:</span>
                        {[
                          { label: "Agreed ($38,250)", delta: 0 },
                          { label: "-$500", delta: -500 },
                          { label: "-$1,000", delta: -1000 },
                          { label: "-$1,500", delta: -1500 },
                          { label: "-$2,500", delta: -2500 },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() => handleApplyPriceDelta(btn.delta)}
                            className="px-2 py-1 rounded-lg border border-portal-border hover:border-portal-primary hover:bg-portal-surface text-[10px] font-mono text-portal-text transition-all cursor-pointer"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Hoist & Technician Inspection Notes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-portal-text uppercase tracking-wider font-mono">
                      3. Technician / Hoist Inspection Notes & Rationale
                    </label>
                    <span className="text-[10px] text-portal-text-muted font-mono">
                      Recorded on Settlement Certificate
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="e.g. Physical hoist inspection completed at service bay. Underbody clean, brake pads at 4mm, OBD-II scan shows 0 trouble codes. Bill of Sale signed."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs focus:outline-hidden focus:ring-2 focus:ring-portal-primary leading-relaxed resize-none"
                  />

                  {/* One-click Quick Rationale Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-portal-text-muted font-mono mr-1">Insert findings:</span>
                    {[
                      "Hoist check complete",
                      "OBD-II scan 0 DTCs",
                      "Paint depth verified",
                      "Brake wear matched photos",
                      "Both key fobs received",
                      "Bill of Sale signed",
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddQuickTag(tag)}
                        className="px-2 py-0.5 rounded-md border border-portal-border/80 bg-portal-surface-hover/50 hover:bg-portal-surface-hover hover:border-portal-border text-[10px] text-portal-text-muted hover:text-portal-text transition-colors cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-portal-border">
                  <button
                    type="button"
                    onClick={() => setEditingMatch(null)}
                    className="px-4 py-2.5 rounded-xl border border-portal-border text-xs font-semibold text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Settlement Record</span>
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
