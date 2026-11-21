"use client";

import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck2,
  FileText,
  Loader2,
  Search,
  Shield,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { useAdminDealers, useDecideDealer } from "@/hooks/useAdminDealers";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePagination } from "@/components/ui/TablePagination";
import type {
  AdminDealerApplication,
  AdminDealerDecisionAction,
  AdminDealerStatus,
} from "@/lib/types/admin";

type FilterStatusOption = "ALL" | "PENDING" | "VERIFIED" | "DISQUALIFIED";

const subscribeNoop = () => () => {};
const getTrueClient = () => true;
const getFalseServer = () => false;

const EMPTY_DEALERS: AdminDealerApplication[] = [];

function statusBadgeConfig(status: AdminDealerStatus): {
  label: string;
  pillClass: string;
  dotClass: string;
} {
  if (status === "VERIFIED") {
    return {
      label: "Verified",
      pillClass:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
      dotClass: "bg-emerald-500",
    };
  }
  if (status === "PENDING") {
    return {
      label: "Under Review",
      pillClass:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
      dotClass: "bg-amber-500 animate-pulse",
    };
  }
  if (status === "SUSPENDED") {
    return {
      label: "Suspended",
      pillClass:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25",
      dotClass: "bg-amber-500",
    };
  }
  return {
    label: status === "REVOKED" ? "Revoked" : "Rejected",
    pillClass:
      "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
    dotClass: "bg-red-500",
  };
}

