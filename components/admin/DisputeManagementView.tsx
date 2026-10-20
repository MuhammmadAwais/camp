"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Scale,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Building2,
  User,
  Search,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";

export type DisputeCase = {
  id: string;
  vehicle: string;
  sellerName: string;
  dealershipName: string;
  openedAt: string;
  reason: string;
  agreedPriceCents: number;
  disputedAdjustmentCents: number;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  notes: string;
};

const INITIAL_DISPUTES: DisputeCase[] = [
  {
    id: "DSP-2026-081",
    vehicle: "2021 Ford F-150 Lariat 502A SuperCrew",
    sellerName: "Robert Kelly",
    dealershipName: "Woodbine Ford Commercial",
    openedAt: "4 hours ago",
    reason: "Undisclosed underbody corrosion observed during hoist inspection. Dealership requested $1,500 CAD price reduction.",
    agreedPriceCents: 3250000,
    disputedAdjustmentCents: 150000,
    status: "INVESTIGATING",
    notes: "Photos submitted by dealership hoist technician under review against seller damage mapper disclosure.",
  },
  {
    id: "DSP-2026-074",
    vehicle: "2020 Honda Civic Touring Sedan",
    sellerName: "Sonia Patel",
    dealershipName: "Formula Honda Scarborough",
    openedAt: "2 days ago",
    reason: "Seller arrived with 1 key fob despite declaring 2 keys during listing wizard Step 2.",
    agreedPriceCents: 2150000,
    disputedAdjustmentCents: 35000,
    status: "RESOLVED",
    notes: "Seller agreed to $350 key replacement credit deducted from final EFT disbursement.",
  },
];

export function DisputeManagementView() {
  const [disputes, setDisputes] = useState<DisputeCase[]>(INITIAL_DISPUTES);
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(disputes[0] || null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [alert, setAlert] = useState<string | null>(null);

  const handleResolve = (status: "RESOLVED" | "CLOSED") => {
    if (!selectedCase) return;
    setDisputes(
      disputes.map((d) =>
        d.id === selectedCase.id
          ? {
              ...d,
              status,
              notes: resolutionNote ? `${d.notes} | Admin Resolution: ${resolutionNote}` : d.notes,
            }
          : d
      )
    );
    setAlert(`Dispute case ${selectedCase.id} marked as ${status}.`);
    setResolutionNote("");
    setTimeout(() => setAlert(null), 4000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-xs font-bold font-mono uppercase tracking-wider">
              Dispute Resolution
            </span>
            <span className="text-xs text-portal-text-muted font-mono">
              Arbitration &amp; Escrow Mediation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline">
            Post-Inspection Dispute Management
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Resolve condition discrepancies, unexpected damage claims, and re-negotiation requests between sellers and dealerships.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="p-3.5 rounded-xl bg-portal-surface-hover border border-portal-border text-right">
            <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
              Open Disputes
            </span>
            <span className="text-xl font-black text-portal-primary">
              {disputes.filter((d) => d.status === "OPEN" || d.status === "INVESTIGATING").length} Cases
            </span>
          </div>
        </div>
      </div>

      {alert && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{alert}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text-muted px-1">
            All Incident Cases ({disputes.length})
          </span>

          <div className="space-y-3">
            {disputes.map((caseItem) => {
              const isSelected = selectedCase?.id === caseItem.id;

              return (
                <div
                  key={caseItem.id}
                  onClick={() => setSelectedCase(caseItem)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-portal-primary bg-portal-surface shadow-md ring-1 ring-portal-primary/20"
                      : "border-portal-border bg-portal-surface hover:border-portal-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-portal-primary">
                      {caseItem.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        caseItem.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : caseItem.status === "INVESTIGATING"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {caseItem.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-portal-text mt-1">{caseItem.vehicle}</h4>
                  <p className="text-xs text-portal-text-muted line-clamp-2 mt-1 leading-relaxed">
                    {caseItem.reason}
                  </p>

                  <div className="flex items-center justify-between font-mono text-[11px] text-portal-text-muted pt-2 mt-2 border-t border-portal-border/50">
                    <span>Opened: {caseItem.openedAt}</span>
                    <span className="font-bold text-portal-text">
                      Adj: {formatCadCents(caseItem.disputedAdjustmentCents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Case View (7 cols) */}
        {selectedCase ? (
          <div className="lg:col-span-7 rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-portal-border">
              <div>
                <span className="font-mono text-xs text-portal-text-muted block">
                  Incident Docket #{selectedCase.id}
                </span>
                <h3 className="text-lg font-bold text-portal-text font-headline">
                  {selectedCase.vehicle}
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-portal-primary">
                Agreed Bid: {formatCadCents(selectedCase.agreedPriceCents)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono p-4 rounded-xl bg-portal-surface-hover border border-portal-border">
              <div>
                <span className="text-[10px] text-portal-text-muted block">Seller Party</span>
                <span className="font-bold text-portal-text">{selectedCase.sellerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-portal-text-muted block">Dealership Party</span>
                <span className="font-bold text-portal-text">{selectedCase.dealershipName}</span>
              </div>
              <div>
                <span className="text-[10px] text-portal-text-muted block">Disputed Adjustment</span>
                <span className="font-bold text-amber-500">
                  -{formatCadCents(selectedCase.disputedAdjustmentCents)} CAD
                </span>
              </div>
              <div>
                <span className="text-[10px] text-portal-text-muted block">Case Status</span>
                <span className="font-bold text-portal-text">{selectedCase.status}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text block">
                Dispute Summary &amp; Allegation
              </span>
              <p className="p-3.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border text-xs text-portal-text-muted leading-relaxed">
                {selectedCase.reason}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text block">
                Arbitration Notes &amp; Hoist Evidence
              </span>
              <p className="p-3.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border text-xs font-mono text-portal-text-muted leading-relaxed">
                {selectedCase.notes}
              </p>
            </div>

            {/* Resolution Action */}
            <div className="space-y-3 pt-3 border-t border-portal-border">
              <label className="block text-xs font-semibold text-portal-text">
                Compliance Officer Arbitration Decision / Settlement Note
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Document the binding settlement agreement or mediation directive..."
                className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-portal-primary"
              />

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleResolve("RESOLVED")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono transition-colors cursor-pointer"
                >
                  Approve Settlement &amp; Release Escrow
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve("CLOSED")}
                  className="px-4 py-2 rounded-xl border border-portal-border text-xs font-mono text-portal-text-muted hover:text-portal-text cursor-pointer"
                >
                  Close Without Adjustment
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
