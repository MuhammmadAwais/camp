"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ShieldCheck,
  MapPin,
  ArrowRight,
  CheckCircle2,
  FileBadge,
  Phone,
  Mail,
  User,
  Sliders,
  Sparkles,
} from "lucide-react";

export function DealerRegisterView() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    dealershipName: "",
    legalEntityName: "",
    regulator: "OMVIC",
    licenseNumber: "",
    streetAddress: "",
    city: "",
    province: "ON",
    postalCode: "",
    contactName: "",
    contactTitle: "General Manager",
    contactEmail: "",
    contactPhone: "",
    serviceRadiusKm: 75,
    agreeOmvicEthics: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 800);
  };

  const handleFillDemo = () => {
    setFormData({
      dealershipName: "Pfaff Porsche Markham",
      legalEntityName: "Pfaff Automotive Partners Inc.",
      regulator: "OMVIC",
      licenseNumber: "OMVIC-481920",
      streetAddress: "1050 Burloak Drive",
      city: "Markham",
      province: "ON",
      postalCode: "L6M 4W9",
      contactName: "Christopher Evans",
      contactTitle: "Wholesale Acquisitions Director",
      contactEmail: "c.evans@pfaffauto.com",
      contactPhone: "+1 (905) 555-8291",
      serviceRadiusKm: 100,
      agreeOmvicEthics: true,
    });
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline">
            Licensing Application Received
          </h2>
          <p className="text-sm text-portal-text-muted max-w-md mx-auto leading-relaxed">
            Your application for <strong>{formData.dealershipName}</strong> ({formData.regulator} #{formData.licenseNumber}) has been submitted to the platform compliance queue.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-portal-surface border border-portal-border text-left font-mono text-xs space-y-2">
          <div className="flex justify-between py-1 border-b border-portal-border/50">
            <span className="text-portal-text-muted">Licensing Body:</span>
            <span className="font-bold text-portal-text">{formData.regulator} Verified Directory</span>
          </div>
          <div className="flex justify-between py-1 border-b border-portal-border/50">
            <span className="text-portal-text-muted">Target Operating Radius:</span>
            <span className="font-bold text-portal-text">{formData.serviceRadiusKm} km</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-portal-text-muted">Expected Review Time:</span>
            <span className="font-bold text-emerald-500">Same-Day Express (&lt; 2 Hours)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dealer/inventory"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all shadow-md"
          >
            Enter Dealer Trading Floor
          </Link>
          <Link
            href="/admin/dealers"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-bold transition-colors"
          >
            View in Admin Verification Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-portal-border">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary text-xs font-bold font-mono uppercase tracking-wider border border-portal-primary/20">
                Dealer Onboarding
              </span>
              <span className="text-xs text-portal-text-muted font-mono">
                OMVIC / AMVIC / VSA Licensed Only
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline">
              Register Dealership Exchange Account
            </h1>
            <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
              Gain exclusive access to private Canadian consumer trade-in auctions before public listing.
            </p>
          </div>

          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-portal-border bg-portal-surface-hover hover:border-portal-primary text-xs font-mono text-portal-text-muted hover:text-portal-text transition-colors self-start cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-portal-primary" />
            <span>Auto-Fill Demo</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Business Identity */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text flex items-center gap-2">
              <Building2 className="w-4 h-4 text-portal-primary" />
              1. Dealership Legal Identity & Licensing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">
                  Trade / DBA Dealership Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.dealershipName}
                  onChange={(e) => setFormData({ ...formData, dealershipName: e.target.value })}
                  placeholder="e.g. Pfaff Porsche Markham"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-portal-primary focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">
                  Registered Corporate Legal Entity Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.legalEntityName}
                  onChange={(e) => setFormData({ ...formData, legalEntityName: e.target.value })}
                  placeholder="e.g. Pfaff Automotive Partners Inc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-portal-primary focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">
                  Provincial Licensing Regulator
                </label>
                <select
                  value={formData.regulator}
                  onChange={(e) => setFormData({ ...formData, regulator: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono focus:ring-2 focus:ring-portal-primary focus:outline-hidden"
                >
                  <option value="OMVIC">OMVIC — Ontario Motor Vehicle Industry Council</option>
                  <option value="AMVIC">AMVIC — Alberta Motor Vehicle Industry Council</option>
                  <option value="VSA">VSA — Vehicle Sales Authority of British Columbia</option>
                  <option value="OPC">OPC — Office de la protection du consommateur (Quebec)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">
                  Dealer Master License Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="e.g. OMVIC-481920"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono uppercase focus:ring-2 focus:ring-portal-primary focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address & Radius */}
          <div className="space-y-4 pt-2 border-t border-portal-border">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text flex items-center gap-2">
              <MapPin className="w-4 h-4 text-portal-primary" />
              2. Dealership Premises & Acquisition Radius
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3 space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">
                  Physical Dealership Address (Vehicle Handover Bay)
                </label>
                <input
                  type="text"
                  required
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  placeholder="e.g. 1050 Burloak Drive"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-portal-primary focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Markham"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-portal-primary focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">Province</label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono"
                >
                  <option value="ON">Ontario (ON)</option>
                  <option value="AB">Alberta (AB)</option>
                  <option value="BC">British Columbia (BC)</option>
                  <option value="QC">Quebec (QC)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">Postal Code</label>
                <input
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. L6M 4W9"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono uppercase"
                />
              </div>
            </div>

            {/* Radius Slider */}
            <div className="p-4 rounded-xl bg-portal-surface-hover border border-portal-border space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-portal-text">Target Inventory Radius</span>
                <span className="font-bold text-portal-primary">{formData.serviceRadiusKm} km from Dealership</span>
              </div>
              <input
                type="range"
                min="25"
                max="250"
                step="25"
                value={formData.serviceRadiusKm}
                onChange={(e) => setFormData({ ...formData, serviceRadiusKm: Number(e.target.value) })}
                className="w-full accent-portal-primary cursor-pointer"
              />
              <p className="text-[11px] text-portal-text-muted">
                Auctions within this perimeter will prioritize your bidding alerts.
              </p>
            </div>
          </div>

          {/* Section 3: Primary Contact */}
          <div className="space-y-4 pt-2 border-t border-portal-border">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-portal-text flex items-center gap-2">
              <User className="w-4 h-4 text-portal-primary" />
              3. Authorized Wholesale Purchasing Agent
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="e.g. Christopher Evans"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">Position / Title</label>
                <input
                  type="text"
                  required
                  value={formData.contactTitle}
                  onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                  placeholder="e.g. Wholesale Acquisitions Director"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">Direct Work Email</label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="e.g. c.evans@pfaffauto.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">Direct Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="e.g. +1 (905) 555-8291"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Ethics Declaration */}
          <div className="p-4 rounded-xl bg-portal-surface-hover/70 border border-portal-border flex items-start gap-3">
            <input
              type="checkbox"
              id="ethics-checkbox"
              checked={formData.agreeOmvicEthics}
              onChange={(e) => setFormData({ ...formData, agreeOmvicEthics: e.target.checked })}
              className="mt-0.5 accent-portal-primary h-4 w-4 rounded"
            />
            <label htmlFor="ethics-checkbox" className="text-xs text-portal-text-muted leading-relaxed cursor-pointer">
              I certify under penalty of account revocation that all placed sealed bids represent legally binding commitments under provincial automotive sales regulations (OMVIC / AMVIC / VSA) and that our dealership will honor all won auction prices subject only to disclosed physical inspection discrepancies.
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/dealer/inventory"
              className="text-xs font-mono text-portal-text-muted hover:text-portal-text"
            >
              Cancel & Return
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !formData.agreeOmvicEthics}
              className="px-6 py-3 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? "Submitting Application..." : "Submit License for Verification"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
