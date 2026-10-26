"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  Download,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Receipt,
  FileText,
  Sparkles,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePagination } from "@/components/ui/TablePagination";

interface Invoice {
  id: string;
  date: string;
  year: string;
  amountCents: number;
  status: "PAID" | "FAILED";
  description: string;
  plan: "Basic" | "Pro" | "Premium" | "Elite";
}

const INITIAL_INVOICES: Invoice[] = [
  {
    id: "INV-2026-1049",
    date: "June 25, 2026",
    year: "2026",
    amountCents: 2500, // $25.00 CAD
    status: "PAID",
    description: "Invoice #011 - Jun 2026",
    plan: "Basic",
  },
  {
    id: "INV-2026-0910",
    date: "June 25, 2026",
    year: "2026",
    amountCents: 3500, // $35.00 CAD
    status: "PAID",
    description: "Invoice #010 - May 2026",
    plan: "Pro",
  },
  {
    id: "INV-2026-0809",
    date: "June 25, 2026",
    year: "2026",
    amountCents: 4000, // $40.00 CAD
    status: "FAILED",
    description: "Invoice #009 - Apr 2026",
    plan: "Premium",
  },
  {
    id: "INV-2026-0708",
    date: "June 25, 2026",
    year: "2026",
    amountCents: 1500, // $15.00 CAD
    status: "PAID",
    description: "Invoice #008 - Mar 2026",
    plan: "Elite",
  },
  {
    id: "INV-2026-0607",
    date: "June 25, 2026",
    year: "2026",
    amountCents: 2500, // $25.00 CAD
    status: "PAID",
    description: "Invoice #007 - Feb 2026",
    plan: "Pro",
  },
  {
    id: "INV-2026-0506",
    date: "June 25, 2026",
    year: "2026",
    amountCents: 3500, // $35.00 CAD
    status: "FAILED",
    description: "Invoice #006 - Jan 2026",
    plan: "Basic",
  },
  {
    id: "INV-2025-0405",
    date: "June 25, 2026",
    year: "2025",
    amountCents: 2500, // $25.00 CAD
    status: "PAID",
    description: "Invoice #005 - Dec 2025",
    plan: "Basic",
  },
];

