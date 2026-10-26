"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  FileSpreadsheet,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Key,
  Layers,
  ArrowDownUp,
  Shield,
  Copy,
  Check,
  X,
  ExternalLink,
  Code,
  ShieldAlert,
  Fingerprint,
} from "lucide-react";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/SortableHeader";

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: "SUPER_ADMIN" | "SYSTEM" | "DEALER_ADMIN" | "SELLER";
  actionType:
    | "AUCTION_TIME_EXTENSION"
    | "AUCTION_EMERGENCY_KILL"
    | "LISTING_APPROVED"
    | "DEALER_LICENSE_VERIFIED"
    | "DISPUTE_SETTLED"
    | "SEALED_BID_PLACED";
  entityId: string;
  entityType: "AUCTION" | "DEALER" | "LISTING" | "DISPUTE" | "BID";
  ipAddress: string;
  provincialJurisdiction: "ON" | "AB" | "BC" | "QC";
  details: string;
  immutableHash: string;
};

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "aud-984102",
    timestamp: "2026-10-20T15:43:06Z",
    actorId: "usr-admin-sarah",
    actorName: "Sarah Tremblay",
    actorRole: "SUPER_ADMIN",
    actionType: "AUCTION_TIME_EXTENSION",
    entityId: "auc-bmw-m340i-2023",
    entityType: "AUCTION",
    ipAddress: "142.214.88.19 (Toronto, ON)",
    provincialJurisdiction: "ON",
    details: "Extended 24h auction countdown by +2 hours due to local severe weather advisory in Southern Ontario.",
    immutableHash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    id: "aud-984098",
    timestamp: "2026-10-20T15:41:58Z",
    actorId: "usr-admin-sarah",
    actorName: "Sarah Tremblay",
    actorRole: "SUPER_ADMIN",
    actionType: "LISTING_APPROVED",
    entityId: "mod-corvette-z06-2023",
    entityType: "LISTING",
    ipAddress: "142.214.88.19 (Toronto, ON)",
    provincialJurisdiction: "QC",
    details: "Approved listing submission after verifying 17-char NHTSA VIN specs and 22 high-resolution vehicle photos.",
    immutableHash: "sha256:4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  },
  {
    id: "aud-984081",
    timestamp: "2026-10-20T15:35:08Z",
    actorId: "dealer-pfaff-markham",
    actorName: "Christopher Evans (Pfaff Porsche)",
    actorRole: "DEALER_ADMIN",
    actionType: "SEALED_BID_PLACED",
    entityId: "auc-porsche-macan-2022",
    entityType: "BID",
    ipAddress: "24.114.39.81 (Markham, ON)",
    provincialJurisdiction: "ON",
    details: "Submitted sealed bid of CAD $38,250.00 (3825000 cents). Encrypted in hardware security vault until floor unsealing.",
    immutableHash: "sha256:88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589",
  },
  {
    id: "aud-984050",
    timestamp: "2026-10-20T14:12:44Z",
    actorId: "usr-admin-sarah",
    actorName: "Sarah Tremblay",
    actorRole: "SUPER_ADMIN",
    actionType: "DEALER_LICENSE_VERIFIED",
    entityId: "app-pfaff-markham",
    entityType: "DEALER",
    ipAddress: "142.214.88.19 (Toronto, ON)",
    provincialJurisdiction: "ON",
    details: "Verified OMVIC registration OMVIC-481920 against Ontario active dealer registry database.",
    immutableHash: "sha256:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
  },
  {
    id: "aud-984012",
    timestamp: "2026-10-19T20:18:22Z",
    actorId: "usr-system-cron",
    actorName: "AutoNexa Settlement Daemon",
    actorRole: "SYSTEM",
    actionType: "DISPUTE_SETTLED",
    entityId: "dsp-audi-q7-55",
    entityType: "DISPUTE",
    ipAddress: "10.0.4.12 (Internal VPC)",
    provincialJurisdiction: "BC",
    details: "Condition escrow funds disbursed following mutual physical inspection waiver sign-off by OpenRoad Audi.",
    immutableHash: "sha256:7b11c92a95c3b94e8031d683e6022e035048b29df9e38e889104fae1098418c3",
  },
];

