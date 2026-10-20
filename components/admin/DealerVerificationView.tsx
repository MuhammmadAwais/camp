"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  FileBadge,
  MapPin,
  ExternalLink,
  Search,
  Filter,
  AlertTriangle,
  Clock,
} from "lucide-react";

export type DealerApplication = {
  id: string;
  dealershipName: string;
  legalEntityName: string;
  regulator: "OMVIC" | "AMVIC" | "VSA" | "OPC";
  licenseNumber: string;
  city: string;
  province: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  serviceRadiusKm: number;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
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
    contactName: "Christopher Evans",
    contactEmail: "c.evans@pfaffauto.com",
    contactPhone: "+1 (905) 555-8291",
    serviceRadiusKm: 100,
    submittedAt: "2 hours ago",
    status: "APPROVED",
  },
  {
    id: "app-woodbine-ford",
    dealershipName: "Woodbine Ford Lincoln",
    legalEntityName: "Woodbine Motors Group Ltd.",
    regulator: "OMVIC",
    licenseNumber: "OMVIC-312984",
    city: "Etobicoke",
    province: "ON",
    contactName: "Liam Henderson",
    contactEmail: "l.henderson@woodbineford.com",
    contactPhone: "+1 (416) 555-9018",
    serviceRadiusKm: 75,
    submittedAt: "3 hours ago",
    status: "PENDING",
  },
  {
    id: "app-stampede-toyota",
    dealershipName: "Stampede Toyota Commercial",
    legalEntityName: "Stampede Automotive Holdings Inc.",
    regulator: "AMVIC",
    licenseNumber: "AMVIC-849201",
    city: "Calgary",
    province: "AB",
    contactName: "Brett MacLeod",
    contactEmail: "b.macleod@stampedetoyota.com",
    contactPhone: "+1 (403) 555-3920",
    serviceRadiusKm: 150,
    submittedAt: "Yesterday",
    status: "PENDING",
  },
  {
    id: "app-vancouver-audi",
    dealershipName: "OpenRoad Audi Vancouver",
    legalEntityName: "OpenRoad Auto Group Ltd.",
    regulator: "VSA",
    licenseNumber: "VSA-192840",
    city: "Vancouver",
    province: "BC",
    contactName: "Chloe Zhang",
    contactEmail: "c.zhang@openroadautogroup.com",
    contactPhone: "+1 (604) 555-7482",
    serviceRadiusKm: 80,
    submittedAt: "2 days ago",
    status: "PENDING",
  },
];

export function DealerVerificationView() {
  const [dealers, setDealers] = useState<DealerApplication[]>(INITIAL_DEALERS);
  const [search, setSearch] = useState("");
  const [filterRegulator, setFilterRegulator] = useState("ALL");
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = dealers.filter((d) => {
    if (filterRegulator !== "ALL" && d.regulator !== filterRegulator) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.dealershipName.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = (id: string, newStatus: "APPROVED" | "REJECTED") => {
    setDealers(dealers.map((d) => (d.id === id ? { ...d, status: newStatus } : d)));
    setNotice(
      newStatus === "APPROVED"
        ? `Dealer ${id} approved! Account activated for sealed bidding.`
        : `Dealer ${id} application rejected.`
    );
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary text-xs font-bold font-mono uppercase tracking-wider">
              Provincial Compliance
            </span>
            <span className="text-xs text-portal-text-muted font-mono">
              Registrar Cross-Verification
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline">
            Dealer Licensing Verification Queue
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Validate pending dealership accounts against provincial registries (OMVIC, AMVIC, VSA, OPC) before permitting sealed bids.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-xl bg-portal-surface-hover border border-portal-border text-right font-mono">
            <span className="text-[10px] uppercase font-bold text-portal-text-muted block">
              Pending Validation
            </span>
            <span className="text-xl font-black text-portal-primary">
              {dealers.filter((d) => d.status === "PENDING").length} Dealerships
            </span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
          {["ALL", "OMVIC", "AMVIC", "VSA", "OPC"].map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setFilterRegulator(reg)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                filterRegulator === reg
                  ? "bg-portal-primary text-white"
                  : "bg-portal-surface-hover text-portal-text-muted hover:text-portal-text"
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dealer, license..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-portal-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-portal-border bg-portal-surface-hover/70 font-mono text-[11px] uppercase tracking-wider text-portal-text-muted">
                <th className="p-4">Dealership &amp; Entity</th>
                <th className="p-4">Regulator &amp; License</th>
                <th className="p-4">Jurisdiction</th>
                <th className="p-4">Contact Person</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {filtered.map((dealer) => (
                <tr key={dealer.id} className="hover:bg-portal-surface-hover/40 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-portal-text block">{dealer.dealershipName}</span>
                    <span className="text-[11px] text-portal-text-muted">{dealer.legalEntityName}</span>
                  </td>
                  <td className="p-4 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-portal-primary/10 text-portal-primary font-bold text-[10px]">
                        {dealer.regulator}
                      </span>
                      <span className="font-bold text-portal-text">{dealer.licenseNumber}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono">
                    <span className="text-portal-text block">
                      {dealer.city}, {dealer.province}
                    </span>
                    <span className="text-[10px] text-portal-text-muted block">
                      {dealer.serviceRadiusKm} km radius
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-portal-text block">{dealer.contactName}</span>
                    <span className="font-mono text-[11px] text-portal-text-muted block">
                      {dealer.contactEmail}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase inline-block ${
                        dealer.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : dealer.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {dealer.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {dealer.status === "PENDING" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(dealer.id, "APPROVED")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(dealer.id, "REJECTED")}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 font-mono text-[11px] transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-portal-text-muted">Verified</span>
                    )}
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
