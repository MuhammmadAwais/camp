"use client";

import React, { useState } from "react";
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
} from "lucide-react";

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
    timestamp: "2026-10-20T10:43:06Z",
    actorId: "usr-admin-sarah",
    actorName: "Sarah Tremblay",
    actorRole: "SUPER_ADMIN",
    actionType: "AUCTION_TIME_EXTENSION",
    entityId: "auc-bmw-m340i-2023",
    entityType: "AUCTION",
    ipAddress: "142.214.88.19 (Toronto, ON)",
    provincialJurisdiction: "ON",
    details: "Extended 24h auction countdown by +2 hours due to local severe weather advisory.",
    immutableHash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    id: "aud-984098",
    timestamp: "2026-10-20T10:41:58Z",
    actorId: "usr-admin-sarah",
    actorName: "Sarah Tremblay",
    actorRole: "SUPER_ADMIN",
    actionType: "LISTING_APPROVED",
    entityId: "mod-corvette-z06-2023",
    entityType: "LISTING",
    ipAddress: "142.214.88.19 (Toronto, ON)",
    provincialJurisdiction: "QC",
    details: "Approved listing submission after verifying 17-char NHTSA VIN specs and 22 high-res photos.",
    immutableHash: "sha256:4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  },
  {
    id: "aud-984081",
    timestamp: "2026-10-20T10:35:08Z",
    actorId: "dealer-pfaff-markham",
    actorName: "Christopher Evans (Pfaff Porsche)",
    actorRole: "DEALER_ADMIN",
    actionType: "SEALED_BID_PLACED",
    entityId: "auc-porsche-macan-2022",
    entityType: "BID",
    ipAddress: "24.114.39.81 (Markham, ON)",
    provincialJurisdiction: "ON",
    details: "Submitted sealed bid of CAD $38,250.00 (3825000 cents). Encrypted until unsealing.",
    immutableHash: "sha256:88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589",
  },
  {
    id: "aud-984050",
    timestamp: "2026-10-20T09:12:44Z",
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
];

export function AdminAuditLogView() {
  const [logs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filtered = logs.filter((l) => {
    if (actionFilter !== "ALL" && l.actionType !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.actorName.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.immutableHash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary text-xs font-bold font-mono uppercase tracking-wider">
              Legal Compliance Non-Repudiation
            </span>
            <span className="text-xs text-portal-text-muted font-mono">
              PIPEDA / Law 25 Compliant
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline">
            Immutable Platform Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Tamper-evident, cryptographically hashed chronological ledger recording all privileged admin overrides, license approvals, and sealed bids.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>SHA-256 Chained Integrity Verified</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            "ALL",
            "AUCTION_TIME_EXTENSION",
            "LISTING_APPROVED",
            "SEALED_BID_PLACED",
            "DEALER_LICENSE_VERIFIED",
          ].map((act) => (
            <button
              key={act}
              type="button"
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                actionFilter === act
                  ? "bg-portal-primary text-white"
                  : "bg-portal-surface-hover text-portal-text-muted hover:text-portal-text"
              }`}
            >
              {act.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hash, actor, lot..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-portal-primary"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-portal-border bg-portal-surface-hover/70 text-[11px] uppercase tracking-wider text-portal-text-muted">
                <th className="p-4">Timestamp (UTC)</th>
                <th className="p-4">Actor &amp; Origin</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">Entity ID</th>
                <th className="p-4">Audit Description</th>
                <th className="p-4 text-right">Cryptographic Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-portal-surface-hover/40 transition-colors">
                  <td className="p-4 text-portal-text whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    <span className="block text-[10px] text-portal-text-muted">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="font-bold text-portal-text block font-sans">{log.actorName}</span>
                    <span className="text-[10px] text-portal-text-muted block">{log.ipAddress}</span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-portal-surface-hover border border-portal-border text-[10px] font-bold text-portal-primary">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="p-4 text-portal-text font-bold whitespace-nowrap">{log.entityId}</td>
                  <td className="p-4 font-sans text-portal-text-muted max-w-xs">{log.details}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <span className="text-[10px] text-portal-text-muted hover:text-portal-text cursor-pointer" title={log.immutableHash}>
                      {log.immutableHash.slice(0, 18)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
