"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Fingerprint,
  Layers,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api-client";
import {
  getAdminAuditLogCsvUrl,
  useAdminAuditLog,
} from "@/hooks/useAdminAuditLog";
import type {
  AdminAuditActionGroup,
  AuditLogItem,
} from "@/lib/types/admin";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePagination } from "@/components/ui/TablePagination";

const emptySubscribe = () => () => {};
const EMPTY_AUDIT_ITEMS: AuditLogItem[] = [];

function getActionConfig(action: string): { label: string; pill: string } {
  const upper = action.toUpperCase();
  if (
    upper.includes("HALT") ||
    upper.includes("REJECT") ||
    upper.includes("REVOKE") ||
    upper.includes("SUSPEND")
  ) {
    return {
      label: upper.replace(/_/g, " "),
      pill: "bg-red-500/10 text-red-500 border border-red-500/20",
    };
  }
  if (upper.includes("EXTEN") || upper.includes("FORCE_CLOSE") || upper.includes("EDITS")) {
    return {
      label: upper.replace(/_/g, " "),
      pill: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    };
  }
  if (upper.includes("BID") || upper.includes("ACCEPTED")) {
    return {
      label: upper.replace(/_/g, " "),
      pill: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    };
  }
  if (upper.includes("DISPUTE")) {
    return {
      label: upper.replace(/_/g, " "),
      pill: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
    };
  }
  if (upper.includes("APPROV") || upper.includes("VERIF") || upper.includes("COMPLETED")) {
    return {
      label: upper.replace(/_/g, " "),
      pill: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    };
  }
  return {
    label: upper.replace(/_/g, " "),
    pill: "bg-portal-surface-hover text-portal-text border border-portal-border",
  };
}

