"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  LayoutList,
  LayoutGrid,
  Copy,
  Check,
  ArrowUpRight,
  ArrowRight,
  ShieldAlert,
  Car,
  Building2,
  User,
  ShieldCheck,
  FileText,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import {
  INITIAL_DISPUTES,
  type DisputeItem,
  type DisputeStatus,
} from "@/lib/mock/admin-disputes";

// Automaker Brand Logo Mapping to local assets in public/car-company-logos
const CAR_BRAND_LOGOS: Record<string, string> = {
  toyota: "/car-company-logos/image_16 - Copy.png",
  jeep: "/car-company-logos/image_15.png",
  ford: "/car-company-logos/image_14.svg",
  honda: "/car-company-logos/image_12.png",
  polestar: "/car-company-logos/image_11.png",
  mitsubishi: "/car-company-logos/image_10.png",
  hyundai: "/car-company-logos/image_09.png",
  cadillac: "/car-company-logos/image_13.png",
  porsche: "/car-company-logos/image_10.png",
  lexus: "/car-company-logos/image_16 - Copy.png",
};

export function DisputeManagementView() {
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | DisputeStatus>("INVESTIGATING");
  const [sortBy, setSortBy] = useState<"NEWEST" | "ADJUSTMENT_DESC" | "AGREED_DESC">("NEWEST");
  const [viewMode, setViewMode] = useState<"LIST" | "GRID">("LIST");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status Counts
  const counts = useMemo(() => {
    return {
      ALL: disputes.length,
      INVESTIGATING: disputes.filter((d) => d.status === "INVESTIGATING").length,
      ACTION_REQUIRED: disputes.filter((d) => d.status === "ACTION_REQUIRED").length,
      RESOLVED: disputes.filter((d) => d.status === "RESOLVED").length,
      CLOSED: disputes.filter((d) => d.status === "CLOSED").length,
    };
  }, [disputes]);

  // Filtering
  const filteredQueue = useMemo(() => {
    return disputes
      .filter((item) => {
        // Status filter
        if (statusFilter !== "ALL" && item.status !== statusFilter) {
          return false;
        }

        // Search Query filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          item.docketNumber.toLowerCase().includes(q) ||
          item.vehicle.vin.toLowerCase().includes(q) ||
          item.vehicle.make.toLowerCase().includes(q) ||
          item.vehicle.model.toLowerCase().includes(q) ||
          item.seller.name.toLowerCase().includes(q) ||
          item.dealership.name.toLowerCase().includes(q) ||
          item.allegationSummary.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "NEWEST") {
          return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
        }
        if (sortBy === "ADJUSTMENT_DESC") {
          return b.disputedAdjustmentCents - a.disputedAdjustmentCents;
        }
        if (sortBy === "AGREED_DESC") {
          return b.agreedBidCents - a.agreedBidCents;
        }
        return 0;
      });
  }, [disputes, statusFilter, searchQuery, sortBy]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Direct-Canvas Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-portal-text-muted mb-1">
          <Scale className="w-3.5 h-3.5 text-portal-primary" />
          <span>Arbitration &amp; Escrow Mediation</span>
          <span>•</span>
          <span>Post-Inspection Settlement Cases</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
          Post-Inspection Dispute Management Queue
        </h1>
        <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl font-body">
          Review condition discrepancies, unexpected hoist inspection damage claims, and escrow release adjustments between Canadian sellers and verified dealerships.
        </p>
      </div>

      {/* 2. Structured Operational Metric Cards (Side-by-Side Prominent Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Under Investigation */}
        <div
          onClick={() => setStatusFilter("INVESTIGATING")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "INVESTIGATING"
              ? "bg-portal-surface border-amber-500/60 shadow-xs ring-1 ring-amber-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Under Investigation
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Active mediation dockets
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-500">
              {counts.INVESTIGATING}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Ongoing Cases</span>
          </div>
        </div>

        {/* Metric 2: Action Required / Escalated */}
        <div
          onClick={() => setStatusFilter("ACTION_REQUIRED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "ACTION_REQUIRED"
              ? "bg-portal-surface border-portal-primary/60 shadow-xs ring-1 ring-portal-primary/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-portal-primary/10 border border-portal-primary/20 text-portal-primary flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Action Required
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Escalated hoist findings
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {counts.ACTION_REQUIRED}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Priority Review</span>
          </div>
        </div>

        {/* Metric 3: Resolved Disputes */}
        <div
          onClick={() => setStatusFilter("RESOLVED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "RESOLVED"
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
                Resolved Disputes
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Mutual escrow release
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {counts.RESOLVED}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Settled</span>
          </div>
        </div>

        {/* Metric 4: Total Incident Intake */}
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
              <Scale className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Total Incident Intake
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Historical arbitration dockets
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {counts.ALL}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Total Dockets</span>
          </div>
        </div>
      </div>

      {/* 3. Queue Controls Bar (Search, Filter Tabs, Sort & View Mode Toggle) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-portal-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docket, VIN, vehicle, seller, or dealership..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-portal-border bg-portal-surface text-portal-text placeholder:text-portal-text-muted text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/40 focus:border-portal-primary transition-all shadow-2xs font-body"
          />
        </div>

        {/* Filter Pills, Sort & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-portal-surface border border-portal-border shadow-2xs text-xs font-semibold">
            {[
              { id: "INVESTIGATING", label: "Investigating", count: counts.INVESTIGATING },
              { id: "ACTION_REQUIRED", label: "Action Required", count: counts.ACTION_REQUIRED },
              { id: "RESOLVED", label: "Resolved", count: counts.RESOLVED },
              { id: "ALL", label: "All", count: counts.ALL },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-portal-surface-hover text-portal-text font-bold shadow-2xs"
                      : "text-portal-text-muted hover:text-portal-text"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      active
                        ? "bg-portal-primary text-white"
                        : "bg-portal-border text-portal-text-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-portal-surface border border-portal-border text-xs font-semibold text-portal-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-portal-primary/40 shadow-2xs"
            >
              <option value="NEWEST">Newest Opened</option>
              <option value="ADJUSTMENT_DESC">Adjustment: High to Low</option>
              <option value="AGREED_DESC">Agreed Bid: High to Low</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-portal-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-portal-surface border border-portal-border shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "LIST"
                  ? "bg-portal-surface-hover text-portal-text"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "GRID"
                  ? "bg-portal-surface-hover text-portal-text"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Queue Content: Empty State */}
      {filteredQueue.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-portal-border bg-portal-surface">
          <Scale className="w-12 h-12 mx-auto text-portal-text-muted opacity-30 mb-3" />
          <h3 className="font-headline font-bold text-base text-portal-text">
            No incident dockets match current filters
          </h3>
          <p className="text-xs text-portal-text-muted mt-1 max-w-sm mx-auto font-body">
            Try adjusting your search terms or changing the status filter tab above.
          </p>
        </div>
      ) : viewMode === "LIST" ? (
        /* 5A. Refined List View (Clean SaaS Ergonomics, Scannable & Structured) */
        <div className="space-y-3">
          {filteredQueue.map((item) => {
            const brandLogo = CAR_BRAND_LOGOS[item.vehicle.make.toLowerCase()];
            const brandMonogram =
              item.vehicle.make.length <= 4
                ? item.vehicle.make.toUpperCase()
                : item.vehicle.make.slice(0, 3).toUpperCase();

            return (
              <div
                key={item.id}
                className="group p-4 sm:p-5 rounded-2xl border border-portal-border bg-portal-surface hover:border-portal-primary/40 hover:shadow-xs transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left Side: Photo Thumbnail & Structured Vehicle Dossier */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  {/* Photo Thumbnail */}
                  <Link
                    href={`/admin/disputes/${item.id}`}
                    className="relative w-28 sm:w-36 aspect-16/10 rounded-xl overflow-hidden bg-portal-surface-hover border border-portal-border shrink-0 block cursor-pointer group/thumb"
                  >
                    <Image
                      src={item.vehicle.thumbnailUrl}
                      alt={`${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                    />
                    <div className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10">
                      {item.vehicle.photos.length} Photos
                    </div>
                  </Link>

                  {/* Primary Info: 3 Clean Visual Levels */}
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Level 1: Brand + Heading + Trim + Docket & Soft Status Pill */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Automaker Monogram / Logo */}
                      <div className="w-6 h-6 rounded-md bg-portal-surface-hover border border-portal-border flex items-center justify-center shrink-0">
                        {brandLogo ? (
                          <div className="relative w-4 h-4">
                            <Image
                              src={brandLogo}
                              alt={item.vehicle.make}
                              fill
                              className="object-contain dark:brightness-0 dark:invert"
                            />
                          </div>
                        ) : (
                          <span className="font-headline font-black text-[10px] text-portal-text">
                            {brandMonogram}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/admin/disputes/${item.id}`}
                        className="font-headline font-bold text-base sm:text-lg text-portal-text hover:text-portal-primary transition-colors truncate"
                      >
                        {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                      </Link>

                      {item.vehicle.trim && (
                        <span className="text-xs text-portal-text-muted hidden sm:inline">
                          • {item.vehicle.trim}
                        </span>
                      )}

                      {/* Docket ID */}
                      <span className="font-mono text-[11px] font-semibold text-portal-text-muted bg-portal-surface-hover/80 px-2 py-0.5 rounded border border-portal-border/60">
                        {item.docketNumber}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          item.status === "RESOLVED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                            : item.status === "ACTION_REQUIRED"
                            ? "bg-red-500/10 text-red-500 border border-red-500/25"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                        }`}
                      >
                        {item.status === "ACTION_REQUIRED"
                          ? "Action Required"
                          : item.status === "INVESTIGATING"
                          ? "Under Review"
                          : item.status}
                      </span>
                    </div>

                    {/* Level 2: Clean Category Alert Chip + Allegation Excerpt */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{item.categoryLabel}</span>
                      </span>
                      <span className="text-xs text-portal-text-muted line-clamp-1 italic">
                        &ldquo;{item.allegationSummary}&rdquo;
                      </span>
                    </div>

                    {/* Level 3: Micro-Chips for Parties & Mechanical Vitals */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                      {/* Seller Chip */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-portal-surface-hover/70 border border-portal-border/60 text-portal-text">
                        <User className="w-3.5 h-3.5 text-portal-text-muted shrink-0" />
                        <span className="font-semibold text-xs">{item.seller.name}</span>
                        <span className="text-[11px] text-portal-text-muted">
                          ({item.seller.city}, {item.seller.province})
                        </span>
                      </div>

                      <span className="text-[10px] font-black text-portal-text-muted/60 uppercase">vs</span>

                      {/* Dealership Chip */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-portal-surface-hover/70 border border-portal-border/60 text-portal-text">
                        <Building2 className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                        <span className="font-semibold text-xs">{item.dealership.name}</span>
                        <span className="text-[11px] text-portal-text-muted font-mono">
                          ({item.dealership.licenseNumber})
                        </span>
                      </div>

                      <span className="text-portal-border">•</span>

                      {/* Mileage */}
                      <span className="font-mono text-[11px] text-portal-text-muted">
                        {item.vehicle.mileageKm.toLocaleString()} km
                      </span>

                      <span className="text-portal-border">•</span>

                      {/* Compact VIN with Copy */}
                      <div className="inline-flex items-center gap-1 font-mono text-[11px] text-portal-text-muted">
                        <span>VIN ···{item.vehicle.vin.slice(-6)}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.vehicle.vin, item.id)}
                          className="hover:text-portal-text p-0.5 rounded cursor-pointer"
                          title="Copy VIN"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Claimed Adjustment, Settlement Context & Review Action */}
                <div className="flex sm:items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-portal-border/60 shrink-0">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] uppercase font-bold text-portal-text-muted tracking-wider block">
                      Disputed Adjustment
                    </span>
                    <span className="font-headline text-2xl font-black text-amber-500 tracking-tight block mt-0.5">
                      -{formatCadCents(item.disputedAdjustmentCents)}
                    </span>
                    <span className="text-[11px] text-portal-text-muted block mt-0.5 font-medium">
                      Agreed: {formatCadCents(item.agreedBidCents)} • {item.openedDateFormatted}
                    </span>
                  </div>

                  {/* Primary Review Action Button */}
                  <Link
                    href={`/admin/disputes/${item.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-portal-surface hover:bg-portal-primary hover:text-white border border-portal-border text-portal-text font-headline font-bold text-xs sm:text-sm transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0 group/btn"
                  >
                    <span>Review Docket</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 5B. Signature Notched Card Grid View (Clean SaaS Grid) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQueue.map((item) => {
            const brandLogo = CAR_BRAND_LOGOS[item.vehicle.make.toLowerCase()];
            const brandMonogram =
              item.vehicle.make.length <= 4
                ? item.vehicle.make.toUpperCase()
                : item.vehicle.make.slice(0, 3).toUpperCase();

            return (
              <div
                key={item.id}
                className="group relative bg-portal-surface rounded-tl-[32px] rounded-tr-[32px] rounded-bl-[32px] rounded-br-none p-5 transition-all duration-300 flex flex-col justify-between border border-portal-border hover:-translate-y-1 hover:shadow-lg"
              >
                {/* 1. Top Header Row: Automotive Identity & Status Pill */}
                <div className="flex items-center justify-between gap-3 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-portal-surface-hover border border-portal-border flex items-center justify-center shrink-0 shadow-2xs">
                      {brandLogo ? (
                        <div className="relative w-5 h-5">
                          <Image
                            src={brandLogo}
                            alt={item.vehicle.make}
                            fill
                            className="object-contain dark:brightness-0 dark:invert"
                          />
                        </div>
                      ) : (
                        <span className="font-headline font-black text-xs tracking-wider text-portal-text">
                          {brandMonogram}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-headline text-[15px] font-bold text-portal-text tracking-tight truncate group-hover:text-portal-primary transition-colors leading-snug">
                        {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                      </h3>
                      <p className="font-body text-[11px] text-portal-text-muted truncate mt-0.5">
                        {item.docketNumber} • {item.seller.city}, {item.seller.province}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase shrink-0 whitespace-nowrap ${
                      item.status === "RESOLVED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                        : item.status === "ACTION_REQUIRED"
                        ? "bg-red-500/10 text-red-500 border border-red-500/25"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                    }`}
                  >
                    {item.status === "ACTION_REQUIRED" ? "Action Req" : item.status === "INVESTIGATING" ? "Under Review" : item.status}
                  </span>
                </div>

                {/* 2. Vehicle Photo Canvas (16/10 aspect ratio with link) */}
                <Link
                  href={`/admin/disputes/${item.id}`}
                  className="relative h-48 sm:h-52 w-full rounded-[22px] overflow-hidden bg-portal-surface-hover border border-portal-border shrink-0 block cursor-pointer group/photo"
                >
                  <Image
                    src={item.vehicle.thumbnailUrl}
                    alt={`${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                    className="object-cover transition-transform duration-500 ease-out group-hover/photo:scale-105"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-lg border border-white/10">
                    {item.vehicle.photos.length} Evidence Photos
                  </div>
                </Link>

                {/* 3. Card Content Body: Clean Vitals */}
                <div className="pt-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs font-body">
                    {/* Category Chip */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{item.categoryLabel}</span>
                    </div>

                    <p className="text-[11px] text-portal-text-muted line-clamp-2 leading-relaxed italic">
                      &ldquo;{item.allegationSummary}&rdquo;
                    </p>

                    {/* Parties Line */}
                    <div className="flex items-center justify-between text-[11px] text-portal-text-muted pt-1 border-t border-portal-border/40">
                      <span className="truncate max-w-[120px] font-medium">{item.seller.name}</span>
                      <span className="text-[10px] font-bold text-portal-text-muted/60 uppercase">vs</span>
                      <span className="font-semibold text-portal-text truncate max-w-[140px]">{item.dealership.name}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-portal-border my-3" />

                  {/* Bottom Financial Telemetry & Concave Notch Action Dock */}
                  <div className="pt-1 flex items-end justify-between min-h-[58px]">
                    <div className="flex flex-col justify-end max-w-[calc(100%-80px)] pr-2">
                      <div className="text-[10px] uppercase font-bold text-portal-text-muted leading-tight">
                        Disputed Adjustment
                      </div>
                      <div className="font-headline text-xl sm:text-2xl font-black text-amber-500 tracking-tight whitespace-nowrap mt-0.5">
                        -{formatCadCents(item.disputedAdjustmentCents)}
                      </div>
                      <div className="text-[11px] text-portal-text-muted flex items-center gap-1 mt-0.5 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Opened {item.openedDateFormatted}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Docked Concave Corner Notch & Action Squircle Button */}
                <div className="absolute -bottom-[1px] -right-[1px] z-20 pointer-events-auto">
                  <div className="relative w-[78px] h-[78px] bg-portal-canvas rounded-tl-[26px] border-t border-l border-portal-border flex items-center justify-center">
                    {/* Top Concave Fillet Curve */}
                    <svg
                      viewBox="0 0 20 20"
                      className="w-5 h-5 absolute -top-5 right-0 pointer-events-none overflow-visible"
                    >
                      <path
                        d="M 20,0 A 20 20 0 0 1 0,20 L 20,20 Z"
                        className="fill-portal-canvas"
                      />
                      <path
                        d="M 20,0 A 20 20 0 0 1 0,20"
                        fill="none"
                        stroke="currentColor"
                        className="text-portal-border"
                        strokeWidth="1"
                      />
                    </svg>

                    {/* Left Concave Fillet Curve (Smooth Outward Transition) */}
                    <svg
                      viewBox="0 0 20 20"
                      className="w-5 h-5 absolute bottom-0 -left-5 pointer-events-none overflow-visible"
                    >
                      <path
                        d="M 0,20 A 20 20 0 0 0 20,0 L 20,20 Z"
                        className="fill-portal-canvas"
                      />
                      <path
                        d="M 0,20 A 20 20 0 0 0 20,0"
                        fill="none"
                        stroke="currentColor"
                        className="text-portal-border"
                        strokeWidth="1"
                      />
                    </svg>

                    {/* Action Squircle Button */}
                    <Link
                      href={`/admin/disputes/${item.id}`}
                      className="w-[52px] h-[52px] rounded-[18px] bg-portal-surface hover:bg-portal-primary hover:text-white border border-portal-border flex items-center justify-center transition-all group-hover:scale-105 shadow-2xs cursor-pointer text-portal-text"
                      aria-label={`Review dispute for ${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`}
                    >
                      <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
