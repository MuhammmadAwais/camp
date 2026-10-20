"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";

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
    endsAt: new Date(Date.now() + (0 * 60 + 12) * 60 * 1000).toISOString(), // Sub-15min Crimson urgency state
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
    endsAt: new Date(Date.now() + (4 * 60 + 15) * 60 * 1000).toISOString(),
    thumbnailUrl:
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "auc-ford-f150-2021",
    vin: "1FTFW1E84MFA12345",
    year: 2021,
    make: "Ford",
    model: "F-150",
    trim: "Lariat 502A SuperCrew",
    sellerName: "Robert Kelly",
    city: "Vaughan",
    province: "ON",
    status: "ACTIVE",
    totalBidsCount: 8,
    reservePriceCents: 3400000,
    highestBidEstimateCents: 3250000,
    endsAt: new Date(Date.now() + (11 * 60 + 50) * 60 * 1000).toISOString(),
    thumbnailUrl:
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "auc-audi-q7-2021",
    vin: "WA1VAAF74KD019283",
    year: 2021,
    make: "Audi",
    model: "Q7",
    trim: "55 Progressiv quattro",
    sellerName: "Elena Rostova",
    city: "Richmond Hill",
    province: "ON",
    status: "ACCEPTED",
    totalBidsCount: 17,
    reservePriceCents: 4100000,
    highestBidEstimateCents: 4150000,
    endsAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    thumbnailUrl:
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
  },
];

