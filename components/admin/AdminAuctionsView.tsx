"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sliders,
  Clock,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  Gavel,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  StopCircle,
  Copy,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  AlertOctagon,
  Download,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePagination } from "@/components/ui/TablePagination";

export type AdminAuctionLot = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  sellerName: string;
  city: string;
  province: string;
  status: "ACTIVE" | "PENDING_MODERATION" | "UNSEALED" | "ACCEPTED" | "CANCELLED";
  totalBidsCount: number;
  reservePriceCents: number; // Integer CAD cents invariant
  highestBidEstimateCents?: number;
  endsAt: string;
  thumbnailUrl: string;
};

const INITIAL_AUCTION_LOTS: AdminAuctionLot[] = [
  {
    id: "auc-porsche-macan-2022",
    vin: "WP1AF2AY5NL128491",
    year: 2022,
    make: "Porsche",
    model: "Macan",
    trim: "GTS AWD",
    sellerName: "Marcus Sterling",
    city: "Toronto",
    province: "ON",
    status: "ACTIVE",
    totalBidsCount: 14,
    reservePriceCents: 3750000,
    highestBidEstimateCents: 3825000,
    endsAt: new Date(Date.now() + (17 * 60 + 42) * 60 * 1000).toISOString(),
    thumbnailUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "auc-bmw-m340i-2023",
    vin: "WBA5R7C09NF123456",
    year: 2023,
    make: "BMW",
    model: "M340i",
    trim: "xDrive Sedan",
    sellerName: "Jason Miller",
    city: "Oakville",
    province: "ON",
    status: "ACTIVE",
    totalBidsCount: 23,
    reservePriceCents: 4000000,
    highestBidEstimateCents: 4150000,
    endsAt: new Date(Date.now() + (0 * 60 + 11) * 60 * 1000).toISOString(), // Sub-15min Crimson urgency state
    thumbnailUrl:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "auc-tesla-modely-2023",
    vin: "5YJ3E1EA8PF412345",
    year: 2023,
    make: "Tesla",
    model: "Model Y",
    trim: "Long Range AWD",
    sellerName: "Priya Nair",
    city: "Mississauga",
    province: "ON",
    status: "ACTIVE",
    totalBidsCount: 19,
    reservePriceCents: 3900000,
    highestBidEstimateCents: 4020000,
    endsAt: new Date(Date.now() + (4 * 60 + 14) * 60 * 1000).toISOString(),
    thumbnailUrl:
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "auc-ford-f150-2021",
    vin: "1FTFW1E84MFA12345",
    year: 2021,
    make: "Ford",
    model: "F-150",
    trim: "Lariat SuperCrew 4x4",
    sellerName: "Robert Kelly",
    city: "Vaughan",
    province: "ON",
    status: "ACTIVE",
    totalBidsCount: 8,
    reservePriceCents: 3400000,
    highestBidEstimateCents: 3250000,
    endsAt: new Date(Date.now() + (11 * 60 + 49) * 60 * 1000).toISOString(),
    thumbnailUrl:
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "auc-audi-q7-2021",
    vin: "WA1VAAF74KD019283",
    year: 2021,
    make: "Audi",
    model: "Q7",
    trim: "55 TFSI Progressiv",
    sellerName: "Elena Rostova",
    city: "Richmond Hill",
    province: "ON",
    status: "ACCEPTED",
    totalBidsCount: 17,
    reservePriceCents: 4100000,
    highestBidEstimateCents: 4150000,
    endsAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    thumbnailUrl:
      "https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=800&q=80",
  },
];

