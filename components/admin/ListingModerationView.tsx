"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Car,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  MapPin,
  Camera,
  Layers,
  Sparkles,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";

export type ModerationItem = {
  id: string;
  submittedAt: string;
  seller: {
    name: string;
    email: string;
    phone: string;
    city: string;
    province: string;
  };
  vehicle: {
    vin: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    mileageKm: number;
    transmission: string;
    drivetrain: string;
    reservePriceCents: number; // Integer CAD cents invariant
    damageGrade: string;
    damageHotspotCount: number;
    photosCount: number;
    thumbnailUrl: string;
    photos: string[];
    lienDisclosed: boolean;
    keysCount: number;
    sellerNotes: string;
  };
  checks: {
    vinDecoded: boolean;
    odometerLegible: boolean;
    damageMapped: boolean;
    ownershipVerified: boolean;
  };
  status: "PENDING" | "APPROVED" | "EDITS_REQUESTED" | "REJECTED";
};

const INITIAL_QUEUE: ModerationItem[] = [
  {
    id: "mod-corvette-z06-2023",
    submittedAt: "24 minutes ago",
    seller: {
      name: "Jean-Philippe Tremblay",
      email: "jp.tremblay@videotron.ca",
      phone: "+1 (514) 555-8932",
      city: "Laval",
      province: "QC",
    },
    vehicle: {
      vin: "1G1YC2D46P5104921",
      year: 2023,
      make: "Chevrolet",
      model: "Corvette",
      trim: "Z06 3LZ Coupe",
      mileageKm: 8900,
      transmission: "8-Speed Dual Clutch",
      drivetrain: "Rear-Wheel Drive (RWD)",
      reservePriceCents: 12500000, // $125,000.00
      damageGrade: "A",
      damageHotspotCount: 0,
      photosCount: 22,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      photos: [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=80",
      ],
      lienDisclosed: false,
      keysCount: 2,
      sellerNotes: "Single owner, carbon ceramic brakes package, PPF on full front clip.",
    },
    checks: {
      vinDecoded: true,
      odometerLegible: true,
      damageMapped: true,
      ownershipVerified: true,
    },
    status: "PENDING",
  },
  {
    id: "mod-lexus-rx350-2022",
    submittedAt: "1 hour ago",
    seller: {
      name: "David Chen",
      email: "d.chen@gmail.com",
      phone: "+1 (416) 555-4421",
      city: "Markham",
      province: "ON",
    },
    vehicle: {
      vin: "2T2HZMDA3NC129841",
      year: 2022,
      make: "Lexus",
      model: "RX 350",
      trim: "F SPORT Series 3 AWD",
      mileageKm: 42100,
      transmission: "8-Speed Automatic",
      drivetrain: "All-Wheel Drive (AWD)",
      reservePriceCents: 4450000, // $44,500.00
      damageGrade: "B",
      damageHotspotCount: 2,
      photosCount: 15,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
      photos: [
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=80",
      ],
      lienDisclosed: false,
      keysCount: 2,
      sellerNotes: "Two small bumper scuffs declared. Serviced exclusively at Lexus of Richmond Hill.",
    },
    checks: {
      vinDecoded: true,
      odometerLegible: true,
      damageMapped: true,
      ownershipVerified: true,
    },
    status: "PENDING",
  },
  {
    id: "mod-hyundai-tucson-2021",
    submittedAt: "2 hours ago",
    seller: {
      name: "Kavita Sharma",
      email: "kavita.s@rogers.com",
      phone: "+1 (905) 555-1290",
      city: "Brampton",
      province: "ON",
    },
    vehicle: {
      vin: "KM8JN8W37MU291048",
      year: 2021,
      make: "Hyundai",
      model: "Tucson",
      trim: "Preferred Trend AWD",
      mileageKm: 68400,
      transmission: "6-Speed Automatic",
      drivetrain: "All-Wheel Drive (AWD)",
      reservePriceCents: 2100000, // $21,000.00
      damageGrade: "C",
      damageHotspotCount: 3,
      photosCount: 11,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
      photos: [
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=80",
      ],
      lienDisclosed: true,
      keysCount: 1,
      sellerNotes: "Lien balance of approx $4,500 with Scotiabank Auto Finance.",
    },
    checks: {
      vinDecoded: true,
      odometerLegible: true,
      damageMapped: true,
      ownershipVerified: true,
    },
    status: "PENDING",
  },
];

