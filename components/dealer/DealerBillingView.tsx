"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Download,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";

export function DealerBillingView() {
  const currentPlan = {
    name: "Commercial Pro Plan",
    cycle: "Annual (CAD $799.00 / month)",
    bidsUsed: 14,
    bidsTotal: 50,
    renewsAt: "Nov 15, 2026",
    paymentMethod: "Mastercard ending in 4918 (Exp 08/28)",
  };

  const invoices = [
    {
      id: "INV-2026-1049",
      date: "Oct 15, 2026",
      amountCents: 958800, // $9,588.00 CAD (Annual)
      status: "PAID",
      description: "AutoNexa Commercial Pro Plan (Annual Pre-pay)",
      pdfUrl: "#",
    },
    {
      id: "INV-2025-0912",
      date: "Oct 15, 2025",
      amountCents: 958800,
      status: "PAID",
      description: "AutoNexa Commercial Pro Plan (Annual Pre-pay)",
      pdfUrl: "#",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary text-xs font-bold font-mono uppercase tracking-wider">
              Finance & Invoicing
            </span>
            <span className="text-xs text-portal-text-muted font-mono">
              Pfaff Porsche (OMVIC-481920)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline">
            Dealership Invoices & Quotas
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Manage your monthly sealed-bid quota, download CRA/GST tax receipts, and update Stripe payment methods.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Stripe Customer Portal will open in new tab.")}
          className="px-4 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>Open Stripe Portal</span>
        </button>
      </div>

      {/* Grid: Quota Gauge + Current Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Bid Quota Card */}
        <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text">
              October 2026 Bid Quota
            </span>
            <span className="text-xs font-mono font-bold text-portal-primary">
              {currentPlan.bidsUsed} of {currentPlan.bidsTotal} Used
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-portal-surface-hover overflow-hidden">
            <div
              className="h-full bg-portal-primary rounded-full transition-all duration-500"
              style={{ width: `${(currentPlan.bidsUsed / currentPlan.bidsTotal) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-portal-text-muted font-mono pt-1">
            <span>36 Bids Remaining This Period</span>
            <span>Resets Nov 1, 2026</span>
          </div>

          <p className="text-[11px] text-portal-text-muted pt-2 border-t border-portal-border">
            Unused monthly sealed bids do not roll over. Upgrade to Enterprise for unlimited provincial volume.
          </p>
        </div>

        {/* Current Plan & Billing Profile */}
        <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-portal-border">
            <span className="font-bold text-portal-text uppercase tracking-wider">
              Active Subscription
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">
              Active &amp; Good Standing
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-portal-text-muted">Tier:</span>
              <span className="font-bold text-portal-text">{currentPlan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-portal-text-muted">Billing Cycle:</span>
              <span className="text-portal-text">{currentPlan.cycle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-portal-text-muted">Payment Method:</span>
              <span className="text-portal-text">{currentPlan.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-portal-text-muted">Next Invoice:</span>
              <span className="text-portal-text">{currentPlan.renewsAt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-portal-border bg-portal-surface-hover/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-portal-primary" />
            <h2 className="text-sm font-bold text-portal-text uppercase tracking-wider font-mono">
              Tax Invoices &amp; Receipts (CRA / GST)
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-portal-border bg-portal-surface-hover/70 font-mono text-[11px] uppercase tracking-wider text-portal-text-muted">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Billing Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Amount (CAD)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">PDF Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border font-mono">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-portal-surface-hover/40 transition-colors">
                  <td className="p-4 font-bold text-portal-text">{inv.id}</td>
                  <td className="p-4 text-portal-text-muted">{inv.date}</td>
                  <td className="p-4 text-portal-text font-sans">{inv.description}</td>
                  <td className="p-4 font-black text-portal-text">{formatCadCents(inv.amountCents)}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => alert(`Downloading PDF for ${inv.id}`)}
                      className="px-2.5 py-1 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-[11px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
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
