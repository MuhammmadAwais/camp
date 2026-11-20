"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  AlertOctagon,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Gavel,
  Lock,
  RefreshCw,
  Search,
  Sliders,
  Timer,
  X,
} from "lucide-react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  useAdminAuctionOverride,
  useAdminAuctions,
} from "@/hooks/useAdminAuctions";
import { useTableSort } from "@/hooks/useTableSort";
import { getErrorMessage } from "@/lib/api-errors";
import type {
  AdminAuctionLot,
  AdminAuctionOverrideAction,
  AdminAuctionOverridePayload,
} from "@/lib/types/admin";
import { formatCadCents } from "@/lib/utils";

export type { AdminAuctionLot } from "@/lib/types/admin";

type AuctionStatusFilter =
  | "ALL"
  | "ACTIVE"
  | "CLOSING_SOON"
  | "UNSEALED"
  | "ACCEPTED"
  | "CANCELLED";

const emptySubscribe = () => () => {};

function getStatusBadgeConfig(status: AdminAuctionLot["status"]) {
  switch (status) {
    case "ACTIVE":
      return {
        pill: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
        dot: "bg-blue-500 animate-pulse",
        label: "Live Floor",
      };
    case "UNSEALED":
      return {
        pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        dot: "bg-amber-500",
        label: "Unsealed",
      };
    case "ACCEPTED":
      return {
        pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        dot: "bg-emerald-500",
        label: "Cleared",
      };
    case "COMPLETED":
      return {
        pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        dot: "bg-emerald-500",
        label: "Completed",
      };
    case "CANCELLED":
      return {
        pill: "bg-red-500/10 text-red-500 border border-red-500/20",
        dot: "bg-red-500",
        label: "Halted",
      };
    default:
      return {
        pill: "bg-portal-surface-hover text-portal-text-muted border border-portal-border",
        dot: "bg-portal-text-muted",
        label: "Expired",
      };
  }
}

