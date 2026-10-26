"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ShieldCheck,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileBadge,
  Phone,
  Mail,
  User,
  Sliders,
  Check,
} from "lucide-react";

export function DealerRegisterView() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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
    contactTitle: "Wholesale Acquisitions Director",
    contactEmail: "",
    contactPhone: "",
    serviceRadiusKm: 100,
    agreeOmvicEthics: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!formData.dealershipName || !formData.licenseNumber) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.streetAddress || !formData.city || !formData.postalCode) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!formData.contactName || !formData.contactEmail) return;
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
      }, 700);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 font-body animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white font-headline">
            Licensing Application Received
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Your verification for <strong>{formData.dealershipName}</strong> ({formData.regulator} #{formData.licenseNumber}) has been queued for express Canadian automotive compliance verification.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-white/10 text-left text-xs space-y-2.5 shadow-xs">
          <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
            <span className="text-neutral-500 dark:text-neutral-400">Licensing Authority:</span>
            <span className="font-bold text-neutral-900 dark:text-white">{formData.regulator} Verified Directory</span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
            <span className="text-neutral-500 dark:text-neutral-400">Target Operating Perimeter:</span>
            <span className="font-bold text-neutral-900 dark:text-white">{formData.serviceRadiusKm} km radius</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-500 dark:text-neutral-400">Estimated Review Time:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Same-Day Express (&lt; 2 Hours)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dealer/subscription"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary dark:bg-secondary text-white text-xs font-bold transition-opacity hover:opacity-95 shadow-md text-center"
          >
            Review Subscription Plans
          </Link>
          <Link
            href="/dealer/billing"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-center"
          >
            Manage Billing & Quotas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6 space-y-6 font-body animate-in fade-in duration-300">
      {/* Clean Header Row */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-headline">
          Dealership Account Setup
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Verify provincial dealership licensing to participate in live sealed-bid wholesale auctions.
        </p>
      </div>

      {/* Paced 3-Step Progress Stepper */}
      <div className="grid grid-cols-3 gap-2 py-1">
        {[
          { step: 1, title: "Licensing" },
          { step: 2, title: "Premises & Radius" },
          { step: 3, title: "Purchasing Officer" },
        ].map((item) => {
          const isCompleted = currentStep > item.step;
          const isActive = currentStep === item.step;

          return (
            <div
              key={item.step}
              onClick={() => {
                if (isCompleted) setCurrentStep(item.step as any);
              }}
              className={`pb-2 border-b-2 transition-all ${
                isCompleted
                  ? "border-emerald-500 cursor-pointer text-emerald-600 dark:text-emerald-400"
                  : isActive
                  ? "border-primary dark:border-secondary text-neutral-900 dark:text-white"
                  : "border-neutral-200 dark:border-neutral-800 text-neutral-400"
              }`}
            >
              <span className="text-[11px] font-bold block">
                0{item.step}. {item.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Container Card */}
      <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleNext} className="space-y-6">
          {/* STEP 1: Dealership Licensing */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-white/5">
                <Building2 className="w-4 h-4 text-primary dark:text-secondary" />
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white font-headline">
                  Dealership Legal Identity & Licensing
                </h2>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Trade / Operating Name (DBA)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pfaff Porsche Markham"
                    value={formData.dealershipName}
                    onChange={(e) => setFormData({ ...formData, dealershipName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Registered Corporate Legal Entity Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pfaff Automotive Partners Inc."
                    value={formData.legalEntityName}
                    onChange={(e) => setFormData({ ...formData, legalEntityName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Provincial Licensing Regulator
                    </label>
                    <select
                      value={formData.regulator}
                      onChange={(e) => setFormData({ ...formData, regulator: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                    >
                      <option value="OMVIC">OMVIC — Ontario</option>
                      <option value="AMVIC">AMVIC — Alberta</option>
                      <option value="VSA">VSA — British Columbia</option>
                      <option value="OPC">OPC — Quebec</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Master Dealer License #
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OMVIC-481920"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Physical Premises & Acquisition Radius */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-white/5">
                <MapPin className="w-4 h-4 text-primary dark:text-secondary" />
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white font-headline">
                  Dealership Location & Handover Bay
                </h2>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Physical Street Address (Vehicle Delivery Bay)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1050 Burloak Drive"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">City</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Markham"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">Province</label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                    >
                      <option value="ON">Ontario (ON)</option>
                      <option value="AB">Alberta (AB)</option>
                      <option value="BC">British Columbia (BC)</option>
                      <option value="QC">Quebec (QC)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">Postal Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. L6M 4W9"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                    />
                  </div>
                </div>

                {/* Bidding Perimeter Selector */}
                <div className="pt-2 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Target Inventory Sourcing Radius
                    </label>
                    <span className="text-xs font-bold text-primary dark:text-secondary">
                      {formData.serviceRadiusKm} km from dealership
                    </span>
                  </div>

                  {/* Preset quick chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { label: "Local (50 km)", val: 50 },
                      { label: "Regional (100 km)", val: 100 },
                      { label: "Province-Wide (250 km)", val: 250 },
                    ].map((chip) => (
                      <button
                        key={chip.val}
                        type="button"
                        onClick={() => setFormData({ ...formData, serviceRadiusKm: chip.val })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          formData.serviceRadiusKm === chip.val
                            ? "bg-primary dark:bg-secondary text-white font-bold shadow-2xs"
                            : "border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="25"
                    max="300"
                    step="25"
                    value={formData.serviceRadiusKm}
                    onChange={(e) => setFormData({ ...formData, serviceRadiusKm: Number(e.target.value) })}
                    className="w-full accent-primary dark:accent-secondary cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Authorized Purchasing Officer */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-white/5">
                <User className="w-4 h-4 text-primary dark:text-secondary" />
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white font-headline">
                  Authorized Wholesale Purchasing Agent
                </h2>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Christopher Evans"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Position / Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Wholesale Acquisitions Director"
                      value={formData.contactTitle}
                      onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Direct Work Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. c.evans@pfaffauto.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Direct Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1 (905) 555-8291"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
                    />
                  </div>
                </div>

                {/* Regulatory Declaration Checkbox */}
                <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/50 dark:bg-neutral-800/40 flex items-start gap-3 mt-2">
                  <input
                    type="checkbox"
                    id="ethicsDeclaration"
                    checked={formData.agreeOmvicEthics}
                    onChange={(e) => setFormData({ ...formData, agreeOmvicEthics: e.target.checked })}
                    className="mt-0.5 rounded border-neutral-300 text-primary dark:text-secondary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="ethicsDeclaration" className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed cursor-pointer">
                    I certify that all sealed bids submitted under this account constitute legally binding purchase commitments under provincial motor vehicle sales regulations ({formData.regulator}).
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-white/5">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as any)}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <Link
                href="/dealer/subscription"
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:underline"
              >
                Cancel & return
              </Link>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary dark:bg-secondary text-white text-xs font-bold transition-opacity hover:opacity-95 shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{currentStep === 3 ? "Submit for Verification" : "Continue"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
