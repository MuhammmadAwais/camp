"use client";

import React, { Suspense, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { ApiError } from "@/lib/api-client";
import {
  getDealerInvoicesCsvUrl,
  useDealerInvoices,
  useLaunchDealerBillingPortal,
} from "@/hooks/useDealerBilling";
import type { DealerInvoiceItem } from "@/lib/types/dealer";
import { formatCadCents } from "@/lib/utils";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePagination } from "@/components/ui/TablePagination";

const emptySubscribe = () => () => {};
const EMPTY_INVOICES: DealerInvoiceItem[] = [];

function triggerReceiptDownload(
  inv: DealerInvoiceItem,
  dealershipName: string
) {
  if (inv.invoicePdfUrl) {
    window.open(inv.invoicePdfUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const lines = [
    "AUTONEXA WHOLESALE EXCHANGE — OFFICIAL CAD INVOICE RECEIPT",
    "============================================================",
    `Dealership:      ${dealershipName}`,
    `Invoice Number:  ${inv.invoiceNumber}`,
    `Billing Date:    ${inv.billingDateIso}`,
    `Status:          ${inv.status}`,
    `Plan Tier:       ${inv.planName}`,
    `Description:     ${inv.description}`,
    `Amount:          ${formatCadCents(inv.amountCents)} ${inv.currency}`,
    inv.stripeInvoiceId ? `Stripe Invoice:  ${inv.stripeInvoiceId}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${inv.invoiceNumber}-receipt.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function DealerBillingContent() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [noticeBanner, setNoticeBanner] = useState<{
    tone: "success" | "warning" | "error";
    text: string;
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const { data, isLoading, isError, error, refetch } = useDealerInvoices({
    year: selectedYear,
    search: searchQuery,
  });
  const launchPortal = useLaunchDealerBillingPortal();

  const invoices = data?.items ?? EMPTY_INVOICES;
  const sub = data?.subscription ?? null;
  const summary = data?.summary ?? {
    totalInvoicesCount: 0,
    totalPaidCents: 0,
    bidsUsed: 0,
    bidsTotal: 0,
    remainingBids: 0,
  };

  const { sortedData, requestSort, isSorted } = useTableSort(invoices);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedInvoices = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safePage, pageSize]);

  const handleSelectAll = () => {
    if (paginatedInvoices.length === 0) return;
    const allOnPageSelected = paginatedInvoices.every((inv) =>
      selectedRows.has(inv.id)
    );
    const next = new Set(selectedRows);
    if (allOnPageSelected) {
      paginatedInvoices.forEach((inv) => next.delete(inv.id));
    } else {
      paginatedInvoices.forEach((inv) => next.add(inv.id));
    }
    setSelectedRows(next);
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const handleOpenStripePortal = async () => {
    setNoticeBanner(null);
    try {
      const res = await launchPortal.mutateAsync();
      window.location.assign(res.portalUrl);
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.failure.code === "BILLING_NOT_CONFIGURED"
      ) {
        setNoticeBanner({
          tone: "warning",
          text: err.message,
        });
      } else {
        setNoticeBanner({
          tone: "error",
          text:
            err instanceof ApiError
              ? err.message
              : "Unable to open Stripe Customer Portal.",
        });
      }
    }
  };

  const handleExportCsv = () => {
    const csvUrl = getDealerInvoicesCsvUrl({
      year: selectedYear,
      search: searchQuery,
    });
    setNoticeBanner({
      tone: "success",
      text: "Downloading dealership CAD billing ledger CSV...",
    });
    window.location.assign(csvUrl);
  };

  const formatBillingDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    if (!mounted) return iso.slice(0, 10);
    return new Date(iso).toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const quotaPct =
    summary.bidsTotal > 0
      ? Math.min(100, Math.round((summary.bidsUsed / summary.bidsTotal) * 100))
      : 0;

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 space-y-8 font-body animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-portal-text font-headline">
            Invoices &amp; Billing
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Manage your monthly sealed-bid quota, inspect subscription status, and download persisted CAD invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Link
            href="/dealer/subscription"
            className="px-4 py-2.5 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Change Plan
          </Link>
          <button
            type="button"
            disabled={launchPortal.isPending || isError}
            onClick={() => void handleOpenStripePortal()}
            className="px-4 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white font-semibold text-xs shadow-xs transition-opacity inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {launchPortal.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            <span>Open Stripe Portal</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* Checkout Success Banner */}
      {checkoutSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>
            Stripe Checkout completed — subscription quota and invoice history synchronize automatically via Stripe webhook.
          </span>
        </div>
      )}

      {/* Action Feedback Banner */}
      {noticeBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            noticeBanner.tone === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
              : noticeBanner.tone === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              : "bg-red-500/10 border-red-500/30 text-red-500"
          }`}
        >
          <div className="flex items-center gap-2">
            {noticeBanner.tone === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{noticeBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNoticeBanner(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Error State Banner */}
      {isError && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {error instanceof ApiError
                ? error.message
                : "Failed to load dealership billing history."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold cursor-pointer self-start sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-portal-text-muted">
                Monthly Sealed-Bid Quota
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-portal-primary/10 text-portal-primary">
                {summary.remainingBids} Bids Remaining
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-portal-text tracking-tight">
                {summary.bidsUsed}
              </span>
              <span className="text-sm font-medium text-portal-text-muted">
                / {summary.bidsTotal} bids used this period
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-portal-surface-hover overflow-hidden">
              <div
                className="h-full bg-portal-primary rounded-full transition-all duration-500"
                style={{ width: `${quotaPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-portal-text-muted pt-4 border-t border-portal-border/60 mt-4">
            <span>
              Period resets on{" "}
              <strong className="text-portal-text">
                {formatBillingDate(sub?.currentPeriodEnd)}
              </strong>
            </span>
            <Link
              href="/dealer/subscription"
              className="font-semibold text-portal-primary hover:underline"
            >
              Need more bids?
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-portal-text-muted">
                Active Subscription
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  sub?.status === "ACTIVE" || sub?.status === "TRIALING"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full inline-block ${
                    sub?.status === "ACTIVE" || sub?.status === "TRIALING"
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />
                {sub?.status ?? "UNSUBSCRIBED"}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-portal-text font-headline">
              {sub ? `${sub.planName} Plan` : "No Active Plan"}
            </h3>
            <p className="text-xs font-medium text-portal-text-muted mt-0.5">
              {sub
                ? `${
                    sub.billingInterval === "year" ? "Annual" : "Monthly"
                  } (${formatCadCents(sub.priceCents)} CAD / ${
                    sub.billingInterval
                  })`
                : data?.dealershipName ?? "Verified Dealership"}
            </p>
          </div>

          <div className="pt-4 border-t border-portal-border/60 mt-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-portal-text-muted">Billing Account</span>
              <span className="font-medium text-portal-text">
                {sub?.stripeCustomerLinked
                  ? "Stripe Customer Linked"
                  : "Managed Dealership Billing"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-portal-text-muted">
                Next Scheduled Renewal
              </span>
              <span className="font-semibold text-portal-text">
                {formatBillingDate(sub?.currentPeriodEnd)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table Section */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface overflow-hidden shadow-xs">
        <div className="p-6 border-b border-portal-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-portal-text font-headline">
                Billing History
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
                {invoices.length} Total
              </span>
            </div>
            <p className="text-xs text-portal-text-muted mt-1 font-body">
              Persisted dealership subscription invoices and CAD receipts for{" "}
              {data?.dealershipName ?? "your dealership"}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice #..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30 font-body"
              />
            </div>

            <div className="inline-flex items-center p-1 rounded-xl bg-portal-surface-hover border border-portal-border text-xs">
              {(["ALL", "2026", "2025"] as const).map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    setSelectedYear(year);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                    selectedYear === year
                      ? "bg-portal-surface text-portal-text font-bold shadow-2xs"
                      : "text-portal-text-muted hover:text-portal-text"
                  }`}
                >
                  {year === "ALL" ? "All" : year}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isLoading || isError}
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs font-semibold hover:bg-portal-surface-hover transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-portal-text-muted" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-body">
            <thead>
              <tr className="border-b border-portal-border/60 bg-portal-surface-hover/30 text-portal-text-muted">
                <th className="py-3.5 pl-6 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedInvoices.length > 0 &&
                      paginatedInvoices.every((inv) => selectedRows.has(inv.id))
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                  />
                </th>
                <SortableHeader
                  label="Invoice"
                  direction={isSorted("description")}
                  onSort={() => requestSort("description")}
                />
                <SortableHeader
                  label="Billing Date"
                  direction={isSorted("billingDateIso")}
                  onSort={() => requestSort("billingDateIso")}
                />
                <SortableHeader
                  label="Status"
                  direction={isSorted("status")}
                  onSort={() => requestSort("status")}
                />
                <SortableHeader
                  label="Amount"
                  direction={isSorted("amountCents")}
                  onSort={() => requestSort("amountCents")}
                />
                <SortableHeader
                  label="Plan"
                  direction={isSorted("planName")}
                  onSort={() => requestSort("planName")}
                />
                <th className="py-3.5 pr-6 pl-4 text-right text-xs font-semibold text-portal-text-muted">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border/40">
              {isLoading && paginatedInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-14 text-center text-portal-text-muted"
                  >
                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-portal-primary" />
                    <p className="text-xs font-medium">
                      Loading dealership billing invoices...
                    </p>
                  </td>
                </tr>
              ) : paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv) => {
                  const isChecked = selectedRows.has(inv.id);
                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-portal-surface-hover/50 transition-colors group ${
                        isChecked ? "bg-portal-primary/5" : ""
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(inv.id)}
                          className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-portal-primary/10 border border-portal-primary/20 flex items-center justify-center shrink-0 text-portal-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-portal-text text-sm block group-hover:text-portal-primary transition-colors">
                              {inv.description}
                            </span>
                            <span className="text-xs text-portal-text-muted font-mono block mt-0.5">
                              {inv.invoiceNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-portal-text-muted">
                        {formatBillingDate(inv.billingDateIso)}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                            inv.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : inv.status === "FAILED"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-semibold text-portal-text text-sm">
                        {formatCadCents(inv.amountCents)}
                      </td>

                      <td className="py-4 px-4 text-portal-text-muted font-medium">
                        {inv.planName}
                      </td>

                      <td className="py-4 pr-6 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            triggerReceiptDownload(
                              inv,
                              data?.dealershipName ?? "AutoNexa Dealership"
                            );
                            setNoticeBanner({
                              tone: "success",
                              text: `Receipt ${inv.invoiceNumber} downloaded.`,
                            });
                          }}
                          className="p-1.5 rounded-lg border border-portal-border hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text transition-colors cursor-pointer"
                          title="Download CAD Invoice Receipt"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-portal-text-muted"
                  >
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">
                      No invoices match your filter
                    </p>
                    {(searchQuery || selectedYear !== "ALL") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedYear("ALL");
                          setCurrentPage(1);
                        }}
                        className="text-xs font-semibold text-portal-primary mt-1 hover:underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={safePage}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export function DealerBillingView() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-6xl mx-auto py-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-portal-primary" />
        </div>
      }
    >
      <DealerBillingContent />
    </Suspense>
  );
}