export function DealerVerificationView() {
  const t = useTranslations("admin");
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getTrueClient,
    getFalseServer
  );

  const { data, isLoading, isError, error, refetch } = useAdminDealers();
  const decideMutation = useDecideDealer();

  const [search, setSearch] = useState("");
  const [filterRegulator, setFilterRegulator] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<FilterStatusOption>("ALL");
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const dealers = data?.items ?? EMPTY_DEALERS;
  const counts = data?.counts ?? {
    ALL: 0,
    PENDING: 0,
    VERIFIED: 0,
    REJECTED: 0,
    SUSPENDED: 0,
    REVOKED: 0,
  };
  const disqualifiedCount =
    counts.REJECTED + counts.SUSPENDED + counts.REVOKED;

  const selectedDealer = useMemo(
    () => dealers.find((d) => d.id === selectedDealerId) ?? null,
    [dealers, selectedDealerId]
  );

  useEffect(() => {
    if (selectedDealer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedDealer]);

  const filtered = useMemo(() => {
    return dealers.filter((d) => {
      if (filterRegulator !== "ALL" && d.regulator !== filterRegulator) {
        return false;
      }
      if (filterStatus === "PENDING" && d.status !== "PENDING") return false;
      if (filterStatus === "VERIFIED" && d.status !== "VERIFIED") return false;
      if (
        filterStatus === "DISQUALIFIED" &&
        d.status !== "REJECTED" &&
        d.status !== "SUSPENDED" &&
        d.status !== "REVOKED"
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          d.dealershipName.toLowerCase().includes(q) ||
          d.legalEntityName.toLowerCase().includes(q) ||
          d.licenseNumber.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.province.toLowerCase().includes(q) ||
          d.contactName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dealers, filterRegulator, filterStatus, search]);

  const { sortedData, requestSort, isSorted } =
    useTableSort<AdminDealerApplication>(filtered, {
      initialKey: "submittedAt",
      initialDirection: "desc",
    });

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(paginatedData.map((d) => d.id)));
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
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenReview = (dealer: AdminDealerApplication) => {
    setSelectedDealerId(dealer.id);
    setReviewNotes(dealer.notes ?? "");
    setModalError(null);
  };

  const handleDecision = async (action: AdminDealerDecisionAction) => {
    if (!selectedDealer) return;
    setModalError(null);

    const trimmedNotes = reviewNotes.trim();
    if (action !== "APPROVE" && trimmedNotes.length < 5) {
      setModalError(
        "Please enter compliance findings or rationale (at least 5 characters) before rejecting, suspending, or revoking."
      );
      return;
    }

    try {
      const result = await decideMutation.mutateAsync({
        id: selectedDealer.id,
        payload: {
          action,
          ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        },
      });

      setFeedbackNotice({
        text: result.message,
        type: action === "APPROVE" ? "success" : "error",
      });
      setSelectedDealerId(null);
      setTimeout(() => setFeedbackNotice(null), 6000);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.failure.error
          : "Unable to process dealership licensing decision.";
      setModalError(msg);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Direct-Canvas Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-portal-text-muted mb-1">
          <Shield className="w-3.5 h-3.5 text-portal-primary" />
          <span>Provincial Dealer Compliance</span>
          <span>•</span>
          <span>Registrar Cross-Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
          {t("dealersTitle")}
        </h1>
        <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl font-body">
          {t("dealersSubtitle")}
        </p>
      </div>

      {/* 2. Operational Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => {
            setFilterStatus("PENDING");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            filterStatus === "PENDING"
              ? "bg-portal-surface border-amber-500/60 shadow-xs ring-1 ring-amber-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Pending Inspection
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Awaiting registry validation
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-500">
              {counts.PENDING}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              Dealerships
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterStatus("VERIFIED");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            filterStatus === "VERIFIED"
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
                Active Licenses
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Authorized sealed bidders
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {counts.VERIFIED}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              Verified
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterStatus("DISQUALIFIED");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            filterStatus === "DISQUALIFIED"
              ? "bg-portal-surface border-red-500/60 shadow-xs ring-1 ring-red-500/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Suspended &amp; Rejected
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                BR-14 holds &amp; denials
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {disqualifiedCount}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              Restricted
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterStatus("ALL");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            filterStatus === "ALL"
              ? "bg-portal-surface border-portal-primary/60 shadow-xs ring-1 ring-portal-primary/20"
              : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-portal-surface-hover border border-portal-border text-portal-text flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-portal-text block truncate leading-tight">
                Total Dealerships
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                All provincial rosters
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {counts.ALL}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">
              Applications
            </span>
          </div>
        </button>
      </div>

      {/* Dynamic Feedback Banner */}
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

      {/* 3. Roster Table Container */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface shadow-xs overflow-hidden">
        <div className="p-6 border-b border-portal-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-portal-text font-headline">
                Registered Dealership Roster
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
                {filtered.length} Total
              </span>
            </div>
            <p className="text-xs text-portal-text-muted mt-1 font-body">
              Inspect dealer compliance credentials, approve trading floor access, or execute BR-14 bid-voiding suspensions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search dealership, license..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/40 font-body"
              />
            </div>

            <div className="flex items-center gap-1">
              {["ALL", "OMVIC", "AMVIC", "VSA", "OPC"].map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => {
                    setFilterRegulator(reg);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    filterRegulator === reg
                      ? "bg-portal-primary text-white font-bold shadow-2xs"
                      : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3 text-portal-text-muted">
            <Loader2 className="w-7 h-7 animate-spin text-portal-primary mx-auto" />
            <p className="text-xs">Loading Canadian dealership compliance queue...</p>
          </div>
        ) : isError ? (
          <div className="py-14 px-4 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-portal-text">
              {error instanceof ApiError
                ? error.failure.error
                : "Unable to load dealership roster."}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="px-4 py-2 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-xs font-bold text-portal-text cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-body">
                <thead>
                  <tr className="border-b border-portal-border/60 bg-portal-surface-hover/30">
                    <th className="py-3.5 pl-6 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={
                          paginatedData.length > 0 &&
                          paginatedData.every((d) => selectedRows.has(d.id))
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                      />
                    </th>
                    <SortableHeader
                      label="Dealership"
                      direction={isSorted("dealershipName")}
                      onSort={() => requestSort("dealershipName")}
                    />
                    <SortableHeader
                      label="License & Regulator"
                      direction={isSorted("licenseNumber")}
                      onSort={() => requestSort("licenseNumber")}
                    />
                    <SortableHeader
                      label="Jurisdiction"
                      direction={isSorted("city")}
                      onSort={() => requestSort("city")}
                    />
                    <SortableHeader
                      label="Purchasing Officer"
                      direction={isSorted("contactName")}
                      onSort={() => requestSort("contactName")}
                    />
                    <SortableHeader
                      label="Status"
                      direction={isSorted("status")}
                      onSort={() => requestSort("status")}
                    />
                    <th className="py-3.5 pr-6 pl-4 text-right text-xs font-semibold text-portal-text-muted">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-portal-border/40">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-portal-text-muted"
                      >
                        <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-semibold">
                          No dealer applications match your filter
                        </p>
                        <p className="text-xs text-portal-text-muted mt-1">
                          Try clearing your search query or regulator selection.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((dealer) => {
                      const isChecked = selectedRows.has(dealer.id);
                      const monogram = dealer.dealershipName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase();
                      const badge = statusBadgeConfig(dealer.status);

                      return (
                        <tr
                          key={dealer.id}
                          className={`hover:bg-portal-surface-hover/50 transition-colors group ${
                            isChecked ? "bg-portal-primary/5" : ""
                          }`}
                        >
                          <td className="py-4 pl-6 pr-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleRow(dealer.id)}
                              className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                            />
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-portal-surface-hover border border-portal-border flex items-center justify-center shrink-0 font-bold text-xs text-portal-text">
                                {monogram || "DL"}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-portal-text text-sm block truncate group-hover:text-portal-primary transition-colors">
                                  {dealer.dealershipName}
                                </span>
                                <span className="text-xs text-portal-text-muted block truncate mt-0.5">
                                  {dealer.legalEntityName}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-portal-surface-hover border border-portal-border text-portal-text font-mono">
                                {dealer.regulator}
                              </span>
                              <span className="font-mono font-medium text-portal-text">
                                {dealer.licenseNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(dealer.licenseNumber, dealer.id)
                                }
                                className="p-1 rounded hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text cursor-pointer transition-colors"
                                title="Copy license number"
                              >
                                {copiedId === dealer.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-portal-text">
                            <span>
                              {dealer.city || dealer.postalCode}, {dealer.province}
                            </span>
                            <span className="text-portal-text-muted text-xs block mt-0.5">
                              {dealer.serviceRadiusKm} km radius •{" "}
                              {dealer.activeBidsCount} active bids
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-medium text-portal-text block">
                              {dealer.contactName}
                            </span>
                            <span className="text-portal-text-muted text-xs block mt-0.5">
                              {dealer.contactEmail}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.pillClass}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}
                              />
                              <span>{badge.label}</span>
                            </span>
                          </td>

                          <td className="py-4 pr-6 pl-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenReview(dealer)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-primary hover:text-white text-xs font-semibold text-portal-text transition-colors cursor-pointer shadow-2xs group/btn"
                            >
                              <span>Review</span>
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* 4. Body-Portaled Review & Compliance Action Modal */}
      {mounted &&
        selectedDealer &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
            onClick={() => setSelectedDealerId(null)}
          >
            <div
              className="relative w-full max-w-2xl bg-portal-surface border border-portal-border rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 animate-scaleUp overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-4 border-b border-portal-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-portal-primary/10 border border-portal-primary/20 text-portal-primary flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-headline text-lg sm:text-xl font-bold text-portal-text">
                      Dealer License Dossier
                    </h3>
                    <p className="text-xs text-portal-text-muted mt-0.5">
                      Dealership ID:{" "}
                      <span className="font-mono text-portal-text">
                        {selectedDealer.id}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDealerId(null)}
                  className="p-1 rounded-lg text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body">
                <div className="p-3.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-portal-text-muted">
                    Dealership Legal Entity
                  </span>
                  <p className="font-bold text-sm text-portal-text">
                    {selectedDealer.dealershipName}
                  </p>
                  <p className="text-portal-text-muted text-[11px]">
                    {selectedDealer.legalEntityName}
                    {selectedDealer.businessNumber
                      ? ` • BN ${selectedDealer.businessNumber}`
                      : ""}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-portal-text-muted">
                    Regulatory Registration
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-portal-primary/10 text-portal-primary font-bold">
                      {selectedDealer.regulator}
                    </span>
                    <span className="font-mono font-bold text-portal-text text-sm">
                      {selectedDealer.licenseNumber}
                    </span>
                  </div>
                  <p className="text-portal-text-muted text-[11px] font-mono">
                    {selectedDealer.licenseExpiry
                      ? `Expires: ${selectedDealer.licenseExpiry}`
                      : "Expiry date not specified"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-portal-text-muted">
                    Physical Premises &amp; Radius
                  </span>
                  <p className="font-bold text-portal-text">
                    {selectedDealer.address}
                  </p>
                  <p className="text-portal-text-muted text-[11px]">
                    {selectedDealer.city || "Pending city"},{" "}
                    {selectedDealer.province} {selectedDealer.postalCode} •{" "}
                    {selectedDealer.serviceRadiusKm} km Radius
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-portal-text-muted">
                    Designated Purchasing Officer
                  </span>
                  <p className="font-bold text-portal-text">
                    {selectedDealer.contactName}
                    {selectedDealer.contactTitle
                      ? ` (${selectedDealer.contactTitle})`
                      : ""}
                  </p>
                  <p className="text-portal-text-muted text-[11px]">
                    {selectedDealer.contactEmail} • {selectedDealer.contactPhone}
                  </p>
                </div>
              </div>

              {/* Telemetry & Compliance Record Summary */}
              <div className="p-4 rounded-xl border border-portal-border bg-portal-surface-hover/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-7 h-7 text-portal-primary shrink-0" />
                  <div>
                    <p className="font-bold text-xs text-portal-text">
                      Licensing Registry &amp; Floor Status
                    </p>
                    <p className="text-[11px] text-portal-text-muted mt-0.5 font-mono">
                      Seats: {selectedDealer.teamMembersCount} • Active Bids:{" "}
                      {selectedDealer.activeBidsCount} • Plan:{" "}
                      {selectedDealer.planName ?? "None yet (Trial on approval)"}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-portal-surface border border-portal-border text-portal-text text-xs font-bold shrink-0">
                  {selectedDealer.status}
                </span>
              </div>

              {selectedDealer.activeBidsCount > 0 && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    BR-14 Enforcement Notice: Suspending or revoking this dealership will atomically void{" "}
                    <strong>{selectedDealer.activeBidsCount}</strong> active sealed bid(s) and decrement affected auction bid counters.
                  </span>
                </div>
              )}

              {modalError && (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-500 font-semibold">
                  {modalError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-portal-text block">
                  Verification Findings &amp; Audit Rationale
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => {
                    setReviewNotes(e.target.value);
                    setModalError(null);
                  }}
                  placeholder="Add registrar cross-check notes, or provide a mandatory rationale (min 5 chars) to reject, suspend, or revoke..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs focus:ring-2 focus:ring-portal-primary/40 focus:outline-none placeholder:text-portal-text-muted"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-portal-border">
                <button
                  type="button"
                  disabled={decideMutation.isPending}
                  onClick={() => setSelectedDealerId(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  Close
                </button>

                {(selectedDealer.status === "PENDING" ||
                  selectedDealer.status === "REJECTED") && (
                  <button
                    type="button"
                    disabled={decideMutation.isPending}
                    onClick={() => void handleDecision("REJECT")}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Reject Application
                  </button>
                )}

                {(selectedDealer.status === "PENDING" ||
                  selectedDealer.status === "VERIFIED") && (
                  <button
                    type="button"
                    disabled={decideMutation.isPending}
                    onClick={() => void handleDecision("SUSPEND")}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-amber-500/35 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Suspend &amp; Void Bids
                  </button>
                )}

                {selectedDealer.status !== "REVOKED" && (
                  <button
                    type="button"
                    disabled={decideMutation.isPending}
                    onClick={() => void handleDecision("REVOKE")}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-red-500/35 text-red-500 hover:bg-red-500/10 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Revoke Licence
                  </button>
                )}

                {(selectedDealer.status === "PENDING" ||
                  selectedDealer.status === "REJECTED" ||
                  selectedDealer.status === "SUSPENDED") && (
                  <button
                    type="button"
                    disabled={decideMutation.isPending}
                    onClick={() => void handleDecision("APPROVE")}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {decideMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Verify &amp; Activate Trading Floor Access</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