export function AdminAuctionsView() {
  const [lots, setLots] = useState<AdminAuctionLot[]>(INITIAL_AUCTION_LOTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "CLOSING_SOON" | "ACCEPTED" | "CANCELLED">("ALL");
  const [selectedLot, setSelectedLot] = useState<AdminAuctionLot | null>(null);
  const [overrideModalType, setOverrideModalType] = useState<"EXTEND" | "TERMINATE" | null>(null);
  const [extensionHours, setExtensionHours] = useState(2);
  const [overrideReason, setOverrideReason] = useState("");
  const [killConfirmInput, setKillConfirmInput] = useState("");
  const [copiedVin, setCopiedVin] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Checkbox multi-selection
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Lock body scroll when override modal is open
  useEffect(() => {
    if (overrideModalType) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [overrideModalType]);

  // Operational metrics
  const activeLots = lots.filter((l) => l.status === "ACTIVE");
  const urgentLots = activeLots.filter((l) => {
    const diff = new Date(l.endsAt).getTime() - Date.now();
    return diff > 0 && diff < 60 * 60 * 1000; // < 1 hour
  });
  const acceptedLots = lots.filter((l) => l.status === "ACCEPTED");

  // Filter logic
  const filtered = useMemo(() => {
    return lots.filter((lot) => {
      if (statusFilter === "ACTIVE" && lot.status !== "ACTIVE") return false;
      if (statusFilter === "ACCEPTED" && lot.status !== "ACCEPTED") return false;
      if (statusFilter === "CANCELLED" && lot.status !== "CANCELLED") return false;
      if (statusFilter === "CLOSING_SOON") {
        const diff = new Date(lot.endsAt).getTime() - Date.now();
        if (lot.status !== "ACTIVE" || diff <= 0 || diff >= 60 * 60 * 1000) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          lot.vin.toLowerCase().includes(q) ||
          lot.make.toLowerCase().includes(q) ||
          lot.model.toLowerCase().includes(q) ||
          lot.sellerName.toLowerCase().includes(q) ||
          lot.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [lots, statusFilter, search]);

  // Universal Table Sorting Hook
  const { sortedData, requestSort, isSorted } = useTableSort<AdminAuctionLot>(filtered, {
    initialKey: "endsAt",
    initialDirection: "asc",
  });

  // Paginated slice
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  // Select all handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(paginatedData.map((l) => l.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = (vin: string) => {
    navigator.clipboard.writeText(vin);
    setCopiedVin(vin);
    setTimeout(() => setCopiedVin(null), 2000);
  };

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;

    if (overrideModalType === "EXTEND") {
      const newEndTime = new Date(
        new Date(selectedLot.endsAt).getTime() + extensionHours * 3600 * 1000
      ).toISOString();

      setLots((prev) =>
        prev.map((lot) =>
          lot.id === selectedLot.id ? { ...lot, endsAt: newEndTime } : lot
        )
      );

      setFeedbackNotice({
        text: `Auction ${selectedLot.year} ${selectedLot.make} ${selectedLot.model} extended by +${extensionHours}h. Dealers notified.`,
        type: "success",
      });
    } else if (overrideModalType === "TERMINATE") {
      if (killConfirmInput.trim().toUpperCase() !== "HALT") {
        return;
      }

      setLots((prev) =>
        prev.map((lot) =>
          lot.id === selectedLot.id ? { ...lot, status: "CANCELLED" } : lot
        )
      );

      setFeedbackNotice({
        text: `Emergency Override: Auction ${selectedLot.id} terminated and sealed bids archived.`,
        type: "error",
      });
    }

    setOverrideModalType(null);
    setSelectedLot(null);
    setOverrideReason("");
    setKillConfirmInput("");
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Direct-Canvas Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-portal-text-muted mb-1">
          <Gavel className="w-3.5 h-3.5 text-portal-primary" />
          <span>Live Operations</span>
          <span>•</span>
          <span>Market Operations Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
          Auction Master Operations &amp; Overrides
        </h1>
        <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl font-body">
          Real-time wholesale exchange supervision, countdown clock extensions, statutory compliance halts, and sealed-bid integrity surveillance.
        </p>
      </div>

      {/* 2. Operational Metrics Ribbon (Side-by-Side Prominent Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Live Lots */}
        <div
          onClick={() => setStatusFilter("ACTIVE")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "ACTIVE"
              ? "bg-portal-surface border-amber-500/60 shadow-xs ring-1 ring-amber-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
              <Gavel className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Live Wholesale Floor
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Active 24h bidding windows
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-500">
              {activeLots.length}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Lots Trading</span>
          </div>
        </div>

        {/* Metric 2: Closing Soon (<1h) */}
        <div
          onClick={() => setStatusFilter("CLOSING_SOON")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "CLOSING_SOON"
              ? "bg-portal-surface border-red-500/60 shadow-xs ring-1 ring-red-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0 shadow-2xs">
              <Timer className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Closing Urgently
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Under 60 minutes remaining
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-red-500">
              {urgentLots.length}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Critical Lots</span>
          </div>
        </div>

        {/* Metric 3: Accepted Deals */}
        <div
          onClick={() => setStatusFilter("ACCEPTED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "ACCEPTED"
              ? "bg-portal-surface border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Floor Matches
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Reserve met &amp; accepted
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {acceptedLots.length}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Cleared</span>
          </div>
        </div>

        {/* Metric 4: Total Inventory */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "ALL"
              ? "bg-portal-surface border-portal-primary/60 shadow-xs ring-1 ring-portal-primary/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-portal-surface-hover border border-portal-border text-portal-text flex items-center justify-center shrink-0 shadow-2xs">
              <Sliders className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Total Catalog
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Full market operations stream
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {lots.length}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Total Lots</span>
          </div>
        </div>
      </div>

      {/* Dynamic Feedback Notice */}
      {feedbackNotice && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
            feedbackNotice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackNotice.text}</span>
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

      {/* 3. Modern Reference Table Card Container (Matching Image 4) */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface shadow-xs overflow-hidden">
        {/* Table Header Strip */}
        <div className="p-6 border-b border-portal-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-portal-text font-headline">
                Wholesale Auction Floor Surveillance
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
                {filtered.length} Total Lots
              </span>
            </div>
            <p className="text-xs text-portal-text-muted mt-1 font-body">
              Supervise live 24h dealer bidding windows, monitor sealed liquidity, and manage operational overrides.
            </p>
          </div>

          {/* Action Tools & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search VIN, make, model..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/40 font-body"
              />
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1">
              {[
                { id: "ALL", label: "All" },
                { id: "ACTIVE", label: "Active" },
                { id: "CLOSING_SOON", label: "Ending Soon" },
                { id: "ACCEPTED", label: "Cleared" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-portal-primary text-white font-bold shadow-2xs"
                      : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Table Surface */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-body">
            <thead>
              <tr className="border-b border-portal-border/60 bg-portal-surface-hover/30">
                {/* Select All Checkbox */}
                <th className="py-3.5 pl-6 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedData.length > 0 &&
                      paginatedData.every((l) => selectedRows.has(l.id))
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                  />
                </th>
                <SortableHeader
                  label="Vehicle Lot"
                  direction={isSorted("model")}
                  onSort={() => requestSort("model")}
                />
                <SortableHeader
                  label="Seller & Location"
                  direction={isSorted("sellerName")}
                  onSort={() => requestSort("sellerName")}
                />
                <SortableHeader
                  label="Sealed Telemetry"
                  direction={isSorted("totalBidsCount")}
                  onSort={() => requestSort("totalBidsCount")}
                />
                <SortableHeader
                  label="Reserve (CAD)"
                  direction={isSorted("reservePriceCents")}
                  onSort={() => requestSort("reservePriceCents")}
                />
                <SortableHeader
                  label="Countdown"
                  direction={isSorted("endsAt")}
                  onSort={() => requestSort("endsAt")}
                />
                <SortableHeader
                  label="Status"
                  direction={isSorted("status")}
                  onSort={() => requestSort("status")}
                />
                <th className="py-3.5 pr-6 pl-4 text-right text-xs font-semibold text-portal-text-muted">
                  Controls
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border/40">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-portal-text-muted">
                    <Gavel className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No auction lots found</p>
                    <p className="text-xs text-portal-text-muted mt-1">
                      Adjust your search or status filter to see other marketplace lots.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((lot) => {
                  const isChecked = selectedRows.has(lot.id);
                  const msLeft = new Date(lot.endsAt).getTime() - Date.now();
                  const hoursLeft = Math.max(0, Math.floor(msLeft / (3600 * 1000)));
                  const minsLeft = Math.max(0, Math.floor((msLeft % (3600 * 1000)) / (60 * 1000)));
                  const isUrgent = lot.status === "ACTIVE" && msLeft > 0 && msLeft < 15 * 60 * 1000;
                  const isClosed = msLeft <= 0 || lot.status !== "ACTIVE";

                  return (
                    <tr
                      key={lot.id}
                      className={`hover:bg-portal-surface-hover/50 transition-colors group ${
                        isChecked ? "bg-portal-primary/5" : ""
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(lot.id)}
                          className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                        />
                      </td>

                      {/* Vehicle Lot (Image Badge + Title) */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-8 rounded-lg overflow-hidden bg-portal-surface-hover border border-portal-border shrink-0">
                            <Image
                              src={lot.thumbnailUrl}
                              alt={`${lot.year} ${lot.make} ${lot.model}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-portal-text text-sm block truncate group-hover:text-portal-primary transition-colors">
                              {lot.year} {lot.make} {lot.model}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-portal-text-muted mt-0.5 font-mono">
                              <span>VIN: ···{lot.vin.slice(-6)}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(lot.vin)}
                                className="hover:text-portal-text p-0.5 rounded cursor-pointer"
                                title="Copy VIN"
                              >
                                {copiedVin === lot.vin ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Seller & Location */}
                      <td className="py-4 px-4">
                        <span className="font-medium text-portal-text block">
                          {lot.sellerName}
                        </span>
                        <span className="text-xs text-portal-text-muted block mt-0.5">
                          {lot.city}, {lot.province}
                        </span>
                      </td>

                      {/* Sealed Telemetry */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-portal-text">
                          <Lock className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                          <span>{lot.totalBidsCount} sealed bids</span>
                        </div>
                        {lot.highestBidEstimateCents && (
                          <span className="text-xs text-portal-text-muted font-mono block mt-0.5">
                            Top: {formatCadCents(lot.highestBidEstimateCents)}
                          </span>
                        )}
                      </td>

                      {/* Reserve Price */}
                      <td className="py-4 px-4 font-headline font-bold text-sm text-portal-text">
                        {formatCadCents(lot.reservePriceCents)}
                      </td>

                      {/* Time Remaining */}
                      <td className="py-4 px-4 font-mono text-xs">
                        {lot.status === "ACTIVE" && !isClosed ? (
                          <div
                            className={`inline-flex items-center gap-1 font-semibold ${
                              isUrgent ? "text-red-500 animate-pulse font-bold" : "text-portal-text"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {hoursLeft > 0 ? `${hoursLeft}h ` : ""}
                              {minsLeft}m left
                            </span>
                          </div>
                        ) : (
                          <span className="text-portal-text-muted">
                            {lot.status === "ACCEPTED" ? "Floor Cleared" : "Closed"}
                          </span>
                        )}
                      </td>

                      {/* Status: Soft Pastel Pill Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            lot.status === "ACTIVE"
                              ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                              : lot.status === "ACCEPTED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-portal-surface-hover text-portal-text-muted border border-portal-border"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              lot.status === "ACTIVE"
                                ? "bg-blue-500 animate-pulse"
                                : lot.status === "ACCEPTED"
                                ? "bg-emerald-500"
                                : "bg-portal-text-muted"
                            }`}
                          />
                          <span>
                            {lot.status === "ACTIVE"
                              ? "Live Floor"
                              : lot.status === "ACCEPTED"
                              ? "Cleared"
                              : "Closed"}
                          </span>
                        </span>
                      </td>

                      {/* Action Controls */}
                      <td className="py-4 pr-6 pl-4 text-right">
                        {lot.status === "ACTIVE" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLot(lot);
                                setOverrideModalType("EXTEND");
                              }}
                              className="px-2.5 py-1 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-medium transition-colors cursor-pointer"
                            >
                              + Extend
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLot(lot);
                                setOverrideModalType("TERMINATE");
                              }}
                              className="px-2.5 py-1 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer"
                            >
                              Halt
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-portal-text-muted">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Enterprise Pagination Footer (Matching Image 4) */}
        <TablePagination
          currentPage={page}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* 6. Portaled Safety Override Modals (z-[9999]) */}
      {overrideModalType && selectedLot && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setOverrideModalType(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-portal-border bg-portal-surface p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-portal-border">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    overrideModalType === "EXTEND"
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                      : "bg-red-500/10 border border-red-500/20 text-red-500"
                  }`}
                >
                  {overrideModalType === "EXTEND" ? (
                    <Clock className="w-6 h-6" />
                  ) : (
                    <AlertOctagon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-portal-text font-headline">
                    {overrideModalType === "EXTEND"
                      ? "Extend Auction Countdown"
                      : "Emergency Auction Termination"}
                  </h3>
                  <p className="text-xs text-portal-text-muted mt-0.5">
                    Target Lot:{" "}
                    <span className="font-bold text-portal-text">
                      {selectedLot.year} {selectedLot.make} {selectedLot.model}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModalType(null)}
                className="p-1 rounded text-portal-text-muted hover:text-portal-text cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmOverride} className="space-y-4">
              {overrideModalType === "EXTEND" ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-portal-text">
                      Extension Duration
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { hours: 1, label: "+1 Hour" },
                        { hours: 2, label: "+2 Hours" },
                        { hours: 6, label: "+6 Hours" },
                        { hours: 24, label: "+24 Hours" },
                      ].map((chip) => (
                        <button
                          key={chip.hours}
                          type="button"
                          onClick={() => setExtensionHours(chip.hours)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            extensionHours === chip.hours
                              ? "bg-amber-500 text-black border-amber-500 font-extrabold shadow-sm"
                              : "bg-portal-surface-hover hover:bg-portal-surface border-portal-border text-portal-text"
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-portal-text">
                      Audit Trail Rationale (Required)
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Extended by 2 hours due to local severe weather warning impacting Southern Ontario dealer inspections..."
                      className="w-full p-3 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-portal-primary/40 focus:outline-none placeholder:text-portal-text-muted"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs space-y-1">
                    <p className="font-bold">Permanent Market Override Warning</p>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Terminating this lot will immediately cancel the active floor, release all dealer bids, and archive the transaction to the non-repudiation regulatory audit log.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-portal-text">
                      Statutory Cancellation Reason
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Undisclosed vehicle lien discovered via Carfax refresh; seller breach of OMVIC disclosure terms..."
                      className="w-full p-3 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-red-500/40 focus:outline-none placeholder:text-portal-text-muted"
                    />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-bold text-portal-text">
                      Type <span className="font-mono text-red-500">HALT</span> to confirm termination
                    </label>
                    <input
                      type="text"
                      required
                      value={killConfirmInput}
                      onChange={(e) => setKillConfirmInput(e.target.value)}
                      placeholder="Type HALT"
                      className="w-full px-3 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono tracking-widest focus:ring-2 focus:ring-red-500/40 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-portal-border">
                <button
                  type="button"
                  onClick={() => setOverrideModalType(null)}
                  className="px-4 py-2.5 rounded-xl border border-portal-border text-xs font-bold text-portal-text hover:bg-portal-surface-hover cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideModalType === "TERMINATE" && killConfirmInput.trim().toUpperCase() !== "HALT"}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    overrideModalType === "EXTEND"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {overrideModalType === "EXTEND" ? "Broadcast Extension & Reset Timer" : "Execute Emergency Halt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
