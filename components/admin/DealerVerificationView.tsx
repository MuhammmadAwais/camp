"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  ExternalLink,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  FileText,
  Copy,
  Check,
  X,
  ArrowRight,
  Shield,
  FileCheck2,
  Download,
  Share2,
} from "lucide-react";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePagination } from "@/components/ui/TablePagination";

export type DealerApplication = {
  id: string;
  dealershipName: string;
  legalEntityName: string;
  regulator: "OMVIC" | "AMVIC" | "VSA" | "OPC";
  licenseNumber: string;
  city: string;
  province: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  serviceRadiusKm: number;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  licenseExpiry: string;
  notes?: string;
};

const INITIAL_DEALERS: DealerApplication[] = [
  {
    id: "app-pfaff-markham",
    dealershipName: "Pfaff Porsche Markham",
    legalEntityName: "Pfaff Automotive Partners Inc.",
    regulator: "OMVIC",
    licenseNumber: "OMVIC-481920",
    city: "Markham",
    province: "ON",
    address: "10500 Highway 48",
    contactName: "Christopher Evans",
    contactEmail: "c.evans@pfaffauto.com",
    contactPhone: "+1 (905) 555-8291",
    serviceRadiusKm: 100,
    submittedAt: "2026-10-26T14:30:00Z",
    status: "APPROVED",
    licenseExpiry: "2027-04-15",
    notes: "Verified against Ontario OMVIC public register. Valid dealership corporate charter.",
  },
  {
    id: "app-woodbine-ford",
    dealershipName: "Woodbine Ford Lincoln",
    legalEntityName: "Woodbine Motors Group Ltd.",
    regulator: "OMVIC",
    licenseNumber: "OMVIC-312984",
    city: "Etobicoke",
    province: "ON",
    address: "680 Rexdale Blvd",
    contactName: "Liam Henderson",
    contactEmail: "l.henderson@woodbineford.com",
    contactPhone: "+1 (416) 555-9018",
    serviceRadiusKm: 75,
    submittedAt: "2026-10-26T12:15:00Z",
    status: "PENDING",
    licenseExpiry: "2026-12-31",
  },
  {
    id: "app-stampede-toyota",
    dealershipName: "Stampede Toyota Commercial",
    legalEntityName: "Stampede Automotive Holdings Inc.",
    regulator: "AMVIC",
    licenseNumber: "AMVIC-849201",
    city: "Calgary",
    province: "AB",
    address: "3800 Barlow Trail NE",
    contactName: "Brett MacLeod",
    contactEmail: "b.macleod@stampedetoyota.com",
    contactPhone: "+1 (403) 555-3920",
    serviceRadiusKm: 150,
    submittedAt: "2026-10-25T18:40:00Z",
    status: "PENDING",
    licenseExpiry: "2027-02-28",
  },
  {
    id: "app-vancouver-audi",
    dealershipName: "OpenRoad Audi Vancouver",
    legalEntityName: "OpenRoad Auto Group Ltd.",
    regulator: "VSA",
    licenseNumber: "VSA-192840",
    city: "Vancouver",
    province: "BC",
    address: "2120 W 2nd Ave",
    contactName: "Chloe Zhang",
    contactEmail: "c.zhang@openroadautogroup.com",
    contactPhone: "+1 (604) 555-7482",
    serviceRadiusKm: 80,
    submittedAt: "2026-10-24T09:20:00Z",
    status: "PENDING",
    licenseExpiry: "2026-11-30",
  },
  {
    id: "app-laval-nissan",
    dealershipName: "HGregoire Nissan Chomedey",
    legalEntityName: "Groupe HGregoire Quebec Inc.",
    regulator: "OPC",
    licenseNumber: "OPC-992144",
    city: "Laval",
    province: "QC",
    address: "4299 Autoroute 440",
    contactName: "Maxime Tremblay",
    contactEmail: "m.tremblay@hgregoire.ca",
    contactPhone: "+1 (450) 555-1823",
    serviceRadiusKm: 120,
    submittedAt: "2026-10-23T11:00:00Z",
    status: "PENDING",
    licenseExpiry: "2027-06-30",
  },
];

