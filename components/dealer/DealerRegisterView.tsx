"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  MapPin,
  ShieldAlert,
  User,
} from "lucide-react";
import { isValidPostalCode, normalizePostalCode, PROVINCES } from "@/lib/canada";
import { ApiError } from "@/lib/api-client";
import {
  useDealerOnboardingStatus,
  useSubmitDealershipApplication,
} from "@/hooks/useDealerOnboarding";
import type {
  DealerOnboardingApplication,
  DealerRegulatorCode,
} from "@/lib/types/dealer";

type WizardStep = 1 | 2 | 3;

type DealerFormState = {
  dealershipName: string;
  legalEntityName: string;
  businessNumber: string;
  regulator: DealerRegulatorCode;
  licenseNumber: string;
  licenseExpiry: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  serviceRadiusKm: number;
  agreeOmvicEthics: boolean;
};

const EMPTY_FORM: DealerFormState = {
  dealershipName: "",
  legalEntityName: "",
  businessNumber: "",
  regulator: "OMVIC",
  licenseNumber: "",
  licenseExpiry: "",
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
};

function defaultRegulatorForProvince(province: string): DealerRegulatorCode {
  const upper = province.trim().toUpperCase();
  if (upper === "AB") return "AMVIC";
  if (upper === "BC") return "VSA";
  if (upper === "QC") return "OPC";
  return "OMVIC";
}