export function AdminAuditLogView() {
  const t = useTranslations("admin");
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [search, setSearch] = useState("");
  const [actionGroup, setActionGroup] = useState<AdminAuditActionGroup>("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityTypeFilter, setEntityTypeFilter] = useState("ALL");
  const [provinceFilter, setProvinceFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedProof, setSelectedProof] = useState<AuditLogItem | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const queryFilters = useMemo(
    () => ({
      page,
      pageSize,
      action: actionFilter !== "ALL" ? actionFilter : undefined,
      actionGroup,
      entityType: entityTypeFilter !== "ALL" ? entityTypeFilter : undefined,
      province: provinceFilter !== "ALL" ? provinceFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: search.trim() || undefined,
    }),
    [
      page,
      pageSize,
      actionFilter,
      actionGroup,
      entityTypeFilter,
      provinceFilter,
      dateFrom,
      dateTo,
      search,
    ]
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminAuditLog(queryFilters);

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

  const items = data?.items ?? EMPTY_AUDIT_ITEMS;
  const pagination = data?.pagination ?? {
    page: 1,
    pageSize,
    totalItems: 0,
    totalPages: 1,
  };
  const integrity = data?.integrity ?? {
    valid: true,
    totalRows: 0,
    verifiedRows: 0,
    invalidRows: 0,
    integrityPercent: 100,
    latestHash: null,
    firstBrokenId: null,
  };
  const counts = data?.counts ?? {
    total: 0,
    overrides: 0,
    bids: 0,
    approvals: 0,
    disputes: 0,
  };
  const facets = data?.facets ?? {
    actions: [],
    entityTypes: [],
    provinces: ["ON", "AB", "BC", "QC"],
  };

  // Client-side sort within the current server-fetched page
  const { sortedData, requestSort, isSorted } = useTableSort<AuditLogItem>(
    items,
    {
      initialKey: "timestamp",
      initialDirection: "desc",
    }
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(sortedData.map((l) => l.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleToggleRow = (id: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportCsv = () => {
    const csvUrl = getAdminAuditLogCsvUrl({
      action: actionFilter !== "ALL" ? actionFilter : undefined,
      actionGroup,
      entityType: entityTypeFilter !== "ALL" ? entityTypeFilter : undefined,
      province: provinceFilter !== "ALL" ? provinceFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: search.trim() || undefined,
    });
    window.location.assign(csvUrl);
  };

  const handleResetFilters = () => {
    setSearch("");
    setActionGroup("ALL");
    setActionFilter("ALL");
    setEntityTypeFilter("ALL");
    setProvinceFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasActiveFilters =
    search.trim().length > 0 ||
    actionGroup !== "ALL" ||
    actionFilter !== "ALL" ||
    entityTypeFilter !== "ALL" ||
    provinceFilter !== "ALL" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Direct-Canvas Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-portal-text-muted mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Legal Compliance Non-Repudiation</span>
            <span>•</span>
            <span>PIPEDA &amp; Quebec Law 25 Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
            {t("auditTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl font-body">
            {t("auditSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-xs font-semibold text-portal-text cursor-pointer disabled:opacity-60 shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-portal-text-muted ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            <span>{t("verifyChainCta")}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isLoading || isError}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-xs font-bold text-portal-text cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-portal-text-muted" />
            <span>{t("exportCsvCta")}</span>
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {isError && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {error instanceof ApiError
                ? error.message
                : "Failed to query immutable audit log from database."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold cursor-pointer self-start sm:self-auto"
          >
            Retry Query
          </button>
        </div>
      )}

      {/* 2. Operational Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Verified Chain Integrity */}
        <div className="p-4 rounded-2xl border border-portal-border bg-portal-surface flex flex-col justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border ${
                integrity.valid
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Chained Ledger State
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                {integrity.verifiedRows} of {integrity.totalRows} blocks verified
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl sm:text-3xl font-black ${
                integrity.valid
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500"
              }`}
            >
              {integrity.integrityPercent}%
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              {integrity.valid ? "SHA-256 Valid" : "Chain Mismatch"}
            </span>
          </div>
        </div>

        {/* Metric 2: Privileged Overrides */}
        <div
          onClick={() => {
            setActionFilter("ALL");
            setActionGroup(actionGroup === "OVERRIDES" ? "ALL" : "OVERRIDES");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            actionGroup === "OVERRIDES"
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
              {counts.overrides}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              Interventions
            </span>
          </div>
        </div>

        {/* Metric 3: Sealed Bid Vault */}
        <div
          onClick={() => {
            setActionFilter("ALL");
            setActionGroup(actionGroup === "BIDS" ? "ALL" : "BIDS");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            actionGroup === "BIDS"
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
              {counts.bids}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              Hashed Bids
            </span>
          </div>
        </div>

        {/* Metric 4: Total Log Volume */}
        <div
          onClick={() => {
            setActionFilter("ALL");
            setActionGroup("ALL");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            actionGroup === "ALL" && actionFilter === "ALL"
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
                Immutable Postgres blocks
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {counts.total}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              Recorded Blocks
            </span>
          </div>
        </div>
      </div>

      {/* 3. Ledger Card Container */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface shadow-xs overflow-hidden">
        <div className="p-6 border-b border-portal-border/60 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-portal-text font-headline">
                  Cryptographic Audit Ledger
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
                  {pagination.totalItems} Matching Blocks
                </span>
              </div>
              <p className="text-xs text-portal-text-muted mt-1 font-body">
                Inspect chronological platform events, verify SHA-256 chain digests, and review before/after state snapshots.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: "ALL", label: "All" },
                  { id: "OVERRIDES", label: "Overrides" },
                  { id: "APPROVALS", label: "Approvals" },
                  { id: "BIDS", label: "Bids" },
                  { id: "DISPUTES", label: "Disputes" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActionFilter("ALL");
                    setActionGroup(tab.id);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    actionGroup === tab.id && actionFilter === "ALL"
                      ? "bg-portal-primary text-white font-bold shadow-2xs"
                      : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Structured Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search hash, actor, entity ID, IP..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/40 font-body"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                if (e.target.value !== "ALL") setActionGroup("ALL");
                setPage(1);
              }}
              aria-label="Filter by exact action"
              className="px-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/40 cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              {facets.actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by entity type"
              className="px-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/40 cursor-pointer"
            >
              <option value="ALL">All Entities</option>
              {facets.entityTypes.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </select>

            <select
              value={provinceFilter}
              onChange={(e) => {
                setProvinceFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by province"
              className="px-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/40 cursor-pointer"
            >
              <option value="ALL">All Provinces</option>
              {facets.provinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                aria-label="From date"
                className="w-full px-2 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-portal-primary/40"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                aria-label="To date"
                className="w-full px-2 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-portal-primary/40"
              />
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-1.5 rounded-lg border border-portal-border hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text cursor-pointer shrink-0"
                  title="Reset audit filters"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Table Surface */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-body">
            <thead>
              <tr className="border-b border-portal-border/60 bg-portal-surface-hover/30">
                <th className="py-3.5 pl-6 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={
                      sortedData.length > 0 &&
                      sortedData.every((l) => selectedRows.has(l.id))
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                  />
                </th>
                <SortableHeader
                  label="Event Type"
                  direction={isSorted("action")}
                  onSort={() => requestSort("action")}
                />
                <SortableHeader
                  label="Privileged Actor"
                  direction={isSorted("actorName")}
                  onSort={() => requestSort("actorName")}
                />
                <SortableHeader
                  label="Timestamp"
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
              {isLoading && sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-14 text-center text-portal-text-muted"
                  >
                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-portal-primary" />
                    <p className="text-xs font-medium">
                      Loading cryptographic audit blocks...
                    </p>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-portal-text-muted"
                  >
                    <Fingerprint className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">
                      No audit logs match criteria
                    </p>
                    <p className="text-xs text-portal-text-muted mt-1">
                      Clear search or adjust event filters.
                    </p>
                  </td>
                </tr>
              ) : (
                sortedData.map((log) => {
                  const isChecked = selectedRows.has(log.id);
                  const dateObj = new Date(log.timestamp);
                  const timeFormatted = mounted
                    ? dateObj.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";
                  const dateFormatted = mounted
                    ? dateObj.toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : log.timestamp.slice(0, 10);

                  const actionConfig = getActionConfig(log.action);

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-portal-surface-hover/50 transition-colors group ${
                        isChecked ? "bg-portal-primary/5" : ""
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(log.id)}
                          className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-portal-surface-hover border border-portal-border flex items-center justify-center shrink-0 text-portal-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-block whitespace-nowrap ${actionConfig.pill}`}
                            >
                              {actionConfig.label}
                            </span>
                            <span className="text-[10px] font-mono text-portal-text-muted block mt-0.5">
                              Block #{log.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-portal-text text-sm block">
                          {log.actorName}
                        </span>
                        <span className="text-xs text-portal-text-muted block mt-0.5">
                          {log.actorRole} • {log.ipAddress}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-portal-text">
                        <span className="font-medium block">
                          {dateFormatted}
                        </span>
                        <span className="text-xs text-portal-text-muted font-mono block mt-0.5">
                          {timeFormatted}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono">
                        <span
                          className="font-medium text-portal-text block max-w-[160px] truncate"
                          title={log.entityId}
                        >
                          {log.entityId}
                        </span>
                        <span className="text-xs text-portal-text-muted block mt-0.5">
                          {log.entityType} ({log.provincialJurisdiction})
                        </span>
                      </td>

                      <td
                        className="py-4 px-4 text-portal-text-muted max-w-xs truncate"
                        title={log.details}
                      >
                        {log.details}
                      </td>

                      <td className="py-4 pr-6 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProof(log)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-primary hover:text-white text-xs font-semibold text-portal-text transition-colors cursor-pointer shadow-2xs"
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

        {/* 5. Server-Paginated Footer */}
        <TablePagination
          currentPage={pagination.page}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={(nextPage) => setPage(nextPage)}
        />
      </div>

      {/* 6. Cryptographic Proof Verification Modal */}
      {selectedProof && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedProof(null)}
        >
          <div
            className="relative w-full max-w-xl bg-portal-surface border border-portal-border rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 animate-scaleUp overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
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
                    Ledger Sequence Block:{" "}
                    <span className="font-mono text-portal-text">
                      #{selectedProof.id}
                    </span>
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

            <div className="p-4 rounded-xl bg-portal-surface-hover/70 border border-portal-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-portal-text-muted font-mono">
                  SHA-256 Chained Block Digest
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10.5px] font-bold ${
                    integrity.valid
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {integrity.valid
                    ? "Chained & Unaltered"
                    : "Integrity Check Failed"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 font-mono text-[11px] text-portal-primary break-all select-all flex items-center justify-between gap-2">
                <span>{selectedProof.immutableHash || "UNHASHED"}</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      selectedProof.immutableHash,
                      String(selectedProof.id)
                    )
                  }
                  className="p-1 rounded hover:bg-white/10 text-portal-text-muted hover:text-white cursor-pointer shrink-0"
                  title="Copy full SHA-256 hash"
                >
                  {copiedHash === String(selectedProof.id) ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
                Canonical Audit Record Payload
              </span>
              <pre className="p-3.5 rounded-xl bg-black/40 border border-portal-border text-portal-text text-[11px] overflow-x-auto leading-relaxed">
                {JSON.stringify(
                  {
                    blockId: selectedProof.id,
                    timestampUtc: selectedProof.timestamp,
                    action: selectedProof.action,
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
                    beforeState: selectedProof.beforeJson,
                    afterState: selectedProof.afterJson,
                    chainVerification: integrity.valid
                      ? "PASSED_SHA256_CHAIN"
                      : "FAILED_CHAIN_CHECK",
                  },
                  null,
                  2
                )}
              </pre>
            </div>

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