export function ListingModerationView() {
  const [queue, setQueue] = useState<ModerationItem[]>(INITIAL_QUEUE);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(queue[0] || null);
  const [modalAction, setModalAction] = useState<"REQUEST_EDITS" | "REJECT" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "APPROVED" } : item))
    );
    setFeedbackNotice(`Listing ${id} approved! 24h auction countdown started.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !modalAction) return;

    const newStatus = modalAction === "REQUEST_EDITS" ? "EDITS_REQUESTED" : "REJECTED";
    setQueue((prev) =>
      prev.map((item) => (item.id === selectedItem.id ? { ...item, status: newStatus } : item))
    );

    setFeedbackNotice(
      modalAction === "REQUEST_EDITS"
        ? `Edit request dispatched to seller: "${actionReason}"`
        : `Listing rejected: "${actionReason}"`
    );
    setModalAction(null);
    setActionReason("");
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const pendingCount = queue.filter((i) => i.status === "PENDING").length;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-red-500/10 text-red-500 text-xs font-bold font-mono uppercase tracking-wider border border-red-500/20">
              Operations Backoffice
            </span>
            <span className="text-xs text-portal-text-muted font-mono">
              OMVIC / AMVIC / VSA Intake Gate
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-portal-text font-headline tracking-tight">
            Seller Listing Moderation Queue
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Review and verify pending Canadian consumer vehicle submissions before launching the 24h dealer sealed-bid auction.
          </p>
        </div>

        {/* Pending Queue Count Pill */}
        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-xl bg-portal-surface-hover border border-portal-border text-right font-mono">
            <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
              Pending Verification
            </span>
            <span className="text-xl font-black text-portal-primary">
              {pendingCount} Listings
            </span>
          </div>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Main 2-Column Split: Queue List on Left, Active Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col (5 cols): Listing Cards Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text-muted">
              Pending Queue ({queue.length})
            </span>
            <span className="text-[11px] font-mono text-portal-text-muted">
              Auto-refreshed via SSE
            </span>
          </div>

          <div className="space-y-3">
            {queue.map((item) => {
              const isSelected = selectedItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-portal-primary bg-portal-surface shadow-md ring-1 ring-portal-primary/20"
                      : "border-portal-border bg-portal-surface hover:border-portal-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden bg-portal-surface-hover shrink-0 border border-portal-border">
                      <Image
                        src={item.vehicle.thumbnailUrl}
                        alt={item.vehicle.model}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-portal-primary truncate">
                          {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                            item.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : item.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-portal-text-muted truncate">
                        {item.vehicle.trim} • {item.seller.city}, {item.seller.province}
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-mono text-portal-text-muted pt-1 border-t border-portal-border/50">
                        <span>Reserve: {formatCadCents(item.vehicle.reservePriceCents)}</span>
                        <span>{item.submittedAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col (7 cols): Detailed Moderation Inspector & Decision Actions */}
        {selectedItem ? (
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-portal-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-portal-text-muted">
                      ID: {selectedItem.id}
                    </span>
                    <span className="text-xs text-portal-text-muted">•</span>
                    <span className="text-xs text-portal-text-muted">
                      Submitted {selectedItem.submittedAt}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-portal-text font-headline">
                    {selectedItem.vehicle.year} {selectedItem.vehicle.make}{" "}
                    {selectedItem.vehicle.model} {selectedItem.vehicle.trim}
                  </h2>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
                    Seller Asking Reserve
                  </span>
                  <span className="text-xl font-black text-portal-text">
                    {formatCadCents(selectedItem.vehicle.reservePriceCents)}
                  </span>
                </div>
              </div>

              {/* Photos Gallery Strip */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-portal-primary" />
                  Media Intake Review ({selectedItem.vehicle.photosCount} Photos Uploaded)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedItem.vehicle.photos.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-16/10 rounded-xl overflow-hidden bg-portal-surface-hover border border-portal-border"
                    >
                      <Image
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications & Vehicle Attributes */}
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-portal-primary" />
                  Decoded NHTSA Attributes
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-portal-surface-hover border border-portal-border">
                    <span className="text-[10px] text-portal-text-muted block">17-Char VIN</span>
                    <span className="font-bold text-portal-text truncate block">
                      {selectedItem.vehicle.vin}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-portal-surface-hover border border-portal-border">
                    <span className="text-[10px] text-portal-text-muted block">Odometer</span>
                    <span className="font-bold text-portal-text">
                      {selectedItem.vehicle.mileageKm.toLocaleString()} km
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-portal-surface-hover border border-portal-border">
                    <span className="text-[10px] text-portal-text-muted block">Drivetrain</span>
                    <span className="font-bold text-portal-text truncate block">
                      {selectedItem.vehicle.drivetrain}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-portal-surface-hover border border-portal-border">
                    <span className="text-[10px] text-portal-text-muted block">Condition Grade</span>
                    <span className="font-bold text-portal-text">
                      Grade {selectedItem.vehicle.damageGrade} ({selectedItem.vehicle.damageHotspotCount} Disclosed)
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-portal-surface-hover border border-portal-border">
                    <span className="text-[10px] text-portal-text-muted block">Lien Status</span>
                    <span
                      className={`font-bold ${
                        selectedItem.vehicle.lienDisclosed
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {selectedItem.vehicle.lienDisclosed ? "Active Lien" : "Lien Free"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-portal-surface-hover border border-portal-border">
                    <span className="text-[10px] text-portal-text-muted block">Key Fobs</span>
                    <span className="font-bold text-portal-text">
                      {selectedItem.vehicle.keysCount} Sets
                    </span>
                  </div>
                </div>
              </div>

              {/* Seller Notes & Identity */}
              <div className="p-4 rounded-xl bg-portal-surface-hover/70 border border-portal-border space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-portal-border">
                  <span className="font-mono font-bold text-portal-text">
                    Seller: {selectedItem.seller.name} ({selectedItem.seller.phone})
                  </span>
                  <span className="font-mono text-portal-text-muted">
                    {selectedItem.seller.city}, {selectedItem.seller.province}
                  </span>
                </div>
                <p className="text-portal-text-muted leading-relaxed">
                  &ldquo;{selectedItem.vehicle.sellerNotes}&rdquo;
                </p>
              </div>

              {/* Moderation Actions Bar */}
              <div className="pt-4 border-t border-portal-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAction("REQUEST_EDITS")}
                    className="px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 text-xs font-bold font-mono transition-colors cursor-pointer"
                  >
                    Request Edits
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAction("REJECT")}
                    className="px-4 py-2.5 rounded-xl border border-red-500/40 text-red-500 hover:bg-red-500/10 text-xs font-bold font-mono transition-colors cursor-pointer"
                  >
                    Reject Submission
                  </button>
                </div>

                <button
                  type="button"
                  disabled={selectedItem.status === "APPROVED"}
                  onClick={() => handleApprove(selectedItem.id)}
                  className={`px-6 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                    selectedItem.status === "APPROVED"
                      ? "bg-emerald-600/50 text-white cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {selectedItem.status === "APPROVED"
                      ? "Approved & Auction Active"
                      : "Approve & Start 24h Auction"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 p-12 text-center text-portal-text-muted font-mono text-xs border border-dashed border-portal-border rounded-2xl">
            Select a listing from the queue to review and moderate.
          </div>
        )}
      </div>

      {/* Action Dialog Modal */}
      {modalAction && selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalAction(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-portal-text">
                {modalAction === "REQUEST_EDITS"
                  ? "Request Listing Corrections"
                  : "Reject Listing Submission"}
              </h3>
              <p className="text-xs text-portal-text-muted font-mono mt-0.5">
                Listing: {selectedItem.vehicle.year} {selectedItem.vehicle.make}{" "}
                {selectedItem.vehicle.model}
              </p>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">
                  {modalAction === "REQUEST_EDITS"
                    ? "Specific Required Changes (Seller will receive via SMS/Email)"
                    : "Regulatory Justification Code & Explanatory Note"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    modalAction === "REQUEST_EDITS"
                      ? "e.g. Please re-take a clear photo of the dashboard odometer showing exact km reading."
                      : "e.g. OMVIC compliance failure: Unrepaired structural frame damage reported in Carfax history."
                  }
                  className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:outline-hidden focus:ring-2 focus:ring-portal-primary"
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
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                    modalAction === "REQUEST_EDITS"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Confirm & Send Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