export function AdminAuctionsView() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useAdminAuctions();
  const overrideMutation = useAdminAuctionOverride();

  const [clientNowMs, setClientNowMs] = useState<number>(() => Date.now());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AuctionStatusFilter>("ALL");
  const [selectedLot, setSelectedLot] = useState<AdminAuctionLot | null>(null);
  const [overrideModalType, setOverrideModalType] =
    useState<AdminAuctionOverrideAction | null>(null);
  const [extensionHours, setExtensionHours] = useState(2);
  const [overrideReason, setOverrideReason] = useState("");
  const [killConfirmInput, setKillConfirmInput] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [copiedVin, setCopiedVin] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const lots = useMemo(() => data?.items ?? [], [data]);
  const hasActiveLots = useMemo(
    () => lots.some((lot) => lot.status === "ACTIVE"),
    [lots]
  );

  useEffect(() => {
    if (!hasActiveLots) return;
    const interval = setInterval(() => {
      setClientNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasActiveLots]);

  const serverTime = data?.serverTime;
  const serverOffsetMs = useMemo(() => {
    if (!serverTime || !dataUpdatedAt || dataUpdatedAt <= 0) return 0;
    const parsed = Date.parse(serverTime);
    return Number.isFinite(parsed) ? parsed - dataUpdatedAt : 0;
  }, [serverTime, dataUpdatedAt]);

  const effectiveNowMs = clientNowMs + serverOffsetMs;

  useEffect(() => {
    if (!overrideModalType) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !overrideMutation.isPending) {
        setOverrideModalType(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [overrideModalType, overrideMutation.isPending]);

  const activeLots = useMemo(
    () => lots.filter((l) => l.status === "ACTIVE"),
    [lots]
  );
  const urgentLots = useMemo(
    () =>
      activeLots.filter((l) => {
        const diff = Date.parse(l.endsAt) - effectiveNowMs;
        return Number.isFinite(diff) && diff > 0 && diff < 60 * 60 * 1000;
      }),
    [activeLots, effectiveNowMs]
  );
  const unsealedCount = useMemo(
    () => lots.filter((l) => l.status === "UNSEALED").length,
    [lots]
  );
  const acceptedLots = useMemo(
    () =>
      lots.filter((l) => l.status === "ACCEPTED" || l.status === "COMPLETED"),
    [lots]
  );

  const filtered = useMemo(() => {
    return lots.filter((lot) => {
      if (statusFilter === "ACTIVE" && lot.status !== "ACTIVE") return false;
      if (statusFilter === "UNSEALED" && lot.status !== "UNSEALED") {
        return false;
      }
      if (
        statusFilter === "ACCEPTED" &&
        lot.status !== "ACCEPTED" &&
        lot.status !== "COMPLETED"
      ) {
        return false;
      }
      if (statusFilter === "CANCELLED" && lot.status !== "CANCELLED") {
        return false;
      }
      if (statusFilter === "CLOSING_SOON") {
        const diff = Date.parse(lot.endsAt) - effectiveNowMs;
        if (lot.status !== "ACTIVE" || diff <= 0 || diff >= 60 * 60 * 1000) {
          return false;
        }
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          lot.vin.toLowerCase().includes(q) ||
          lot.make.toLowerCase().includes(q) ||
          lot.model.toLowerCase().includes(q) ||
          lot.sellerName.toLowerCase().includes(q) ||
          lot.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [lots, statusFilter, search, effectiveNowMs]);

  const { sortedData, requestSort, isSorted } = useTableSort<AdminAuctionLot>(
    filtered,
    {
      initialKey: "endsAt",
      initialDirection: "asc",
    }
  );

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safePage, pageSize]);

  const handleFilterChange = (nextFilter: AuctionStatusFilter) => {
    setStatusFilter(nextFilter);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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

  const handleCopy = (vin: string) => {
    void navigator.clipboard.writeText(vin);
    setCopiedVin(vin);
    setTimeout(() => setCopiedVin(null), 2000);
  };

  const openOverrideModal = (
    lot: AdminAuctionLot,
    action: AdminAuctionOverrideAction
  ) => {
    setSelectedLot(lot);
    setOverrideModalType(action);
    setExtensionHours(2);
    setOverrideReason("");
    setKillConfirmInput("");
    setModalError(null);
  };

  const closeOverrideModal = () => {
    if (overrideMutation.isPending) return;
    setOverrideModalType(null);
    setModalError(null);
  };

  const handleConfirmOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot || !overrideModalType) return;

    const trimmedReason = overrideReason.trim();
    if (trimmedReason.length < 5) {
      setModalError(
        "Please enter an audit rationale of at least 5 characters."
      );
      return;
    }

    if (
      overrideModalType === "HALT" &&
      killConfirmInput.trim().toUpperCase() !== "HALT"
    ) {
      setModalError('Type "HALT" to authorize permanent termination.');
      return;
    }

    const payload: AdminAuctionOverridePayload =
      overrideModalType === "EXTEND"
        ? { action: "EXTEND", extensionHours, reason: trimmedReason }
        : { action: overrideModalType, reason: trimmedReason };

    setModalError(null);

    try {
      const result = await overrideMutation.mutateAsync({
        listingId: selectedLot.id,
        payload,
      });

      setFeedbackNotice({
        text: `${result.message} (Audit: ${result.auditAction})`,
        type: overrideModalType === "HALT" ? "error" : "success",
      });
      setOverrideModalType(null);
      setSelectedLot(null);
      setOverrideReason("");
      setKillConfirmInput("");
      setTimeout(() => setFeedbackNotice(null), 6000);
    } catch (err) {
      setModalError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Direct-Canvas Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-portal-text-muted mb-1">
            <Gavel className="w-3.5 h-3.5 text-portal-primary" />
            <span>Live Operations</span>
            <span>•</span>
            <span>Market Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
            Auction Master Operations &amp; Overrides
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl font-body">
            Real-time wholesale exchange supervision, countdown extensions, instant unsealing overrides, statutory compliance halts, and sealed-bid surveillance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-xs font-semibold text-portal-text transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-portal-primary ${
              isFetching ? "animate-spin" : ""
            }`}
          />
          <span>Sync Floor</span>
        </button>
      </div>

      {/* 2. Operational Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => handleFilterChange("ACTIVE")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "ACTIVE"
              ? "bg-portal-surface border-amber-500/60 shadow-xs ring-1 ring-amber-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
              <Gavel className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Live Wholesale Floor
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Active 24h bidding windows
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-500">
              {activeLots.length}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              Lots Trading
            </span>
          </div>
        </div>

        <div
          onClick={() => handleFilterChange("CLOSING_SOON")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "CLOSING_SOON"
              ? "bg-portal-surface border-red-500/60 shadow-xs ring-1 ring-red-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0 shadow-2xs">
              <Timer className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Closing Urgently
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Under 60 minutes remaining
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-red-500">
              {urgentLots.length}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              Critical Lots
            </span>
          </div>
        </div>

        <div
          onClick={() => handleFilterChange("ACCEPTED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "ACCEPTED"
              ? "bg-portal-surface border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Floor Matches
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                {unsealedCount} unsealed awaiting review
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {acceptedLots.length}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              Cleared
            </span>
          </div>
        </div>

        <div
          onClick={() => handleFilterChange("ALL")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            statusFilter === "ALL"
              ? "bg-portal-surface border-portal-primary/60 shadow-xs ring-1 ring-portal-primary/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-portal-surface-hover border border-portal-border text-portal-text flex items-center justify-center shrink-0 shadow-2xs">
              <Sliders className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Total Catalog
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Full market operations stream
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {lots.length}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              Total Lots
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Feedback Notice */}
      {feedbackNotice && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
            feedbackNotice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs flex items-center justify-between gap-3">
          <span>{getErrorMessage(error)}</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-3 py-1 rounded-lg bg-red-500 text-white font-semibold cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Modern Table Card Container */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface shadow-xs overflow-hidden">
        {/* Table Header Strip */}
        <div className="p-6 border-b border-portal-border/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-portal-text font-headline">
                Wholesale Auction Floor Surveillance
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
                {filtered.length} Total Lots
              </span>
            </div>
            <p className="text-xs text-portal-text-muted mt-1 font-body">
              Supervise live 24h dealer bidding windows, unseal floors cleanly, and audit every operational override.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search VIN, make, model..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/40 font-body"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: "ALL", label: "All" },
                  { id: "ACTIVE", label: "Active" },
                  { id: "CLOSING_SOON", label: "Ending Soon" },
                  { id: "UNSEALED", label: "Unsealed" },
                  { id: "ACCEPTED", label: "Cleared" },
                  { id: "CANCELLED", label: "Halted" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilterChange(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === tab.id
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
                  label="Vehicle Lot"
                  direction={isSorted("model")}
                  onSort={() => requestSort("model")}
                />
                <SortableHeader
                  label="Seller & Location"
                  direction={isSorted("sellerName")}
                  onSort={() => requestSort("sellerName")}
                />
                <SortableHeader
                  label="Sealed Telemetry"
                  direction={isSorted("totalBidsCount")}
                  onSort={() => requestSort("totalBidsCount")}
                />
                <SortableHeader
                  label="Reserve (CAD)"
                  direction={isSorted("reservePriceCents")}
                  onSort={() => requestSort("reservePriceCents")}
                />
                <SortableHeader
                  label="Countdown"
                  direction={isSorted("endsAt")}
                  onSort={() => requestSort("endsAt")}
                />
                <SortableHeader
                  label="Status"
                  direction={isSorted("status")}
                  onSort={() => requestSort("status")}
                />
                <th className="py-3.5 pr-6 pl-4 text-right text-xs font-semibold text-portal-text-muted">
                  Controls
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border/40">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-14 text-center text-portal-text-muted"
                  >
                    <RefreshCw className="w-7 h-7 mx-auto mb-2.5 text-portal-primary animate-spin" />
                    <p className="text-sm font-semibold">
                      Loading live wholesale auction stream...
                    </p>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-portal-text-muted"
                  >
                    <Gavel className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No auction lots found</p>
                    <p className="text-xs text-portal-text-muted mt-1">
                      Adjust your search or status filter to inspect other marketplace lots.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((lot) => {
                  const isChecked = selectedRows.has(lot.id);
                  const msLeft = mounted
                    ? Date.parse(lot.endsAt) - effectiveNowMs
                    : 0;
                  const hoursLeft = Math.max(
                    0,
                    Math.floor(msLeft / (3600 * 1000))
                  );
                  const minsLeft = Math.max(
                    0,
                    Math.floor((msLeft % (3600 * 1000)) / (60 * 1000))
                  );
                  const isUrgent =
                    mounted &&
                    lot.status === "ACTIVE" &&
                    msLeft > 0 &&
                    msLeft < 15 * 60 * 1000;
                  const isClosed =
                    lot.status !== "ACTIVE" || (mounted && msLeft <= 0);
                  const badge = getStatusBadgeConfig(lot.status);

                  return (
                    <tr
                      key={lot.id}
                      className={`hover:bg-portal-surface-hover/50 transition-colors group ${
                        isChecked ? "bg-portal-primary/5" : ""
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(lot.id)}
                          className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-8 rounded-lg overflow-hidden bg-portal-surface-hover border border-portal-border shrink-0">
                            <Image
                              src={lot.thumbnailUrl}
                              alt={`${lot.year} ${lot.make} ${lot.model}`}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-portal-text text-sm block truncate group-hover:text-portal-primary transition-colors">
                              {lot.year} {lot.make} {lot.model}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-portal-text-muted mt-0.5 font-mono">
                              <span>VIN: ···{lot.vin.slice(-6)}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(lot.vin)}
                                className="hover:text-portal-text p-0.5 rounded cursor-pointer"
                                title="Copy VIN"
                              >
                                {copiedVin === lot.vin ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-medium text-portal-text block">
                          {lot.sellerName}
                        </span>
                        <span className="text-xs text-portal-text-muted block mt-0.5">
                          {lot.city}, {lot.province}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-portal-text">
                          <Lock className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                          <span>{lot.totalBidsCount} sealed bids</span>
                        </div>
                        {lot.highestBidEstimateCents !== undefined && (
                          <span className="text-xs text-portal-text-muted font-mono block mt-0.5">
                            Top: {formatCadCents(lot.highestBidEstimateCents)}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-headline font-bold text-sm text-portal-text">
                        {formatCadCents(lot.reservePriceCents)}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs">
                        {lot.status === "ACTIVE" ? (
                          !mounted ? (
                            <span className="text-portal-text-muted">Syncing...</span>
                          ) : !isClosed ? (
                            <div
                              className={`inline-flex items-center gap-1 font-semibold ${
                                isUrgent
                                  ? "text-red-500 animate-pulse font-bold"
                                  : "text-portal-text"
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {hoursLeft > 0 ? `${hoursLeft}h ` : ""}
                                {minsLeft}m left
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-500 font-semibold">
                              Closing
                            </span>
                          )
                        ) : (
                          <span className="text-portal-text-muted">
                            {lot.status === "ACCEPTED" ||
                            lot.status === "COMPLETED"
                              ? "Floor Cleared"
                              : lot.status === "UNSEALED"
                                ? "Bids Unsealed"
                                : lot.status === "CANCELLED"
                                  ? "Halted"
                                  : "Closed"}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.pill}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-4 pr-6 pl-4 text-right">
                        {lot.status === "ACTIVE" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openOverrideModal(lot, "EXTEND")}
                              className="px-2.5 py-1 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-medium transition-colors cursor-pointer"
                            >
                              + Extend
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openOverrideModal(lot, "FORCE_CLOSE")
                              }
                              className="px-2.5 py-1 rounded-lg border border-amber-500/35 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-medium transition-colors cursor-pointer"
                            >
                              Unseal Now
                            </button>
                            <button
                              type="button"
                              onClick={() => openOverrideModal(lot, "HALT")}
                              className="px-2.5 py-1 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer"
                            >
                              Halt
                            </button>
                          </div>
                        ) : lot.status === "UNSEALED" ? (
                          <button
                            type="button"
                            onClick={() => openOverrideModal(lot, "HALT")}
                            className="px-2.5 py-1 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer"
                          >
                            Halt
                          </button>
                        ) : (
                          <span className="text-xs text-portal-text-muted">
                            Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Enterprise Pagination Footer */}
        <TablePagination
          currentPage={safePage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* 6. Portaled Safety Override Modal (z-[9999]) */}
      {mounted &&
        overrideModalType &&
        selectedLot &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
            onClick={closeOverrideModal}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-portal-border bg-portal-surface p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-portal-border">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      overrideModalType === "EXTEND" ||
                      overrideModalType === "FORCE_CLOSE"
                        ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                        : "bg-red-500/10 border border-red-500/20 text-red-500"
                    }`}
                  >
                    {overrideModalType === "EXTEND" ? (
                      <Clock className="w-6 h-6" />
                    ) : overrideModalType === "FORCE_CLOSE" ? (
                      <Gavel className="w-6 h-6" />
                    ) : (
                      <AlertOctagon className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-portal-text font-headline">
                      {overrideModalType === "EXTEND"
                        ? "Extend Auction Countdown"
                        : overrideModalType === "FORCE_CLOSE"
                          ? "Force Close & Unseal Bids"
                          : "Emergency Auction Termination"}
                    </h3>
                    <p className="text-xs text-portal-text-muted mt-0.5">
                      Target Lot:{" "}
                      <span className="font-bold text-portal-text">
                        {selectedLot.year} {selectedLot.make}{" "}
                        {selectedLot.model}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeOverrideModal}
                  disabled={overrideMutation.isPending}
                  className="p-1 rounded text-portal-text-muted hover:text-portal-text cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmOverride} className="space-y-4">
                {overrideModalType === "EXTEND" ? (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-portal-text">
                        Extension Duration
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { hours: 1, label: "+1 Hour" },
                          { hours: 2, label: "+2 Hours" },
                          { hours: 6, label: "+6 Hours" },
                          { hours: 24, label: "+24 Hours" },
                        ].map((chip) => (
                          <button
                            key={chip.hours}
                            type="button"
                            onClick={() => setExtensionHours(chip.hours)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              extensionHours === chip.hours
                                ? "bg-amber-500 text-black border-amber-500 font-extrabold shadow-sm"
                                : "bg-portal-surface-hover hover:bg-portal-surface border-portal-border text-portal-text"
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-portal-text">
                        Audit Trail Rationale (Required)
                      </label>
                      <textarea
                        rows={3}
                        required
                        minLength={5}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="e.g. Extended by 2 hours due to regional weather delay impacting dealer inspections..."
                        className="w-full p-3 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-portal-primary/40 focus:outline-none placeholder:text-portal-text-muted"
                      />
                    </div>
                  </>
                ) : overrideModalType === "FORCE_CLOSE" ? (
                  <>
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs space-y-1">
                      <p className="font-bold">Immediate Bid Unsealing Override</p>
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        This closes live bidding immediately and transitions the listing to UNSEALED so the seller can review ranked offers ({selectedLot.totalBidsCount} bid(s) placed).
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-portal-text">
                        Audit Trail Rationale (Required)
                      </label>
                      <textarea
                        rows={3}
                        required
                        minLength={5}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="e.g. Seller-requested early close / operational floor completion verified..."
                        className="w-full p-3 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-amber-500/40 focus:outline-none placeholder:text-portal-text-muted"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs space-y-1">
                      <p className="font-bold">Permanent Market Override Warning</p>
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        Halting this lot cancels the floor immediately, voids all active dealer bids, and records a permanent non-repudiation compliance audit entry.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-portal-text">
                        Statutory Cancellation Reason (Required)
                      </label>
                      <textarea
                        rows={2}
                        required
                        minLength={5}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="e.g. Undisclosed vehicle lien discovered via Carfax refresh; seller breach of disclosure terms..."
                        className="w-full p-3 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-red-500/40 focus:outline-none placeholder:text-portal-text-muted"
                      />
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-bold text-portal-text">
                        Type <span className="font-mono text-red-500">HALT</span>{" "}
                        to confirm termination
                      </label>
                      <input
                        type="text"
                        required
                        value={killConfirmInput}
                        onChange={(e) => setKillConfirmInput(e.target.value)}
                        placeholder="Type HALT"
                        className="w-full px-3 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono tracking-widest focus:ring-2 focus:ring-red-500/40 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {modalError && (
                  <p className="text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                    {modalError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-portal-border">
                  <button
                    type="button"
                    onClick={closeOverrideModal}
                    disabled={overrideMutation.isPending}
                    className="px-4 py-2.5 rounded-xl border border-portal-border text-xs font-bold text-portal-text hover:bg-portal-surface-hover cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      overrideMutation.isPending ||
                      (overrideModalType === "HALT" &&
                        killConfirmInput.trim().toUpperCase() !== "HALT")
                    }
                    className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      overrideModalType === "HALT"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-amber-600 hover:bg-amber-700"
                    }`}
                  >
                    {overrideMutation.isPending
                      ? "Applying Override..."
                      : overrideModalType === "EXTEND"
                        ? "Broadcast Extension & Reset Timer"
                        : overrideModalType === "FORCE_CLOSE"
                          ? "Force Close & Unseal Now"
                          : "Execute Emergency Halt"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
