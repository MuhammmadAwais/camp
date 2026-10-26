"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Car,
  X,
  ArrowRight,
  ArrowUpRight,
  Search,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  MapPin,
  ExternalLink,
  LayoutGrid,
  List,
  Layers,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import {
  INITIAL_MODERATION_QUEUE,
  type ModerationItem,
} from "@/lib/mock/admin-moderation";

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
};

export function ListingModerationView() {
  const [queue, setQueue] = useState<ModerationItem[]>(INITIAL_MODERATION_QUEUE);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "EDITS_REQUESTED" | "APPROVED">("PENDING");
  const [sortBy, setSortBy] = useState<"NEWEST" | "RESERVE_DESC" | "MILEAGE_ASC">("NEWEST");
  const [viewMode, setViewMode] = useState<"LIST" | "GRID">("LIST");
  const [copiedVin, setCopiedVin] = useState<string | null>(null);

  // Status Counts
  const counts = useMemo(() => {
    return {
      ALL: queue.length,
      PENDING: queue.filter((i) => i.status === "PENDING").length,
      EDITS_REQUESTED: queue.filter((i) => i.status === "EDITS_REQUESTED").length,
      APPROVED: queue.filter((i) => i.status === "APPROVED").length,
    };
  }, [queue]);

  // Filter & Sort Queue
  const filteredQueue = useMemo(() => {
    return queue
      .filter((item) => {
        // Status filter
        if (statusFilter !== "ALL" && item.status !== statusFilter) {
          return false;
        }

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const makeModel = `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model} ${item.vehicle.trim}`.toLowerCase();
        const vin = item.vehicle.vin.toLowerCase();
        const seller = `${item.seller.name} ${item.seller.city} ${item.seller.province}`.toLowerCase();
        return makeModel.includes(q) || vin.includes(q) || seller.includes(q);
      })
      .sort((a, b) => {
        if (sortBy === "RESERVE_DESC") {
          return b.vehicle.reservePriceCents - a.vehicle.reservePriceCents;
        }
        if (sortBy === "MILEAGE_ASC") {
          return a.vehicle.mileageKm - b.vehicle.mileageKm;
        }
        return 0; // NEWEST default
      });
  }, [queue, statusFilter, searchQuery, sortBy]);

  const copyVinToClipboard = (vin: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(vin);
    setCopiedVin(vin);
    setTimeout(() => setCopiedVin(null), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header (Clean, Institutional) */}
      <div className="border-b border-portal-border pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-portal-text tracking-tight">
          Listing Moderation Queue
        </h1>
        <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl">
          Review vehicle odometer clarity, NHTSA decoded specs, title liens, and condition disclosures before launching 24h dealer auctions.
        </p>
      </div>

      {/* 2. Structured Operational Metric Cards (Equalized Icons, Typography & Headings) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Verification */}
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "PENDING"
              ? "bg-portal-surface border-amber-500/60 shadow-xs ring-1 ring-amber-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          {/* Side-by-Side: Equalized Prominent Icon & Heading */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-portal-text leading-tight">
              Pending Verification
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-500">
              {counts.PENDING}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Submissions</span>
          </div>
          <p className="text-[11px] text-portal-text-muted mt-1 truncate">
            Awaiting initial compliance inspection
          </p>
        </div>

        {/* Card 2: Action Required */}
        <div
          onClick={() => setStatusFilter("EDITS_REQUESTED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "EDITS_REQUESTED"
              ? "bg-portal-surface border-portal-primary/60 shadow-xs ring-1 ring-portal-primary/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          {/* Side-by-Side: Equalized Prominent Icon & Heading */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-portal-primary/10 border border-portal-primary/20 text-portal-primary flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-portal-text leading-tight">
              Action Required
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {counts.EDITS_REQUESTED}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Active</span>
          </div>
          <p className="text-[11px] text-portal-text-muted mt-1 truncate">
            Corrections requested from seller
          </p>
        </div>

        {/* Card 3: Approved Today */}
        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "APPROVED"
              ? "bg-portal-surface border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          {/* Side-by-Side: Equalized Prominent Icon & Heading */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-portal-text leading-tight">
              Approved Today
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {counts.APPROVED}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Auctions</span>
          </div>
          <p className="text-[11px] text-portal-text-muted mt-1 truncate">
            Live on 24h dealer wholesale floor
          </p>
        </div>

        {/* Card 4: Total Intake */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "ALL"
              ? "bg-portal-surface border-portal-primary/60 shadow-xs ring-1 ring-portal-primary/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          {/* Side-by-Side: Equalized Prominent Icon & Heading */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-portal-surface-hover border border-portal-border text-portal-text flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-portal-text leading-tight">
              Total Intake
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {counts.ALL}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Total Listings</span>
          </div>
          <p className="text-[11px] text-portal-text-muted mt-1 truncate">
            All consumer vehicle submissions
          </p>
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
            placeholder="Search by VIN, make, model, seller, or city..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-portal-surface border border-portal-border text-xs text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-portal-text-muted hover:text-portal-text p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs, Sort & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-portal-surface border border-portal-border text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "PENDING"
                  ? "bg-portal-surface-hover text-portal-text shadow-2xs font-bold"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
            >
              <span>Pending</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-500 font-bold">
                {counts.PENDING}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("EDITS_REQUESTED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "EDITS_REQUESTED"
                  ? "bg-portal-surface-hover text-portal-text shadow-2xs font-bold"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
            >
              <span>Corrections</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-portal-border text-portal-text font-bold">
                {counts.EDITS_REQUESTED}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "APPROVED"
                  ? "bg-portal-surface-hover text-portal-text shadow-2xs font-bold"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
            >
              <span>Approved</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                {counts.APPROVED}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-portal-surface-hover text-portal-text shadow-2xs font-bold"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
            >
              <span>All ({counts.ALL})</span>
            </button>
          </div>

          {/* Sort Menu */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 pl-3 pr-8 rounded-xl bg-portal-surface border border-portal-border text-xs text-portal-text focus:outline-none cursor-pointer appearance-none font-medium"
            >
              <option value="NEWEST">Newest First</option>
              <option value="RESERVE_DESC">Highest Reserve</option>
              <option value="MILEAGE_ASC">Lowest Mileage</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-portal-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Mode Toggle (List vs. Notched Grid) */}
          <div className="flex items-center p-1 rounded-xl bg-portal-surface border border-portal-border text-xs">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "LIST"
                  ? "bg-portal-surface-hover text-portal-text shadow-2xs"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "GRID"
                  ? "bg-portal-surface-hover text-portal-text shadow-2xs"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
              title="Notched Grid View"
              aria-label="Notched Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Listings Display (List View OR Signature Notched Grid View) */}
      {filteredQueue.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-portal-border bg-portal-surface space-y-2">
          <Car className="w-10 h-10 text-portal-text-muted mx-auto opacity-40" />
          <div className="text-sm font-semibold text-portal-text">
            No vehicle submissions found
          </div>
          <p className="text-xs text-portal-text-muted max-w-sm mx-auto">
            No pending listings match the selected filters or search criteria.
          </p>
        </div>
      ) : viewMode === "LIST" ? (
        /* ======================================================== */
        /* VIEW MODE A: REFINED FULL-WIDTH LIST ROWS               */
        /* ======================================================== */
        <div className="space-y-3">
          {filteredQueue.map((item) => {
            const hasLien = item.vehicle.lienDisclosed;
            const brandLogo = CAR_BRAND_LOGOS[item.vehicle.make.toLowerCase()];
            const brandMonogram =
              item.vehicle.make.length <= 4
                ? item.vehicle.make.toUpperCase()
                : item.vehicle.make.slice(0, 3).toUpperCase();

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl border border-portal-border bg-portal-surface hover:border-portal-primary/40 transition-all shadow-2xs hover:shadow-xs group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Thumbnail & Core Specs */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                    <div className="relative w-28 sm:w-32 aspect-16/10 rounded-xl overflow-hidden bg-portal-surface-hover border border-portal-border shrink-0">
                      <Image
                        src={item.vehicle.thumbnailUrl}
                        alt={item.vehicle.model}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 112px, 128px"
                      />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                        {item.vehicle.photosCount} Photos
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1.5 flex-1">
                      {/* Vehicle Title with Brand Monogram & Status Badge */}
                      <div className="flex flex-wrap items-center gap-2.5">
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
                            <span className="font-headline font-black text-[9px] tracking-wider text-portal-text">
                              {brandMonogram}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold font-headline text-portal-text group-hover:text-portal-primary transition-colors truncate">
                          {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                        </h3>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
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

                      <p className="text-xs text-portal-text-muted truncate">
                        {item.vehicle.trim}
                        {item.vehicle.engineSpec && ` • ${item.vehicle.engineSpec}`}
                      </p>

                      {/* Attribute Pills / Indicators */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-portal-text-muted pt-0.5">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span>VIN:</span>
                          <span className="font-bold text-portal-text">{item.vehicle.vin}</span>
                          <button
                            type="button"
                            onClick={(e) => copyVinToClipboard(item.vehicle.vin, e)}
                            className="p-0.5 rounded hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text transition-colors cursor-pointer"
                            title="Copy VIN"
                          >
                            {copiedVin === item.vehicle.vin ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        <span>•</span>
                        <span className="font-mono">{item.vehicle.mileageKm.toLocaleString()} km</span>

                        <span>•</span>
                        <span>{item.vehicle.drivetrain}</span>

                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-portal-text-muted" />
                          <span>{item.seller.city}, {item.seller.province}</span>
                        </span>

                        <span>•</span>
                        <span
                          className={`font-medium ${
                            hasLien
                              ? "text-amber-500"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {hasLien ? "Active Lien Declared" : "Lien Free"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Reserve Target, Submission Time & Equal Action Button */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-portal-border">
                    <div className="text-left lg:text-right space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-portal-text-muted">
                        Seller Reserve Target
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-black text-portal-text">
                        {formatCadCents(item.vehicle.reservePriceCents)}
                      </div>
                      <div className="text-[11px] text-portal-text-muted flex items-center gap-1 lg:justify-end font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Submitted {item.submittedAt}</span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/moderation/${item.id}`}
                      className="h-10 px-5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs hover:shadow-md cursor-pointer shrink-0"
                    >
                      <span>Review Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ======================================================== */
        /* VIEW MODE B: SIGNATURE NOTCHED GRID CARDS (LIKE IMAGE 3) */
        /* ======================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQueue.map((item) => {
            const hasLien = item.vehicle.lienDisclosed;
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
                {/* Masked Ambient Shadow: Excises bottom-right corner for clean notch transparency */}
                <div
                  className="absolute inset-0 rounded-tl-[32px] rounded-tr-[32px] rounded-bl-[32px] rounded-br-none pointer-events-none -z-10 shadow-[0_4px_20px_rgba(0,0,0,0.05)] group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] transition-shadow duration-300"
                  style={{
                    maskImage:
                      "radial-gradient(circle at bottom right, transparent 0, transparent 90px, black 125px)",
                    WebkitMaskImage:
                      "radial-gradient(circle at bottom right, transparent 0, transparent 90px, black 125px)",
                  }}
                />

                {/* 1. Top Header Row: Balanced Automotive Identity & Status Pill */}
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
                        {item.vehicle.trim ? `${item.vehicle.trim} • ` : ""}
                        {item.seller.city}, {item.seller.province}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 whitespace-nowrap ${
                      item.status === "APPROVED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                        : item.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                        : "bg-red-500/10 text-red-500 border border-red-500/25"
                    }`}
                  >
                    {item.status === "EDITS_REQUESTED" ? "Corrections" : item.status}
                  </span>
                </div>

                {/* 2. Vehicle Photo Canvas (Clean 16/10 aspect ratio with link) */}
                <Link
                  href={`/admin/moderation/${item.id}`}
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
                    {item.vehicle.photosCount} Photos
                  </div>
                </Link>

                {/* 3. Card Content Body: Moderation Vitals */}
                <div className="pt-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs font-body">
                    {/* Key Specs Row */}
                    <div className="flex items-center gap-2 font-semibold text-portal-text whitespace-nowrap overflow-hidden">
                      <span>{item.vehicle.mileageKm.toLocaleString()} km</span>
                      <span className="text-portal-border font-normal">•</span>
                      <span>{item.vehicle.transmission.split(" ")[0]}</span>
                      <span className="text-portal-border font-normal">•</span>
                      <span>{item.vehicle.drivetrain}</span>
                    </div>

                    {/* VIN & Title Status */}
                    <div className="flex items-center gap-1.5 text-[11px] text-portal-text-muted truncate">
                      <span>VIN: ···{item.vehicle.vin.slice(-6)}</span>
                      <span className="text-portal-border font-normal">•</span>
                      <span
                        className={`font-semibold ${
                          hasLien
                            ? "text-amber-500"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {hasLien ? "Active Lien" : "Lien Free"}
                      </span>
                      <span className="text-portal-border font-normal">•</span>
                      <span>Grade {item.vehicle.damageGrade}</span>
                    </div>

                    {/* Seller Identification */}
                    <div className="text-[11px] text-portal-text-muted truncate">
                      Seller: <span className="font-semibold text-portal-text">{item.seller.name}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-portal-border my-3" />

                  {/* Bottom Reserve Telemetry & Concave Notch Action Dock */}
                  <div className="pt-1 flex items-end justify-between min-h-[58px]">
                    <div className="flex flex-col justify-end max-w-[calc(100%-80px)] pr-2">
                      <div className="text-[10px] uppercase font-bold text-portal-text-muted leading-tight">
                        Seller Reserve Target
                      </div>
                      <div className="font-headline text-xl sm:text-2xl font-black text-portal-text tracking-tight whitespace-nowrap mt-0.5">
                        {formatCadCents(item.vehicle.reservePriceCents)}
                      </div>
                      <div className="text-[11px] text-portal-text-muted flex items-center gap-1 mt-0.5 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Submitted {item.submittedAt}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Docked Concave Corner Notch & Action Squircle Button (Image 3 Style) */}
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

                    {/* Left Concave Fillet Curve (Smooth Outward Pocket Transition) */}
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
                      href={`/admin/moderation/${item.id}`}
                      className="w-[52px] h-[52px] rounded-[18px] bg-portal-surface hover:bg-portal-primary hover:text-white border border-portal-border flex items-center justify-center transition-all group-hover:scale-105 shadow-2xs cursor-pointer text-portal-text"
                      aria-label={`Review ${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`}
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
