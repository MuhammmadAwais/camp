"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Car,
  X,
  ArrowRight,
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
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import {
  INITIAL_MODERATION_QUEUE,
  type ModerationItem,
} from "@/lib/mock/admin-moderation";

export function ListingModerationView() {
  const [queue, setQueue] = useState<ModerationItem[]>(INITIAL_MODERATION_QUEUE);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "EDITS_REQUESTED" | "APPROVED">("PENDING");
  const [sortBy, setSortBy] = useState<"NEWEST" | "RESERVE_DESC" | "MILEAGE_ASC">("NEWEST");
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
      {/* 1. Header (Clean, Institutional, Zero Clutter) */}
      <div className="border-b border-portal-border pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-portal-text tracking-tight">
          Listing Moderation Queue
        </h1>
        <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl">
          Review vehicle odometer clarity, NHTSA decoded specs, title liens, and condition disclosures before launching 24h dealer auctions.
        </p>
      </div>

      {/* 2. Structured Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Verification */}
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === "PENDING"
              ? "bg-portal-surface border-amber-500/50 shadow-xs ring-1 ring-amber-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-portal-text-muted">
              Pending Verification
            </span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-amber-500">
              {counts.PENDING}
            </span>
            <span className="text-xs text-portal-text-muted">Submissions</span>
          </div>
          <p className="text-[11px] text-portal-text-muted mt-1">
            Awaiting initial compliance inspection
          </p>
        </div>

        {/* Card 2: Action Required */}
        <div
          onClick={() => setStatusFilter("EDITS_REQUESTED")}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === "EDITS_REQUESTED"
              ? "bg-portal-surface border-portal-primary/50 shadow-xs ring-1 ring-portal-primary/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-portal-text-muted">
              Action Required
            </span>
            <AlertTriangle className="w-4 h-4 text-portal-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-portal-text">
              {counts.EDITS_REQUESTED}
            </span>
            <span className="text-xs text-portal-text-muted">Active</span>
          </div>
          <p className="text-[11px] text-portal-text-muted mt-1">
            Corrections requested from seller
          </p>
        </div>

        {/* Card 3: Approved & Live */}
        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === "APPROVED"
              ? "bg-portal-surface border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-portal-text-muted">
              Approved Today
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {counts.APPROVED}
            </span>
            <span className="text-xs text-portal-text-muted">Auctions</span>
          </div>
          <p className="text-[11px] text-portal-text-muted mt-1">
            Live on 24h dealer wholesale floor
          </p>
        </div>

        {/* Card 4: Total Queue Volume */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-portal-surface border-portal-primary/50 shadow-xs ring-1 ring-portal-primary/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-portal-text-muted">
              Total Intake
            </span>
            <Car className="w-4 h-4 text-portal-text-muted" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-portal-text">
              {counts.ALL}
            </span>
            <span className="text-xs text-portal-text-muted">Total Listings</span>
          </div>
          <p className="text-[11px] text-portal-text-muted mt-1">
            All consumer vehicle submissions
          </p>
        </div>
      </div>

      {/* 3. Queue Controls Bar (Search, Filter Tabs & Sort) */}
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

        {/* Filter Tabs & Sort Selector */}
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
        </div>
      </div>

      {/* 4. Full-Width Moderation Queue List */}
      <div className="space-y-3">
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
        ) : (
          filteredQueue.map((item) => {
            const hasLien = item.vehicle.lienDisclosed;

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl border border-portal-border bg-portal-surface hover:border-portal-primary/40 transition-all shadow-2xs hover:shadow-xs group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Thumbnail & Core Vehicle Spec */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                    <div className="relative w-28 sm:w-32 aspect-16/10 rounded-xl overflow-hidden bg-portal-surface-hover border border-portal-border shrink-0">
                      <Image
                        src={item.vehicle.thumbnailUrl}
                        alt={item.vehicle.model}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 112px, 128px"
                      />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                        {item.vehicle.photosCount} Photos
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
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
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-portal-text-muted pt-1">
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

                  {/* Right: Reserve Target, Submission Time & CTA Button */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-portal-border">
                    <div className="text-left lg:text-right space-y-0.5">
                      <div className="text-[10px] uppercase font-semibold text-portal-text-muted">
                        Seller Reserve Target
                      </div>
                      <div className="font-mono text-lg sm:text-xl font-bold text-portal-text">
                        {formatCadCents(item.vehicle.reservePriceCents)}
                      </div>
                      <div className="text-[11px] text-portal-text-muted flex items-center gap-1 lg:justify-end">
                        <Clock className="w-3 h-3" />
                        <span>Submitted {item.submittedAt}</span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/moderation/${item.id}`}
                      className="px-4 py-2.5 rounded-xl bg-portal-surface-hover hover:bg-portal-primary hover:text-white border border-portal-border text-xs font-semibold text-portal-text transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer group-hover:border-portal-primary"
                    >
                      <span>Review Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
