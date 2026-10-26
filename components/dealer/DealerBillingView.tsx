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
  ArrowUpDown,
  FileText,
  Sparkles,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";

interface Invoice {
  id: string;
  date: string;
  year: string;
  amountCents: number;
  status: "PAID" | "PENDING";
  description: string;
}

const INITIAL_INVOICES: Invoice[] = [
  {
    id: "INV-2026-1049",
    date: "Oct 15, 2026",
    year: "2026",
    amountCents: 958800, // $9,588.00 CAD (Annual Pre-pay)
    status: "PAID",
    description: "AutoNexa Commercial Pro Plan (Annual Pre-pay)",
  },
  {
    id: "INV-2026-0418",
    date: "Apr 15, 2026",
    year: "2026",
    amountCents: 35000, // $350.00 CAD
    status: "PAID",
    description: "Additional Sealed-Bid Capacity Block (+25 Bids)",
  },
  {
    id: "INV-2025-0912",
    date: "Oct 15, 2025",
    year: "2025",
    amountCents: 958800,
    status: "PAID",
    description: "AutoNexa Commercial Pro Plan (Annual Pre-pay)",
  },
  {
    id: "INV-2025-0320",
    date: "Mar 20, 2025",
    year: "2025",
    amountCents: 119700,
    status: "PAID",
    description: "Wholesale Basic Plan (Quarterly Settlement)",
  },
];

export function DealerBillingView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

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
        inv.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === "ALL" || inv.year === selectedYear;
      return matchesSearch && matchesYear;
    }).sort((a, b) => {
      if (sortOrder === "desc") {
        return b.amountCents - a.amountCents;
      }
      return a.amountCents - b.amountCents;
    });
  }, [searchQuery, selectedYear, sortOrder]);

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

      {/* Invoices Table Section with Real Search & Filter Controls */}
      <div className="space-y-4">
        {/* Controls Row: Title, Search, Year Filter Tabs, and Sorting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-headline">
              Tax Invoices & Receipts
            </h2>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              (CRA / GST Compliant)
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
              />
            </div>

            {/* Year Filter Tabs */}
            <div className="inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-white/5 text-xs">
              {(["ALL", "2026", "2025"] as const).map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                    selectedYear === year
                      ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {year === "ALL" ? "All Years" : year}
                </button>
              ))}
            </div>

            {/* Sort Amount Button */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
              title="Sort by amount"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <span>{sortOrder === "desc" ? "Highest" : "Lowest"}</span>
            </button>
          </div>
        </div>

        {/* Invoices Table Card */}
        <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/40 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200/80 dark:border-white/5 bg-neutral-50/75 dark:bg-neutral-800/50 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Invoice #</th>
                  <th className="py-3.5 px-4 font-semibold">Billing Date</th>
                  <th className="py-3.5 px-4 font-semibold">Description</th>
                  <th className="py-3.5 px-4 font-semibold">Amount (CAD)</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Tax Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">
                        {inv.id}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500 dark:text-neutral-400">
                        {inv.date}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 dark:text-neutral-200">
                        {inv.description}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">
                        {formatCadCents(inv.amountCents)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(inv.id)}
                          className="px-3 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-neutral-400" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400">
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
        </div>
      </div>
    </div>
  );
}