export function AdminAuctionsView() {
  const [auctions, setAuctions] = useState<AdminAuctionLot[]>(INITIAL_AUCTION_LOTS);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLot, setSelectedLot] = useState<AdminAuctionLot | null>(null);
  const [overrideModalType, setOverrideModalType] = useState<"EXTEND" | "TERMINATE" | null>(null);
  const [extensionHours, setExtensionHours] = useState(2);
  const [overrideReason, setOverrideReason] = useState("");
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  const filteredLots = auctions.filter((lot) => {
    if (statusFilter !== "ALL" && lot.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        lot.vin.toLowerCase().includes(q) ||
        lot.make.toLowerCase().includes(q) ||
        lot.model.toLowerCase().includes(q) ||
        lot.sellerName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot || !overrideModalType) return;

    if (overrideModalType === "EXTEND") {
      const addedMs = extensionHours * 60 * 60 * 1000;
      setAuctions((prev) =>
        prev.map((lot) =>
          lot.id === selectedLot.id
            ? {
                ...lot,
                endsAt: new Date(new Date(lot.endsAt).getTime() + addedMs).toISOString(),
              }
            : lot
        )
      );
      setAlertNotice(
        `Auction ${selectedLot.id} extended by ${extensionHours} hours. Audit log logged: "${overrideReason}"`
      );
    } else if (overrideModalType === "TERMINATE") {
      setAuctions((prev) =>
        prev.map((lot) => (lot.id === selectedLot.id ? { ...lot, status: "CANCELLED" } : lot))
      );
      setAlertNotice(
        `Auction ${selectedLot.id} terminated immediately. Audit log logged: "${overrideReason}"`
      );
    }

    setOverrideModalType(null);
    setSelectedLot(null);
    setOverrideReason("");
    setTimeout(() => setAlertNotice(null), 5000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-xs font-bold font-mono uppercase tracking-wider border border-amber-500/20">
              Live Operations
            </span>
            <span className="text-xs text-portal-text-muted font-mono">
              Market Operations Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-portal-text font-headline tracking-tight">
            Auction Master Operations & Overrides
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Real-time emergency controls, 24h countdown clock extensions, and sealed-bid market surveillance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-xl bg-portal-surface-hover border border-portal-border text-right font-mono">
            <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
              Active Lots Live
            </span>
            <span className="text-xl font-black text-portal-text">
              {auctions.filter((a) => a.status === "ACTIVE").length} / {auctions.length}
            </span>
          </div>
        </div>
      </div>

      {alertNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{alertNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ACTIVE", "ACCEPTED", "CANCELLED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-portal-primary text-white"
                  : "bg-portal-surface-hover text-portal-text-muted hover:text-portal-text"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search VIN, Make, Model, Seller..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:outline-hidden focus:ring-2 focus:ring-portal-primary"
          />
        </div>
      </div>

      {/* Auction Master Table */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-portal-border bg-portal-surface-hover/70 font-mono text-[11px] uppercase tracking-wider text-portal-text-muted">
                <th className="p-4">Vehicle Lot</th>
                <th className="p-4">Seller & City</th>
                <th className="p-4">Status</th>
                <th className="p-4">Sealed Telemetry</th>
                <th className="p-4">Reserve (CAD)</th>
                <th className="p-4">Time Remaining</th>
                <th className="p-4 text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {filteredLots.map((lot) => {
                const msLeft = new Date(lot.endsAt).getTime() - Date.now();
                const hoursLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60)));
                const minsLeft = Math.max(0, Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60)));
                const isUrgent = msLeft > 0 && msLeft < 15 * 60 * 1000;

                return (
                  <tr key={lot.id} className="hover:bg-portal-surface-hover/50 transition-colors">
                    {/* Vehicle */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-portal-surface-hover shrink-0 border border-portal-border">
                          <Image
                            src={lot.thumbnailUrl}
                            alt={lot.model}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-portal-text block">
                            {lot.year} {lot.make} {lot.model}
                          </span>
                          <span className="text-[11px] font-mono text-portal-text-muted block">
                            VIN: {lot.vin}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="p-4 font-mono">
                      <span className="text-portal-text block font-medium">{lot.sellerName}</span>
                      <span className="text-[11px] text-portal-text-muted block">
                        {lot.city}, {lot.province}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase inline-block ${
                          lot.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : lot.status === "ACCEPTED"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {lot.status}
                      </span>
                    </td>

                    {/* Telemetry */}
                    <td className="p-4 font-mono">
                      <span className="text-portal-text font-bold block flex items-center gap-1">
                        <Lock className="w-3 h-3 text-portal-primary" />
                        {lot.totalBidsCount} sealed bids
                      </span>
                      {lot.highestBidEstimateCents && (
                        <span className="text-[11px] text-portal-text-muted block">
                          Top: {formatCadCents(lot.highestBidEstimateCents)}
                        </span>
                      )}
                    </td>

                    {/* Reserve */}
                    <td className="p-4 font-mono font-bold text-portal-text">
                      {formatCadCents(lot.reservePriceCents)}
                    </td>

                    {/* Time Left */}
                    <td className="p-4 font-mono">
                      {lot.status === "ACTIVE" ? (
                        <span
                          className={`flex items-center gap-1 font-bold ${
                            isUrgent ? "text-red-500 animate-pulse" : "text-portal-text"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {hoursLeft > 0 ? `${hoursLeft}h ` : ""}
                            {minsLeft}m left
                          </span>
                        </span>
                      ) : (
                        <span className="text-portal-text-muted">Auction Closed</span>
                      )}
                    </td>

                    {/* Override Actions */}
                    <td className="p-4 text-right">
                      {lot.status === "ACTIVE" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLot(lot);
                              setOverrideModalType("EXTEND");
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-[11px] font-mono transition-colors cursor-pointer"
                          >
                            + Time
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLot(lot);
                              setOverrideModalType("TERMINATE");
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-[11px] font-mono transition-colors cursor-pointer"
                          >
                            Kill
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-portal-text-muted">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Dialog Modal */}
      {overrideModalType && selectedLot && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setOverrideModalType(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-mono font-bold text-amber-500 uppercase">
                  Privileged Administrator Action
                </span>
              </div>
              <h3 className="text-base font-bold text-portal-text">
                {overrideModalType === "EXTEND"
                  ? "Extend 24h Auction Window"
                  : "Emergency Auction Termination"}
              </h3>
              <p className="text-xs text-portal-text-muted font-mono mt-0.5">
                Lot: {selectedLot.year} {selectedLot.make} {selectedLot.model} (VIN:{" "}
                {selectedLot.vin})
              </p>
            </div>

            <form onSubmit={handleConfirmOverride} className="space-y-4">
              {overrideModalType === "EXTEND" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-portal-text">
                    Extension Duration
                  </label>
                  <select
                    value={extensionHours}
                    onChange={(e) => setExtensionHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono"
                  >
                    <option value={1}>+1 Hour (Immediate technical glitch relief)</option>
                    <option value={2}>+2 Hours (Local weather or internet interruption)</option>
                    <option value={6}>+6 Hours (Major evening traffic delay)</option>
                    <option value={24}>+24 Hours (Full 1-day platform extension)</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">
                  Mandatory Compliance Audit Trail Justification
                </label>
                <textarea
                  rows={3}
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State the regulatory / technical reason for overriding this auction lot..."
                  className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:outline-hidden focus:ring-2 focus:ring-portal-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-portal-border">
                <button
                  type="button"
                  onClick={() => setOverrideModalType(null)}
                  className="px-4 py-2 rounded-xl border border-portal-border text-xs text-portal-text-muted hover:text-portal-text cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                    overrideModalType === "EXTEND"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