export function AdminAuditLogView() {
  const [logs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedProof, setSelectedProof] = useState<AuditLogEntry | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Lock body scroll when cryptographic proof modal is open
  useEffect(() => {
    if (selectedProof) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedProof]);

  // Operational metrics
  const counts = {
    TOTAL: logs.length,
    EXTENSIONS: logs.filter((l) => l.actionType === "AUCTION_TIME_EXTENSION").length,
    BIDS: logs.filter((l) => l.actionType === "SEALED_BID_PLACED").length,
    APPROVALS: logs.filter((l) => l.actionType === "LISTING_APPROVED" || l.actionType === "DEALER_LICENSE_VERIFIED").length,
  };

  // Filtered dataset
  const filtered = logs.filter((l) => {
    if (actionFilter !== "ALL" && l.actionType !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.actorName.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.immutableHash.toLowerCase().includes(q) ||
        l.ipAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Universal Table Sorting Hook
  const { sortedData, requestSort, isSorted } = useTableSort<AuditLogEntry>(filtered, {
    initialKey: "timestamp",
    initialDirection: "desc",
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getActionConfig = (type: AuditLogEntry["actionType"]) => {
    switch (type) {
      case "AUCTION_TIME_EXTENSION":
        return { label: "Time Extension", dot: "bg-amber-500", text: "text-amber-500" };
      case "AUCTION_EMERGENCY_KILL":
        return { label: "Emergency Halt", dot: "bg-red-500", text: "text-red-500" };
      case "LISTING_APPROVED":
        return { label: "Listing Approved", dot: "bg-emerald-500", text: "text-emerald-500" };
      case "DEALER_LICENSE_VERIFIED":
        return { label: "Dealer Verified", dot: "bg-teal-500", text: "text-teal-500" };
      case "SEALED_BID_PLACED":
        return { label: "Sealed Bid", dot: "bg-blue-500", text: "text-blue-500" };
      case "DISPUTE_SETTLED":
        return { label: "Dispute Settled", dot: "bg-purple-500", text: "text-purple-500" };
      default:
        return { label: type, dot: "bg-portal-text-muted", text: "text-portal-text" };
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Direct-Canvas Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-portal-text-muted mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Legal Compliance Non-Repudiation</span>
          <span>•</span>
          <span>PIPEDA &amp; Quebec Law 25 Ledger</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
          Immutable Platform Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl font-body">
          Tamper-evident, cryptographically chained chronological ledger recording privileged administrator overrides, commercial license approvals, and sealed bids.
        </p>
      </div>

      {/* 2. Operational Metrics Ribbon (Side-by-Side Prominent Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Verified Chain Integrity */}
        <div className="p-4 rounded-2xl border border-portal-border bg-portal-surface flex flex-col justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Chained Ledger State
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                SHA-256 Merkle root verified
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              100%
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Integrity Valid</span>
          </div>
        </div>

        {/* Metric 2: Privileged Overrides */}
        <div
          onClick={() => setActionFilter("AUCTION_TIME_EXTENSION")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            actionFilter === "AUCTION_TIME_EXTENSION"
              ? "bg-portal-surface border-amber-500/60 shadow-xs ring-1 ring-amber-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Marketplace Overrides
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Clock &amp; lot interventions
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-500">
              {counts.EXTENSIONS}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Interventions</span>
          </div>
        </div>

        {/* Metric 3: Sealed Bid Receipts */}
        <div
          onClick={() => setActionFilter("SEALED_BID_PLACED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            actionFilter === "SEALED_BID_PLACED"
              ? "bg-portal-surface border-portal-primary/60 shadow-xs ring-1 ring-portal-primary/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-portal-primary/10 border border-portal-primary/20 text-portal-primary flex items-center justify-center shrink-0 shadow-2xs">
              <Lock className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Sealed Bid Vault
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Encrypted dealer slips
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {counts.BIDS}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Hashed Bids</span>
          </div>
        </div>

        {/* Metric 4: Total Log Volume */}
        <div
          onClick={() => setActionFilter("ALL")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            actionFilter === "ALL"
              ? "bg-portal-surface border-portal-primary/60 shadow-xs ring-1 ring-portal-primary/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-portal-surface-hover border border-portal-border text-portal-text flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Total Audit Log
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Archived security events
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {counts.TOTAL}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Recorded Blocks</span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Search & Facet Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-portal-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hash, actor, IP address, or entity ID..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-portal-border bg-portal-surface text-portal-text placeholder:text-portal-text-muted text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/40 focus:border-portal-primary transition-all shadow-2xs font-body"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-text-muted hover:text-portal-text cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Type Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
          {[
            { id: "ALL", label: "All Audit Records" },
            { id: "AUCTION_TIME_EXTENSION", label: "Time Extensions" },
            { id: "LISTING_APPROVED", label: "Listing Approvals" },
            { id: "SEALED_BID_PLACED", label: "Sealed Bids" },
            { id: "DEALER_LICENSE_VERIFIED", label: "Dealer Licenses" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActionFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs font-medium ${
                actionFilter === tab.id
                  ? "bg-portal-primary text-white shadow-2xs font-bold"
                  : "bg-portal-surface hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text border border-portal-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Enterprise Sortable Data Table */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-portal-border bg-portal-surface-hover/60">
                <SortableHeader
                  label="Timestamp (EDT)"
                  direction={isSorted("timestamp")}
                  onSort={() => requestSort("timestamp")}
                />
                <SortableHeader
                  label="Privileged Actor & IP"
                  direction={isSorted("actorName")}
                  onSort={() => requestSort("actorName")}
                />
                <SortableHeader
                  label="Action Event"
                  direction={isSorted("actionType")}
                  onSort={() => requestSort("actionType")}
                />
                <SortableHeader
                  label="Target Entity"
                  direction={isSorted("entityId")}
                  onSort={() => requestSort("entityId")}
                />
                <th className="p-3.5 text-[11px] font-bold uppercase tracking-wider text-portal-text-muted font-body">
                  Audit Summary
                </th>
                <th className="p-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-portal-text-muted font-body">
                  Cryptographic Hash
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border font-body">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-portal-text-muted">
                    <Fingerprint className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No audit logs match criteria</p>
                    <p className="text-xs text-portal-text-muted mt-1">
                      Clear search or adjust event filter.
                    </p>
                  </td>
                </tr>
              ) : (
                sortedData.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const timeFormatted = dateObj.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  const dateFormatted = dateObj.toLocaleDateString("en-CA", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  const actionConfig = getActionConfig(log.actionType);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-portal-surface-hover/50 transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-portal-text block font-mono text-xs">
                          {timeFormatted}
                        </span>
                        <span className="text-[11px] text-portal-text-muted block mt-0.5 font-mono">
                          {dateFormatted}
                        </span>
                      </td>

                      {/* Actor & Origin IP */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-portal-text text-sm">
                            {log.actorName}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-portal-surface-hover text-portal-text-muted border border-portal-border">
                            {log.actorRole}
                          </span>
                        </div>
                        <span className="text-[11px] text-portal-text-muted block mt-0.5 font-mono">
                          {log.ipAddress}
                        </span>
                      </td>

                      {/* Action Event with Subtle Dot Indicator */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-portal-surface-hover/80 border border-portal-border font-semibold text-xs text-portal-text">
                          <span className={`w-2 h-2 rounded-full ${actionConfig.dot}`} />
                          <span>{actionConfig.label}</span>
                        </div>
                      </td>

                      {/* Target Entity */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-portal-text text-xs">
                          {log.entityId}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-portal-text-muted block mt-0.5 font-mono">
                          {log.entityType} • {log.provincialJurisdiction}
                        </span>
                      </td>

                      {/* Audit Details */}
                      <td className="p-4 text-xs text-portal-text/90 max-w-sm leading-relaxed">
                        {log.details}
                      </td>

                      {/* Hash & Proof Inspector */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedProof(log)}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-portal-text-muted hover:text-portal-primary hover:underline cursor-pointer group/hash transition-colors"
                          title="Inspect cryptographic proof"
                        >
                          <Fingerprint className="w-3.5 h-3.5 text-portal-text-muted group-hover/hash:text-portal-primary" />
                          <span>{log.immutableHash.slice(0, 16)}...</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Cryptographic Proof Verification Modal (z-[9999]) */}
      {selectedProof && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedProof(null)}
        >
          <div
            className="relative w-full max-w-xl bg-portal-surface border border-portal-border rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 animate-scaleUp overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-portal-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-portal-text">
                    Cryptographic Audit Proof
                  </h3>
                  <p className="text-xs text-portal-text-muted mt-0.5">
                    Log Block ID: <span className="font-mono text-portal-text">{selectedProof.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="p-1 rounded text-portal-text-muted hover:text-portal-text cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SHA-256 Digest Card */}
            <div className="p-4 rounded-xl bg-portal-surface-hover/70 border border-portal-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-portal-text-muted font-mono">
                  SHA-256 Canonical Digest
                </span>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Chained &amp; Unaltered
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 font-mono text-[11px] text-portal-primary break-all select-all flex items-center justify-between gap-2">
                <span>{selectedProof.immutableHash}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedProof.immutableHash, selectedProof.id)}
                  className="p-1 rounded hover:bg-white/10 text-portal-text-muted hover:text-white cursor-pointer shrink-0"
                  title="Copy full SHA-256 hash"
                >
                  {copiedHash === selectedProof.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Signed Event Payload */}
            <div className="space-y-1.5 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
                Canonical Signed Event Payload
              </span>
              <pre className="p-3.5 rounded-xl bg-black/40 border border-portal-border text-portal-text text-[11px] overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    recordId: selectedProof.id,
    timestampUtc: selectedProof.timestamp,
    action: selectedProof.actionType,
    entity: {
      id: selectedProof.entityId,
      type: selectedProof.entityType,
      jurisdiction: selectedProof.provincialJurisdiction,
    },
    actor: {
      id: selectedProof.actorId,
      name: selectedProof.actorName,
      role: selectedProof.actorRole,
      ip: selectedProof.ipAddress,
    },
    eventDetails: selectedProof.details,
    integrityVerification: "PASSED_CANONICAL_HASH",
  },
  null,
  2
)}
              </pre>
            </div>

            {/* Close Button */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-portal-border">
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="px-5 py-2.5 rounded-xl bg-portal-surface hover:bg-portal-surface-hover border border-portal-border text-xs font-bold text-portal-text cursor-pointer transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