export function DealerBillingView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set(["INV-2026-1049", "INV-2026-0910", "INV-2026-0607"]));
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const currentPlan = {
    name: "Commercial Pro Plan",
    cycle: "Annual (CAD $799.00 / month)",
    bidsUsed: 14,
    bidsTotal: 50,
    renewsAt: "November 15, 2026",
    paymentMethod: "Mastercard •••• 4918 (Exp 08/28)",
  };

  const filteredInvoices = useMemo(() => {
    return INITIAL_INVOICES.filter((inv) => {
      const matchesSearch =
        inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.plan.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === "ALL" || inv.year === selectedYear;
      return matchesSearch && matchesYear;
    });
  }, [searchQuery, selectedYear]);

  const { sortedData, requestSort, isSorted } = useTableSort(filteredInvoices);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSelectAll = () => {
    if (paginatedInvoices.length === 0) return;
    const allOnPageSelected = paginatedInvoices.every((inv) => selectedRows.has(inv.id));
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
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRows(next);
  };

  const handleDownloadPdf = (invoiceId: string) => {
    setDownloadSuccess(`CRA Tax Receipt ${invoiceId}.pdf downloaded`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 space-y-8 font-body animate-in fade-in duration-300">
      {/* Clean Unboxed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-headline">
            Invoices & Billing
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your monthly sealed-bid quota, review plan details, and download CRA/GST tax receipts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Link
            href="/dealer/subscription"
            className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Change Plan
          </Link>
          <button
            type="button"
            onClick={() => alert("Stripe Customer Portal opening in secure billing session...")}
            className="px-4 py-2.5 rounded-xl bg-primary dark:bg-secondary text-white font-semibold text-xs shadow-xs hover:opacity-95 transition-opacity inline-flex items-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Open Stripe Portal</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* Download Alert Toast */}
      {downloadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Overview Metric Cards Grid: Quota Gauge + Active Subscription */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Card 1: Monthly Bid Quota */}
        <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Monthly Sealed-Bid Quota
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary dark:bg-secondary/15 dark:text-secondary">
                {currentPlan.bidsTotal - currentPlan.bidsUsed} Bids Remaining
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                {currentPlan.bidsUsed}
              </span>
              <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500">
                / {currentPlan.bidsTotal} bids used this period
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-primary dark:bg-secondary rounded-full transition-all duration-500"
                style={{ width: `${(currentPlan.bidsUsed / currentPlan.bidsTotal) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-4 border-t border-neutral-100 dark:border-white/5 mt-4">
            <span>Period resets on <strong>Nov 1, 2026</strong></span>
            <Link
              href="/dealer/subscription"
              className="font-semibold text-primary dark:text-secondary hover:underline"
            >
              Need more bids?
            </Link>
          </div>
        </div>

        {/* Card 2: Current Subscription Summary */}
        <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Active Subscription
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Active & Good Standing
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white font-headline">
              {currentPlan.name}
            </h3>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
              {currentPlan.cycle}
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-white/5 mt-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Payment Method</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                {currentPlan.paymentMethod}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Next Scheduled Renewal</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {currentPlan.renewsAt}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table Section Matching Reference Design (Image 4) */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/60 overflow-hidden shadow-xs">
        {/* Table Header Strip */}
        <div className="p-6 border-b border-neutral-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-headline">
                Billing History
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-secondary/15 dark:text-secondary border border-primary/20 dark:border-secondary/30">
                {filteredInvoices.length} Total
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-body">
              Here you will see your billing history, monthly sealed-bid charges, and CRA/GST tax receipts.
            </p>
          </div>

          {/* Action Tools: Export, Download & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/30 font-body"
              />
            </div>

            {/* Year Filter Tabs */}
            <div className="inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
              {(["ALL", "2026", "2025"] as const).map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                    selectedYear === year
                      ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {year === "ALL" ? "All" : year}
                </button>
              ))}
            </div>

            {/* Export Outline Button */}
            <button
              type="button"
              onClick={() => {
                setDownloadSuccess("Exporting billing history report (CSV)...");
                setTimeout(() => setDownloadSuccess(null), 3000);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Table Surface */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-body">
            <thead>
              <tr className="border-b border-neutral-200/80 dark:border-white/5 bg-neutral-50/60 dark:bg-neutral-800/40 text-neutral-500 dark:text-neutral-400">
                <th className="py-3.5 pl-6 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedInvoices.length > 0 &&
                      paginatedInvoices.every((inv) => selectedRows.has(inv.id))
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                </th>
                <SortableHeader
                  label="Invoice"
                  direction={isSorted("description")}
                  onSort={() => requestSort("description")}
                />
                <SortableHeader
                  label="Billing Date"
                  direction={isSorted("date")}
                  onSort={() => requestSort("date")}
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
                  direction={isSorted("plan")}
                  onSort={() => requestSort("plan")}
                />
                <th className="py-3.5 pr-6 pl-4 text-right text-xs font-semibold text-neutral-400">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv) => {
                  const isChecked = selectedRows.has(inv.id);
                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors group ${
                        isChecked ? "bg-primary/5 dark:bg-secondary/10" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(inv.id)}
                          className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                      </td>

                      {/* Invoice: Icon Badge + Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-secondary/15 border border-primary/20 dark:border-secondary/30 flex items-center justify-center shrink-0 text-primary dark:text-secondary">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 dark:text-white text-sm block group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                              {inv.description}
                            </span>
                            <span className="text-xs text-neutral-400 font-mono block mt-0.5">
                              {inv.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Billing Date */}
                      <td className="py-4 px-4 text-neutral-600 dark:text-neutral-300">
                        {inv.date}
                      </td>

                      {/* Status: Soft Pastel Pill Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            inv.status === "PAID"
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/30"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 border border-rose-200/60 dark:border-rose-500/30"
                          }`}
                        >
                          {inv.status === "PAID" ? "Paid" : "Failed"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 font-semibold text-neutral-900 dark:text-white text-sm">
                        {formatCadCents(inv.amountCents)}
                      </td>

                      {/* Plan */}
                      <td className="py-4 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                        {inv.plan}
                      </td>

                      {/* Action: Tax Receipt Download */}
                      <td className="py-4 pr-6 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(inv.id)}
                          className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Download CRA Tax Receipt"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">No invoices match your filter</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedYear("ALL");
                      }}
                      className="text-xs font-semibold text-primary dark:text-secondary mt-1 hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Table Pagination Footer */}
        <TablePagination
          currentPage={currentPage}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
