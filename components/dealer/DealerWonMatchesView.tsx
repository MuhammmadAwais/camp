"use client";

import React, { useState } from "react";
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
  XCircle,
  Building2,
  ExternalLink,
  ChevronDown,
  DollarSign,
  ShieldCheck,
  Printer,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";

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
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      damageGrade: "B",
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
    inspectionNotes: "Physical inspection passed. Both sets of keys received. Bill of Sale signed and EFT payout issued to seller.",
  },
];

export function DealerWonMatchesView() {
  const [matches, setMatches] = useState<WonMatchItem[]>(INITIAL_WON_MATCHES);
  const [editingMatch, setEditingMatch] = useState<WonMatchItem | null>(null);
  const [newStatus, setNewStatus] = useState<WonMatchStatus>("COMPLETED");
  const [finalPriceInput, setFinalPriceInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-bold font-mono uppercase tracking-wider border border-emerald-500/20">
              Post-Auction Fulfillment
            </span>
            <span className="text-xs text-portal-text-muted font-mono">
              Pfaff Porsche (OMVIC-481920)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-portal-text font-headline tracking-tight">
            Won Matches & Physical Handover
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Unsealed seller appointments, verification QR passes, and offline vehicle inspection outcome logging.
          </p>
        </div>

        {/* Success Counter */}
        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-xl bg-portal-surface-hover border border-portal-border text-right font-mono">
            <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
              Completed Handover Value
            </span>
            <span className="text-xl font-black text-emerald-500">
              {formatCadCents(
                matches
                  .filter((m) => m.status === "COMPLETED")
                  .reduce((acc, m) => acc + (m.finalTransactionCents ?? 0), 0)
              )}
            </span>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Inspection log updated successfully for voucher #{saveSuccess}.</span>
        </div>
      )}

      {/* Won Matches List */}
      <div className="space-y-6">
        {matches.map((match) => {
          const isPendingInspection = match.status === "APPOINTMENT_CONFIRMED";

          return (
            <div
              key={match.id}
              className="rounded-2xl border border-portal-border bg-portal-surface overflow-hidden shadow-xs"
            >
              {/* Header Bar */}
              <div className="p-4 sm:p-5 border-b border-portal-border bg-portal-surface-hover/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-portal-primary/10 text-portal-primary flex items-center justify-center border border-portal-primary/20 shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-portal-primary">
                        Voucher #{match.voucherCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          match.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : match.status === "APPOINTMENT_CONFIRMED"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {match.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-[11px] text-portal-text-muted font-mono">
                      Seller Accepted Offer on {match.wonAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
                      Agreed Wholesale Price
                    </span>
                    <span className="text-lg font-black text-portal-text">
                      {formatCadCents(match.acceptedBidAmountCents)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openInspectionModal(match)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-portal-primary hover:bg-portal-primary-hover text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Log Inspection Outcome
                  </button>
                </div>
              </div>

              {/* 3-Column Body Grid */}
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Vehicle Thumbnail & Specs (4 cols) */}
                <div className="md:col-span-4 flex items-start gap-4">
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-portal-surface-hover shrink-0 border border-portal-border">
                    <Image
                      src={match.vehicle.thumbnailUrl}
                      alt={match.vehicle.model}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-portal-text">
                      {match.vehicle.year} {match.vehicle.make} {match.vehicle.model}
                    </h3>
                    <p className="text-xs text-portal-text-muted">{match.vehicle.trim}</p>
                    <div className="text-[11px] font-mono text-portal-text-muted space-y-0.5 pt-1">
                      <div>VIN: {match.vehicle.vin}</div>
                      <div>Odometer: {match.vehicle.mileageKm.toLocaleString()} km</div>
                      <div>Condition: Grade {match.vehicle.damageGrade}</div>
                    </div>
                  </div>
                </div>

                {/* Unsealed Seller Contact Details (5 cols) */}
                <div className="md:col-span-5 p-4 rounded-xl bg-portal-surface-hover/70 border border-portal-border space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-portal-border">
                    <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-portal-text flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-portal-primary" />
                      Unsealed Seller Contact
                    </span>
                    <span className="text-[10px] text-emerald-500 font-mono font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      ID Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-portal-text-muted block">Legal Owner</span>
                      <span className="font-semibold text-portal-text">{match.seller.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-portal-text-muted block">Phone Number</span>
                      <a
                        href={`tel:${match.seller.phone}`}
                        className="font-mono text-portal-primary hover:underline font-medium"
                      >
                        {match.seller.phone}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] text-portal-text-muted block">Email Address</span>
                      <a
                        href={`mailto:${match.seller.email}`}
                        className="font-mono text-portal-primary hover:underline text-[11px] truncate block"
                      >
                        {match.seller.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] text-portal-text-muted block">Residence</span>
                      <span className="text-portal-text">
                        {match.seller.city}, {match.seller.province}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code & Voucher Pass (3 cols) */}
                <div className="md:col-span-3 p-4 rounded-xl bg-portal-surface-hover/40 border border-dashed border-portal-border flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-16 h-16 rounded-xl bg-portal-surface border border-portal-border flex items-center justify-center shadow-xs">
                    <QrCode className="w-10 h-10 text-portal-text" />
                  </div>
                  <span className="text-[10px] font-mono text-portal-text-muted uppercase">
                    Scan At Dealership Intake
                  </span>
                  <span className="text-xs font-mono font-bold text-portal-text">
                    Pass #{match.voucherCode}
                  </span>
                </div>
              </div>

              {/* Inspection Notes Footer */}
              {match.inspectionNotes && (
                <div className="px-5 py-3 border-t border-portal-border bg-portal-surface-hover/30 text-xs font-mono text-portal-text-muted flex items-start gap-2">
                  <FileCheck2 className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{match.inspectionNotes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inspection Outcome Modal */}
      {editingMatch && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingMatch(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-portal-border">
              <div>
                <h3 className="text-base font-bold text-portal-text">
                  Log Inspection & Settlement Outcome
                </h3>
                <p className="text-xs text-portal-text-muted font-mono">
                  Voucher #{editingMatch.voucherCode} • {editingMatch.vehicle.year}{" "}
                  {editingMatch.vehicle.make} {editingMatch.vehicle.model}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="text-portal-text-muted hover:text-portal-text p-1 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInspection} className="space-y-4">
              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">
                  Inspection & Handover Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as WonMatchStatus)}
                  className="w-full px-3 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-portal-primary cursor-pointer"
                >
                  <option value="APPOINTMENT_CONFIRMED">Appointment Scheduled / Confirmed</option>
                  <option value="COMPLETED">
                    Inspection Passed & Purchase Completed (Full Price)
                  </option>
                  <option value="RENEGOTIATED_LOWER">
                    Settled at Adjusted Price (Disclosed Undisclosed Damage)
                  </option>
                  <option value="NO_SHOW">Seller No-Show (48h Expired)</option>
                  <option value="DECLINED_AFTER_INSPECTION">
                    Declined Dealership Purchase (Severe Undisclosed Damage)
                  </option>
                </select>
              </div>

              {/* Final Settlement Price in CAD */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">
                  Final Transaction Amount (CAD Dollars)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-portal-text-muted text-xs">
                    $
                  </span>
                  <input
                    type="text"
                    value={finalPriceInput}
                    onChange={(e) => setFinalPriceInput(e.target.value)}
                    placeholder="38250.00"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text font-mono text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-portal-primary"
                  />
                </div>
                <span className="text-[10px] text-portal-text-muted font-mono">
                  Originally accepted offer: {formatCadCents(editingMatch.acceptedBidAmountCents)}
                </span>
              </div>

              {/* Inspection Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">
                  Technician / Hoist Inspection Notes & Settlement Rationale
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Hoist inspection complete. Front brake pads measured at 3mm, matched photos. Bill of Sale signed."
                  className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:outline-hidden focus:ring-2 focus:ring-portal-primary"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-portal-border">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="px-4 py-2 rounded-xl border border-portal-border text-xs font-medium text-portal-text-muted hover:text-portal-text transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save Settlement Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