export function DealerVerificationView() {
  const [dealers, setDealers] = useState<DealerApplication[]>(INITIAL_DEALERS);
  const [search, setSearch] = useState("");
  const [filterRegulator, setFilterRegulator] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [selectedDealer, setSelectedDealer] = useState<DealerApplication | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Checkbox multi-selection
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Lock body scroll when review modal is active
  useEffect(() => {
    if (reviewModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [reviewModalOpen]);

  // Operational metrics
  const counts = {
    PENDING: dealers.filter((d) => d.status === "PENDING").length,
    APPROVED: dealers.filter((d) => d.status === "APPROVED").length,
    REJECTED: dealers.filter((d) => d.status === "REJECTED").length,
    TOTAL: dealers.length,
  };

  // Filtered dataset
  const filtered = useMemo(() => {
    return dealers.filter((d) => {
      if (filterRegulator !== "ALL" && d.regulator !== filterRegulator) return false;
      if (filterStatus !== "ALL" && d.status !== filterStatus) return false;
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

  // Universal Table Sorting Hook
  const { sortedData, requestSort, isSorted } = useTableSort<DealerApplication>(filtered, {
    initialKey: "submittedAt",
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
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenReview = (dealer: DealerApplication) => {
    setSelectedDealer(dealer);
    setReviewNotes(dealer.notes || "");
    setReviewModalOpen(true);
  };

  const handleDecision = (newStatus: "APPROVED" | "REJECTED") => {
    if (!selectedDealer) return;

    setDealers((prev) =>
      prev.map((d) =>
        d.id === selectedDealer.id
          ? {
              ...d,
              status: newStatus,
              notes: reviewNotes.trim() || undefined,
            }
          : d
      )
    );

    setFeedbackNotice({
      text:
        newStatus === "APPROVED"
          ? `${selectedDealer.dealershipName} verified! Wholesale floor bidding access activated.`
          : `Application for ${selectedDealer.dealershipName} set to Rejected. Notice sent to dealer.`,
      type: newStatus === "APPROVED" ? "success" : "error",
    });

    setReviewModalOpen(false);
    setSelectedDealer(null);
    setTimeout(() => setFeedbackNotice(null), 5000);
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
          Dealer Licensing Verification Queue
        </h1>
        <p className="text-xs sm:text-sm text-portal-text-muted mt-1 max-w-3xl font-body">
          Validate commercial dealership credentials against Canadian provincial registries (OMVIC, AMVIC, VSA, OPC) before granting sealed-bid trading floor authorization.
        </p>
      </div>

      {/* 2. Operational Metrics Ribbon (Side-by-Side Prominent Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending */}
        <div
          onClick={() => setFilterStatus("PENDING")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
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
            <span className="text-xs font-semibold text-portal-text-muted">Dealerships</span>
          </div>
        </div>

        {/* Metric 2: Approved */}
        <div
          onClick={() => setFilterStatus("APPROVED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            filterStatus === "APPROVED"
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
              {counts.APPROVED}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Verified</span>
          </div>
        </div>

        {/* Metric 3: Rejected / Flagged */}
        <div
          onClick={() => setFilterStatus("REJECTED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            filterStatus === "REJECTED"
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
                License Inquiries
              </span>
              <span className="text-[11px] text-portal-text-muted block truncate mt-0.5">
                Revoked or rejected
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-portal-border/60 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-portal-text">
              {counts.REJECTED}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Disqualified</span>
          </div>
        </div>

        {/* Metric 4: Total Intake */}
        <div
          onClick={() => setFilterStatus("ALL")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
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
              {counts.TOTAL}
            </span>
            <span className="text-xs font-semibold text-portal-text-muted">Applications</span>
          </div>
        </div>
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

      {/* 3. Modern Reference Table Card Container (Matching Image 4) */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface shadow-xs overflow-hidden">
        {/* Table Header Strip */}
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
              Here you can inspect dealer compliance credentials, review licensing statuses, and approve wholesale floor access.
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
                placeholder="Search dealership, license..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/40 font-body"
              />
            </div>

            {/* Regulator Dropdown / Filter */}
            <div className="flex items-center gap-1">
              {["ALL", "OMVIC", "AMVIC", "VSA", "OPC"].map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setFilterRegulator(reg)}
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
                  <td colSpan={7} className="py-12 text-center text-portal-text-muted">
                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No dealer applications match your filter</p>
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
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={dealer.id}
                      className={`hover:bg-portal-surface-hover/50 transition-colors group ${
                        isChecked ? "bg-portal-primary/5" : ""
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(dealer.id)}
                          className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                        />
                      </td>

                      {/* Dealership: Icon Badge + Name (Matching Image 4 File Icon + Name style) */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-portal-surface-hover border border-portal-border flex items-center justify-center shrink-0 font-bold text-xs text-portal-text">
                            {monogram}
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

                      {/* Regulator & License Number */}
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
                            onClick={() => handleCopy(dealer.licenseNumber, dealer.id)}
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

                      {/* Jurisdiction */}
                      <td className="py-4 px-4 text-portal-text">
                        <span>
                          {dealer.city}, {dealer.province}
                        </span>
                        <span className="text-portal-text-muted text-xs block mt-0.5">
                          {dealer.serviceRadiusKm} km radius
                        </span>
                      </td>

                      {/* Purchasing Officer */}
                      <td className="py-4 px-4">
                        <span className="font-medium text-portal-text block">
                          {dealer.contactName}
                        </span>
                        <span className="text-portal-text-muted text-xs block mt-0.5">
                          {dealer.contactEmail}
                        </span>
                      </td>

                      {/* Status: Soft Pastel Pill Badge (Matching Image 4) */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            dealer.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : dealer.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              dealer.status === "APPROVED"
                                ? "bg-emerald-500"
                                : dealer.status === "PENDING"
                                ? "bg-amber-500 animate-pulse"
                                : "bg-red-500"
                            }`}
                          />
                          <span>
                            {dealer.status === "APPROVED"
                              ? "Verified"
                              : dealer.status === "PENDING"
                              ? "Under Review"
                              : "Rejected"}
                          </span>
                        </span>
                      </td>

                      {/* Action: Clean Review Button */}
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

        {/* 5. Enterprise Pagination Footer (Matching Image 4) */}
        <TablePagination
          currentPage={page}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* 6. Accessible Review & Verification Modal (Portaled) */}
      {reviewModalOpen && selectedDealer && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-portal-surface border border-portal-border rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 animate-scaleUp overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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
                    Application ID: <span className="font-mono text-portal-text">{selectedDealer.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded-lg text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Information Grid */}
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
                  Expires: {selectedDealer.licenseExpiry}
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
                  {selectedDealer.city}, {selectedDealer.province} • {selectedDealer.serviceRadiusKm} km Radius
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-portal-text-muted">
                  Designated Purchasing Officer
                </span>
                <p className="font-bold text-portal-text">
                  {selectedDealer.contactName}
                </p>
                <p className="text-portal-text-muted text-[11px]">
                  {selectedDealer.contactEmail} • {selectedDealer.contactPhone}
                </p>
              </div>
            </div>

            {/* Document Certificate Verification Stage */}
            <div className="p-4 rounded-xl border border-portal-border bg-portal-surface-hover/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-portal-primary shrink-0" />
                <div>
                  <p className="font-bold text-xs text-portal-text">
                    Official Provincial Motor Vehicle Dealer Certificate (PDF)
                  </p>
                  <p className="text-[11px] text-portal-text-muted mt-0.5 font-mono">
                    SHA-256: d41d8cd98f00b204e9800998ecf8427e • Verified Clean
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                Seal Valid
              </span>
            </div>

            {/* Compliance Review Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-portal-text block">
                Verification Findings &amp; Audit Rationale
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add verification notes, OMVIC registrar confirmation number, or reasons for requested amendment..."
                rows={3}
                className="w-full p-3 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs focus:ring-2 focus:ring-portal-primary/40 focus:outline-none placeholder:text-portal-text-muted"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-portal-border">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDecision("REJECTED")}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold cursor-pointer transition-colors"
              >
                Reject Application
              </button>
              <button
                type="button"
                onClick={() => handleDecision("APPROVED")}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                Verify &amp; Activate Trading Floor Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
