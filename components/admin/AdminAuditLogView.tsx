"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Download,
  Share2,
  FileText,
  Clock,
} from "lucide-react";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePagination } from "@/components/ui/TablePagination";

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

  // Checkbox multi-selection
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 5;

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
  const filtered = useMemo(() => {
    return logs.filter((l) => {
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
  }, [logs, actionFilter, search]);

  // Universal Table Sorting Hook
  const { sortedData, requestSort, isSorted } = useTableSort<AuditLogEntry>(filtered, {
    initialKey: "timestamp",
    initialDirection: "desc",
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getActionConfig = (type: AuditLogEntry["actionType"]) => {
    switch (type) {
      case "AUCTION_TIME_EXTENSION":
        return { label: "Time Extension", pill: "bg-amber-500/10 text-amber-500 border border-amber-500/20" };
      case "AUCTION_EMERGENCY_KILL":
        return { label: "Emergency Halt", pill: "bg-red-500/10 text-red-500 border border-red-500/20" };
      case "LISTING_APPROVED":
        return { label: "Listing Approved", pill: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" };
      case "DEALER_LICENSE_VERIFIED":
        return { label: "Dealer Verified", pill: "bg-teal-500/10 text-teal-500 border border-teal-500/20" };
      case "SEALED_BID_PLACED":
        return { label: "Sealed Bid", pill: "bg-blue-500/10 text-blue-500 border border-blue-500/20" };
      case "DISPUTE_SETTLED":
        return { label: "Dispute Settled", pill: "bg-purple-500/10 text-purple-500 border border-purple-500/20" };
      default:
        return { label: type, pill: "bg-portal-surface-hover text-portal-text border border-portal-border" };
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

      {/* 3. Modern Reference Table Card Container (Matching Image 4) */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface shadow-xs overflow-hidden">
        {/* Table Header Strip */}
        <div className="p-6 border-b border-portal-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-portal-text font-headline">
                Cryptographic Audit Ledger
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
                {filtered.length} Total Records
              </span>
            </div>
            <p className="text-xs text-portal-text-muted mt-1 font-body">
              Here you can inspect chronological platform events, verify SHA-256 Merkle receipts, and review actor non-repudiation proofs.
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
                placeholder="Search hash, actor, IP..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/40 font-body"
              />
            </div>

            {/* Quick Action Filter Chips */}
            <div className="flex items-center gap-1">
              {[
                { id: "ALL", label: "All" },
                { id: "AUCTION_TIME_EXTENSION", label: "Extensions" },
                { id: "LISTING_APPROVED", label: "Approvals" },
                { id: "SEALED_BID_PLACED", label: "Bids" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActionFilter(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    actionFilter === tab.id
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
                  label="Event Type"
                  direction={isSorted("actionType")}
                  onSort={() => requestSort("actionType")}
                />
                <SortableHeader
                  label="Privileged Actor"
                  direction={isSorted("actorName")}
                  onSort={() => requestSort("actorName")}
                />
                <SortableHeader
                  label="Timestamp (EDT)"
                  direction={isSorted("timestamp")}
                  onSort={() => requestSort("timestamp")}
                />
                <SortableHeader
                  label="Target Entity"
                  direction={isSorted("entityId")}
                  onSort={() => requestSort("entityId")}
                />
                <th className="px-4 py-3.5 text-xs font-semibold text-portal-text-muted">
                  Audit Summary
                </th>
                <th className="py-3.5 pr-6 pl-4 text-right text-xs font-semibold text-portal-text-muted">
                  Proof Receipt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border/40">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-portal-text-muted">
                    <Fingerprint className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No audit logs match criteria</p>
                    <p className="text-xs text-portal-text-muted mt-1">
                      Clear search or adjust event filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((log) => {
                  const isChecked = selectedRows.has(log.id);
                  const dateObj = new Date(log.timestamp);
                  const timeFormatted = dateObj.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
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
                      className={`hover:bg-portal-surface-hover/50 transition-colors group ${
                        isChecked ? "bg-portal-primary/5" : ""
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(log.id)}
                          className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                        />
                      </td>

                      {/* Event Type: Icon Badge + Name (Matching Image 4) */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-portal-surface-hover border border-portal-border flex items-center justify-center shrink-0 text-portal-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block ${actionConfig.pill}`}>
                              {actionConfig.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Privileged Actor */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-portal-text text-sm block">
                          {log.actorName}
                        </span>
                        <span className="text-xs text-portal-text-muted block mt-0.5">
                          {log.actorRole} • {log.ipAddress.split(" ")[0]}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-4 text-portal-text">
                        <span className="font-medium block">{dateFormatted}</span>
                        <span className="text-xs text-portal-text-muted font-mono block mt-0.5">
                          {timeFormatted}
                        </span>
                      </td>

                      {/* Target Entity */}
                      <td className="py-4 px-4 font-mono">
                        <span className="font-medium text-portal-text block">
                          {log.entityId}
                        </span>
                        <span className="text-xs text-portal-text-muted block mt-0.5">
                          {log.entityType} ({log.provincialJurisdiction})
                        </span>
                      </td>

                      {/* Clean Single-Line Summary */}
                      <td className="py-4 px-4 text-portal-text-muted max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>

                      {/* Action: Inspect Proof Button (Matching download icon column in Image 4) */}
                      <td className="py-4 pr-6 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProof(log)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-primary hover:text-white text-xs font-semibold text-portal-text transition-colors cursor-pointer shadow-2xs group/btn"
                        >
                          <Fingerprint className="w-3.5 h-3.5" />
                          <span>Proof</span>
                        </button>
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

      {/* 6. Cryptographic Proof Verification Modal (z-[9999]) */}
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