export function DealerRegisterView() {
  const onboardingQuery = useDealerOnboardingStatus();
  const submitMutation = useSubmitDealershipApplication();

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [edits, setEdits] = useState<Partial<DealerFormState>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [submittedApplication, setSubmittedApplication] =
    useState<DealerOnboardingApplication | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const serverOnboarding = onboardingQuery.data?.data ?? null;
  const isAuthenticated = onboardingQuery.data?.authenticated ?? false;
  const activeApplication =
    submittedApplication ?? serverOnboarding?.application ?? null;

  const baseForm = useMemo<DealerFormState>(() => {
    if (activeApplication) {
      const address =
        activeApplication.streetAddress === "Pending onboarding completion"
          ? ""
          : activeApplication.streetAddress;
      return {
        dealershipName: activeApplication.dealershipName,
        legalEntityName: activeApplication.legalEntityName,
        businessNumber: activeApplication.businessNumber ?? "",
        regulator: activeApplication.regulator,
        licenseNumber: activeApplication.licenseNumber,
        licenseExpiry: activeApplication.licenseExpiry ?? "",
        streetAddress: address,
        city: activeApplication.city,
        province: activeApplication.province,
        postalCode: activeApplication.postalCode,
        contactName: activeApplication.contactName,
        contactTitle:
          activeApplication.contactTitle ?? "Wholesale Acquisitions Director",
        contactEmail: activeApplication.contactEmail,
        contactPhone: activeApplication.contactPhone,
        serviceRadiusKm: activeApplication.serviceRadiusKm,
        agreeOmvicEthics: true,
      };
    }

    const prefill = serverOnboarding?.prefill;
    if (prefill) {
      const fullName = `${prefill.firstName} ${prefill.lastName}`.trim();
      return {
        ...EMPTY_FORM,
        regulator: defaultRegulatorForProvince(prefill.province),
        province: prefill.province || "ON",
        city: prefill.city || "",
        postalCode: prefill.postalCode || "",
        contactName: fullName,
        contactEmail: prefill.email,
        contactPhone: prefill.phone,
      };
    }

    return EMPTY_FORM;
  }, [activeApplication, serverOnboarding]);

  const formData = useMemo<DealerFormState>(
    () => ({ ...baseForm, ...edits }),
    [baseForm, edits]
  );

  const updateField = <K extends keyof DealerFormState>(
    key: K,
    value: DealerFormState[K]
  ) => {
    setValidationError(null);
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const apiError =
    submitMutation.error instanceof ApiError
      ? submitMutation.error.failure
      : null;

  const handleStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (currentStep === 1) {
      if (
        formData.dealershipName.trim().length < 2 ||
        formData.legalEntityName.trim().length < 2 ||
        formData.licenseNumber.trim().length < 3
      ) {
        setValidationError(
          "Please complete the dealership trade name, legal entity name, and dealer license number."
        );
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (
        formData.streetAddress.trim().length < 4 ||
        formData.city.trim().length < 2 ||
        !isValidPostalCode(formData.postalCode)
      ) {
        setValidationError(
          "Please provide a valid physical street address, city, and Canadian postal code (e.g. L3R 5H6)."
        );
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (
      formData.contactName.trim().length < 2 ||
      !formData.contactEmail.includes("@") ||
      formData.contactPhone.trim().length < 7
    ) {
      setValidationError(
        "Please provide the authorized purchasing officer name, work email, and phone number."
      );
      return;
    }

    if (!formData.agreeOmvicEthics) {
      setValidationError(
        "You must certify compliance with provincial motor vehicle wholesale rules before submitting."
      );
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({
        dealershipName: formData.dealershipName.trim(),
        legalEntityName: formData.legalEntityName.trim(),
        businessNumber: formData.businessNumber.trim() || null,
        regulator: formData.regulator,
        licenseNumber: formData.licenseNumber.trim().toUpperCase(),
        licenseExpiry: formData.licenseExpiry.trim() || null,
        streetAddress: formData.streetAddress.trim(),
        city: formData.city.trim(),
        province: formData.province.trim().toUpperCase(),
        postalCode: normalizePostalCode(formData.postalCode),
        serviceRadiusKm: formData.serviceRadiusKm,
        contactName: formData.contactName.trim(),
        contactTitle: formData.contactTitle.trim() || null,
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim(),
        agreeOmvicEthics: true,
      });

      setSubmittedApplication(result.application);
      setEdits({});
      setIsEditing(false);
    } catch {
      // Failure is surfaced directly through `submitMutation.error`.
    }
  };

  if (onboardingQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-3 font-body">
        <Loader2 className="w-7 h-7 animate-spin text-portal-primary mx-auto" />
        <p className="text-xs text-portal-text-muted">
          Checking your dealership licensing status...
        </p>
      </div>
    );
  }

  if (onboardingQuery.isError) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4 font-body">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold font-headline text-portal-text">
          Unable to load dealership onboarding status
        </h2>
        <p className="text-xs text-portal-text-muted">
          Please refresh the page or try again shortly.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 font-body animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-portal-primary/10 text-portal-primary border border-portal-primary/25 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-headline text-portal-text">
            Sign in to Complete Dealership Licensing
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted max-w-md mx-auto leading-relaxed">
            Create or sign in to your dealership administrator account to submit OMVIC, AMVIC, VSA, or OPC credentials for compliance verification.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login?next=/dealer/register"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-portal-primary text-white text-xs font-bold hover:opacity-95 transition-opacity text-center"
          >
            Sign In to Continue
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs font-bold hover:bg-portal-surface-hover transition-colors text-center"
          >
            Create New Dealer Account
          </Link>
        </div>
      </div>
    );
  }

  if (activeApplication?.status === "VERIFIED") {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 font-body animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline">
            Dealership Licence Verified
          </h2>
          <p className="text-xs sm:text-sm text-portal-text-muted max-w-md mx-auto leading-relaxed">
            <strong>{activeApplication.dealershipName}</strong> (
            {activeApplication.regulator} #{activeApplication.licenseNumber}) is approved for live sealed-bid wholesale auctions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dealer/inventory"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-portal-primary text-white text-xs font-bold hover:opacity-95 transition-opacity text-center"
          >
            Open Live Trading Floor
          </Link>
          <Link
            href="/dealer/subscription"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs font-bold hover:bg-portal-surface-hover transition-colors text-center"
          >
            Review Subscription & Quotas
          </Link>
        </div>
      </div>
    );
  }

  if (
    activeApplication &&
    (activeApplication.status === "SUSPENDED" ||
      activeApplication.status === "REVOKED")
  ) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 font-body animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/25 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-portal-text font-headline">
            Dealership Bidding Access{" "}
            {activeApplication.status === "SUSPENDED" ? "Suspended" : "Revoked"}
          </h2>
          <p className="text-xs sm:text-sm text-portal-text-muted max-w-md mx-auto leading-relaxed">
            {activeApplication.dealershipName} ({activeApplication.regulator} #
            {activeApplication.licenseNumber}) is currently under a compliance hold and cannot place sealed bids.
          </p>
        </div>
        {activeApplication.verificationNotes && (
          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-left text-xs text-portal-text">
            <span className="font-bold block mb-1 text-red-500">
              Compliance Finding:
            </span>
            {activeApplication.verificationNotes}
          </div>
        )}
      </div>
    );
  }

  if (activeApplication && activeApplication.status === "PENDING" && !isEditing) {
    const needsPremises =
      activeApplication.streetAddress === "Pending onboarding completion" ||
      activeApplication.streetAddress.trim().length < 4;

    if (!needsPremises || submittedApplication) {
      return (
        <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 font-body animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25 flex items-center justify-center mx-auto shadow-sm">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline">
              Licensing Application Under Review
            </h2>
            <p className="text-xs sm:text-sm text-portal-text-muted max-w-md mx-auto leading-relaxed">
              Your verification for{" "}
              <strong>{activeApplication.dealershipName}</strong> (
              {activeApplication.regulator} #{activeApplication.licenseNumber}) is queued for Canadian automotive compliance verification.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-portal-surface border border-portal-border text-left text-xs space-y-2.5 shadow-xs">
            <div className="flex justify-between py-1 border-b border-portal-border/60">
              <span className="text-portal-text-muted">Licensing Authority:</span>
              <span className="font-bold text-portal-text">
                {activeApplication.regulator} Verified Directory
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-portal-border/60">
              <span className="text-portal-text-muted">Premises Location:</span>
              <span className="font-bold text-portal-text">
                {activeApplication.city}, {activeApplication.province}{" "}
                {activeApplication.postalCode}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-portal-border/60">
              <span className="text-portal-text-muted">
                Target Operating Perimeter:
              </span>
              <span className="font-bold text-portal-text">
                {activeApplication.serviceRadiusKm} km radius
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-portal-text-muted">Review Status:</span>
              <span className="font-bold text-amber-500">
                Pending Admin Verification
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                setIsEditing(true);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs font-bold hover:bg-portal-surface-hover transition-colors cursor-pointer"
            >
              Update Application Details
            </button>
            <Link
              href="/dealer/subscription"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-portal-primary text-white text-xs font-bold hover:opacity-95 transition-opacity text-center"
            >
              Review Subscription Plans
            </Link>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6 space-y-6 font-body animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-portal-text font-headline">
          Dealership Account Setup
        </h1>
        <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
          Verify provincial dealership licensing to participate in live sealed-bid wholesale auctions.
        </p>
      </div>

      {activeApplication?.status === "REJECTED" && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs space-y-1">
          <p className="font-bold text-red-500">
            Previous Application Rejected — Resubmission Open
          </p>
          <p className="text-portal-text">
            {activeApplication.verificationNotes ||
              "Update your licensing credentials and physical premises details below to resubmit."}
          </p>
        </div>
      )}

      {/* Paced 3-Step Progress Stepper */}
      <div className="grid grid-cols-3 gap-2 py-1">
        {(
          [
            { step: 1, title: "Licensing" },
            { step: 2, title: "Premises & Radius" },
            { step: 3, title: "Purchasing Officer" },
          ] as const
        ).map((item) => {
          const isCompleted = currentStep > item.step;
          const isActive = currentStep === item.step;

          return (
            <button
              key={item.step}
              type="button"
              onClick={() => {
                if (isCompleted) setCurrentStep(item.step);
              }}
              className={`pb-2 border-b-2 text-left transition-all ${
                isCompleted
                  ? "border-emerald-500 cursor-pointer text-emerald-500"
                  : isActive
                    ? "border-portal-primary text-portal-text"
                    : "border-portal-border text-portal-text-muted"
              }`}
            >
              <span className="text-[11px] font-bold block">
                0{item.step}. {item.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Form Container Card */}
      <div className="rounded-3xl border border-portal-border bg-portal-surface p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleStepSubmit} className="space-y-6">
          {(validationError || apiError) && (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-500 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">
                  {validationError ?? apiError?.error}
                </p>
                {apiError?.fieldErrors &&
                  Object.entries(apiError.fieldErrors).map(([field, msg]) => (
                    <p key={field} className="text-[11px]">
                      {field}: {msg}
                    </p>
                  ))}
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-portal-border/60">
                <Building2 className="w-4 h-4 text-portal-primary" />
                <h2 className="text-sm font-bold text-portal-text font-headline">
                  Dealership Legal Identity &amp; Licensing
                </h2>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-portal-text">
                    Trade / Operating Name (DBA)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pfaff Porsche Markham"
                    value={formData.dealershipName}
                    onChange={(e) =>
                      updateField("dealershipName", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Registered Corporate Legal Entity
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pfaff Automotive Partners Inc."
                      value={formData.legalEntityName}
                      onChange={(e) =>
                        updateField("legalEntityName", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      CRA Business Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123456789RC0001"
                      value={formData.businessNumber}
                      onChange={(e) =>
                        updateField("businessNumber", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Licensing Regulator
                    </label>
                    <select
                      value={formData.regulator}
                      onChange={(e) =>
                        updateField(
                          "regulator",
                          e.target.value as DealerRegulatorCode
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    >
                      <option value="OMVIC">OMVIC — Ontario</option>
                      <option value="AMVIC">AMVIC — Alberta</option>
                      <option value="VSA">VSA — British Columbia</option>
                      <option value="OPC">OPC — Quebec</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Master Dealer License #
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OMVIC-481920"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        updateField(
                          "licenseNumber",
                          e.target.value.toUpperCase()
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted uppercase focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Licence Expiry (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.licenseExpiry}
                      onChange={(e) =>
                        updateField("licenseExpiry", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-portal-border/60">
                <MapPin className="w-4 h-4 text-portal-primary" />
                <h2 className="text-sm font-bold text-portal-text font-headline">
                  Dealership Location &amp; Handover Bay
                </h2>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-portal-text">
                    Physical Street Address (Vehicle Delivery Bay)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1050 Burloak Drive"
                    value={formData.streetAddress}
                    onChange={(e) =>
                      updateField("streetAddress", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Markham"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Province
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => updateField("province", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    >
                      {PROVINCES.map((prov) => (
                        <option key={prov.code} value={prov.code}>
                          {prov.name} ({prov.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. L3R 5H6"
                      value={formData.postalCode}
                      onChange={(e) =>
                        updateField("postalCode", e.target.value.toUpperCase())
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted uppercase focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>
                </div>

                {/* Bidding Perimeter Selector */}
                <div className="pt-2 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-portal-text">
                      Target Inventory Sourcing Radius
                    </label>
                    <span className="text-xs font-bold text-portal-primary">
                      {formData.serviceRadiusKm} km from dealership
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { label: "Local (50 km)", val: 50 },
                      { label: "Regional (100 km)", val: 100 },
                      { label: "Province-Wide (250 km)", val: 250 },
                    ].map((chip) => (
                      <button
                        key={chip.val}
                        type="button"
                        onClick={() => updateField("serviceRadiusKm", chip.val)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          formData.serviceRadiusKm === chip.val
                            ? "bg-portal-primary text-white font-bold shadow-2xs"
                            : "border border-portal-border bg-portal-surface-hover text-portal-text hover:border-portal-primary/40"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="25"
                    max="500"
                    step="25"
                    value={formData.serviceRadiusKm}
                    onChange={(e) =>
                      updateField("serviceRadiusKm", Number(e.target.value))
                    }
                    className="w-full accent-portal-primary cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-portal-border/60">
                <User className="w-4 h-4 text-portal-primary" />
                <h2 className="text-sm font-bold text-portal-text font-headline">
                  Authorized Wholesale Purchasing Agent
                </h2>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Christopher Evans"
                      value={formData.contactName}
                      onChange={(e) =>
                        updateField("contactName", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Position / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wholesale Acquisitions Director"
                      value={formData.contactTitle}
                      onChange={(e) =>
                        updateField("contactTitle", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Direct Work Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. c.evans@pfaffauto.com"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        updateField("contactEmail", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Direct Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1 (905) 555-8291"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        updateField("contactPhone", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-portal-border bg-portal-surface-hover/40 flex items-start gap-3 mt-2">
                  <input
                    type="checkbox"
                    id="ethicsDeclaration"
                    checked={formData.agreeOmvicEthics}
                    onChange={(e) =>
                      updateField("agreeOmvicEthics", e.target.checked)
                    }
                    className="mt-0.5 rounded border-portal-border accent-portal-primary cursor-pointer"
                  />
                  <label
                    htmlFor="ethicsDeclaration"
                    className="text-xs text-portal-text-muted leading-relaxed cursor-pointer"
                  >
                    I certify that all sealed bids submitted under this account constitute legally binding purchase commitments under provincial motor vehicle sales regulations ({formData.regulator}).
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-portal-border/60">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentStep((prev) => (prev === 3 ? 2 : 1))
                }
                className="px-4 py-2.5 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <Link
                href="/dealer/subscription"
                className="text-xs text-portal-text-muted hover:underline"
              >
                Cancel &amp; return
              </Link>
            )}

            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-portal-primary text-white text-xs font-bold transition-opacity hover:opacity-95 shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>
                    {currentStep === 3 ? "Submit for Verification" : "Continue"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
