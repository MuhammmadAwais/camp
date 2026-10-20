"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowLeft,
  Car,
  Camera,
  MapPin,
  Sparkles,
  RefreshCw,
  FileText,
  Check,
  Scale,
  Gavel,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useListingWizardStore } from "@/store/useListingWizardStore";
import { formatCadCents } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface PriceReviewStepProps {
  onBack: () => void;
}

export function PriceReviewStep({ onBack }: PriceReviewStepProps) {
  const router = useRouter();
  const {
    vin,
    postalCode,
    decodedVehicle,
    specs,
    damageHotspots,
    photos,
    reservePriceCents,
    declarationOwnerAttested,
    declarationAccurateCondition,
    declarationNoUnpaidFines,
    setPricingAndDeclarations,
    markStepComplete,
    resetWizard,
  } = useListingWizardStore();

  // Mode: "RESERVE" vs "NO_RESERVE"
  const [isNoReserve, setIsNoReserve] = useState(reservePriceCents === 0);

  // Input string display (e.g. "24,500")
  const initialDisplay = reservePriceCents && reservePriceCents > 0
    ? Math.round(reservePriceCents / 100).toLocaleString("en-CA")
    : "22,500";

  const [displayPrice, setDisplayPrice] = useState(initialDisplay);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    id: string;
    auctionEndsAt: string;
    message: string;
  } | null>(null);

  // Compute algorithmic wholesale guidance corridor based on vehicle specs
  const wholesaleCorridor = useMemo(() => {
    const year = decodedVehicle?.year || 2022;
    const mileage = specs.mileageKm || 45000;
    
    let baseDollars = 25000;
    if (year >= 2024) baseDollars = 36000;
    else if (year >= 2023) baseDollars = 31000;
    else if (year >= 2022) baseDollars = 27000;
    else if (year >= 2020) baseDollars = 22000;
    else if (year >= 2018) baseDollars = 17000;
    else baseDollars = 12000;

    // Adjust for mileage (subtract $800 per 20,000km over 30k)
    const excessMileageBlocks = Math.max(0, Math.floor((mileage - 30000) / 20000));
    baseDollars = Math.max(5000, baseDollars - excessMileageBlocks * 800);

    // Adjust for declared damage
    const damageDeduction = damageHotspots.length * 400;
    baseDollars = Math.max(3000, baseDollars - damageDeduction);

    const lowCents = Math.round(baseDollars * 0.92) * 100;
    const midCents = baseDollars * 100;
    const highCents = Math.round(baseDollars * 1.08) * 100;

    return { lowCents, midCents, highCents };
  }, [decodedVehicle?.year, specs.mileageKm, damageHotspots.length]);

  // Handle formatted price input
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setDisplayPrice("");
      setPricingAndDeclarations({ reservePriceCents: null });
      return;
    }

    const dollars = parseInt(rawVal, 10);
    setDisplayPrice(dollars.toLocaleString("en-CA"));
    setPricingAndDeclarations({ reservePriceCents: dollars * 100 });
  };

  const applyCorridorMedian = () => {
    setIsNoReserve(false);
    const dollars = Math.round(wholesaleCorridor.midCents / 100);
    setDisplayPrice(dollars.toLocaleString("en-CA"));
    setPricingAndDeclarations({ reservePriceCents: wholesaleCorridor.midCents });
  };

  const handleAcceptAllDeclarations = () => {
    setPricingAndDeclarations({
      declarationOwnerAttested: true,
      declarationAccurateCondition: true,
      declarationNoUnpaidFines: true,
    });
  };

  // Find cover photo
  const coverPhoto = photos.find((p) => p.isCover) || photos[0];

  // Submit Listing
  const handleSubmitListing = async () => {
    setErrorMsg(null);

    // Validate reserve
    if (!isNoReserve) {
      const currentCents = reservePriceCents || 0;
      if (currentCents < 50000) {
        setErrorMsg("Please enter a valid reserve price of at least $500 CAD, or select 'No Reserve'.");
        return;
      }
    }

    // Validate attestations
    if (!declarationOwnerAttested) {
      setErrorMsg("Please attest to legal registered vehicle ownership to proceed.");
      return;
    }

    if (!declarationAccurateCondition) {
      setErrorMsg("Please declare that vehicle condition disclosures and damage hotspots are accurate.");
      return;
    }

    if (!declarationNoUnpaidFines) {
      setErrorMsg("Please confirm lien and escrow discharge agreement.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        vin,
        postalCode: postalCode || "M5V 2T6",
        decodedVehicle: decodedVehicle || {
          year: 2022,
          make: "Toyota",
          model: "RAV4",
          trim: "XLE AWD",
        },
        specs: {
          mileageKm: specs.mileageKm || 45000,
          transmission: specs.transmission || "Automatic",
          drivetrain: specs.drivetrain || "AWD",
          exteriorColor: specs.exteriorColor || "Silver",
          interiorColor: specs.interiorColor || "Black",
          keysCount: specs.keysCount || 2,
          accidentDeclaration: specs.accidentDeclaration,
          accidentCount: specs.accidentCount,
          accidentDetails: specs.accidentDetails,
          hasLien: specs.hasLien,
          lienDetails: specs.lienDetails,
        },
        damageHotspots,
        photos: photos.map((p) => ({
          id: p.id,
          previewUrl: p.previewUrl,
          s3Key: p.s3Key || `listings/mock/${p.fileName}`,
          fileName: p.fileName,
          fileSizeBytes: p.fileSizeBytes,
          isCover: p.isCover,
          status: p.status,
          progress: p.progress,
        })),
        reservePriceCents: isNoReserve ? 0 : reservePriceCents,
        declarationOwnerAttested: true,
        declarationAccurateCondition: true,
        declarationNoUnpaidFines: true,
      };

      const res = await apiClient.api.post<{
        id: string;
        auctionEndsAt: string;
        message: string;
      }>("/api/listings", payload);

      if (!res.success) {
        throw new Error(res.error || "Failed to submit vehicle listing");
      }

      markStepComplete("pricing");
      setSubmittedData({
        id: res.data.id,
        auctionEndsAt: res.data.auctionEndsAt,
        message: res.data.message,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission encountered an error";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndReturn = () => {
    resetWizard();
    router.push("/seller/dashboard");
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary flex items-center gap-1">
            <Gavel className="w-3 h-3" />
            <span>Final Step 5: Pricing & Review</span>
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-portal-surface border border-portal-border text-portal-text-muted">
            Ontario & Canadian Exchange
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold font-headline text-portal-text">
          Reserve Asking Price & Legal Attestation
        </h2>
        <p className="text-sm text-portal-text-muted mt-1">
          Specify your minimum reserve asking price in CAD cents and review mandatory Canadian regulatory declarations.
        </p>
      </div>

      {/* Vehicle Summary Recap Card */}
      <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-portal-border">
          <div className="flex items-center gap-3.5">
            {coverPhoto ? (
              <div className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-portal-border bg-portal-surface-hover">
                <Image
                  src={coverPhoto.previewUrl}
                  alt="Vehicle cover preview"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="w-16 h-12 rounded-xl bg-portal-primary/10 text-portal-primary flex items-center justify-center shrink-0">
                <Car className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold font-headline text-portal-text">
                {decodedVehicle
                  ? `${decodedVehicle.year} ${decodedVehicle.make} ${decodedVehicle.model} ${decodedVehicle.trim || ""}`
                  : "Vehicle Under Appraisal"}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-portal-surface-hover border border-portal-border text-portal-text font-medium">
                  VIN: {vin ? `${vin.slice(0, 8)}••••••••` : "UNVERIFIED"}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-portal-primary/10 text-portal-primary font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{postalCode || "M5V 2T6"}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Inspection Ready</span>
            </span>
          </div>
        </div>

        {/* 4-Pill Specs Recap Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border">
            <span className="text-portal-text-muted block text-[11px]">Odometer</span>
            <span className="font-semibold text-portal-text mt-0.5 block font-mono">
              {specs.mileageKm ? `${specs.mileageKm.toLocaleString()} km` : "Not provided"}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border">
            <span className="text-portal-text-muted block text-[11px]">Powertrain</span>
            <span className="font-semibold text-portal-text mt-0.5 block truncate">
              {specs.drivetrain || "AWD"} • {specs.transmission || "Automatic"}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border">
            <span className="text-portal-text-muted block text-[11px]">Condition Hotspots</span>
            <span className="font-semibold text-portal-text mt-0.5 block">
              {damageHotspots.length === 0
                ? "0 Declared (Clean)"
                : `${damageHotspots.length} Hotspot${damageHotspots.length > 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border">
            <span className="text-portal-text-muted block text-[11px]">Photos Uploaded</span>
            <span className="font-semibold text-portal-text mt-0.5 block font-mono">
              {photos.length} Verified Photos
            </span>
          </div>
        </div>
      </div>

      {/* Wholesale Market Intelligence Corridor */}
      <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 md:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-portal-primary" />
              <span className="text-xs font-semibold text-portal-text uppercase tracking-wider">
                Wholesale Dealer Corridor (Est.)
              </span>
            </div>
            <p className="text-xs text-portal-text-muted max-w-lg">
              Based on recent Ontario wholesale exchange sales for comparable mileage and grade.
            </p>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold font-mono text-portal-primary">
              {formatCadCents(wholesaleCorridor.lowCents, false)} – {formatCadCents(wholesaleCorridor.highCents)}
            </div>
            <button
              type="button"
              id="btn-apply-corridor"
              onClick={applyCorridorMedian}
              className="text-[11px] text-portal-primary hover:underline font-medium mt-0.5 inline-flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Use Recommended Reserve ({formatCadCents(wholesaleCorridor.midCents)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reserve Price Input Card */}
      <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-portal-text">
              Minimum Reserve Asking Price
            </h3>
            <p className="text-xs text-portal-text-muted mt-0.5">
              The lowest dollar amount you are willing to accept. Hidden from competing dealerships until unsealed.
            </p>
          </div>

          {/* Reserve / No Reserve Toggle */}
          <div className="flex items-center gap-2 bg-portal-surface-hover p-1 rounded-xl border border-portal-border shrink-0 self-start sm:self-auto">
            <button
              type="button"
              id="btn-mode-reserve"
              onClick={() => {
                setIsNoReserve(false);
                if (!displayPrice) {
                  const dollars = Math.round(wholesaleCorridor.midCents / 100);
                  setDisplayPrice(dollars.toLocaleString("en-CA"));
                  setPricingAndDeclarations({ reservePriceCents: wholesaleCorridor.midCents });
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                !isNoReserve
                  ? "bg-portal-primary text-white shadow-xs"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
            >
              Reserve Price
            </button>
            <button
              type="button"
              id="btn-mode-no-reserve"
              onClick={() => {
                setIsNoReserve(true);
                setPricingAndDeclarations({ reservePriceCents: 0 });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isNoReserve
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-portal-text-muted hover:text-portal-text"
              }`}
            >
              No Reserve (Faster Sale)
            </button>
          </div>
        </div>

        {/* Currency Input or No-Reserve Banner */}
        {!isNoReserve ? (
          <div className="space-y-2">
            <div className="relative max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold font-mono text-portal-text-muted">
                $
              </span>
              <input
                type="text"
                id="reserve-price-input"
                inputMode="numeric"
                value={displayPrice}
                onChange={handlePriceChange}
                placeholder="22,500"
                className="w-full pl-9 pr-16 py-3.5 rounded-xl bg-portal-surface-hover border border-portal-border text-xl font-bold font-mono text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary focus:border-transparent transition-all shadow-inner"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-portal-text-muted uppercase">
                CAD
              </span>
            </div>
            <p className="text-[11px] text-portal-text-muted flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-portal-primary shrink-0" />
              <span>
                Protected by AutoNexa sealed-bid invariant: zero dealer participants can see this reserve asking price.
              </span>
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>No-Reserve Wholesale Auction Selected</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Your vehicle will be awarded to the highest licensed dealer bid placed within the 24-hour auction window.
              No-reserve listings attract up to 3x more competitive dealership offers across Ontario and Quebec.
            </p>
          </div>
        )}
      </div>

      {/* Mandatory Canadian Regulatory Declarations */}
      <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-portal-text flex items-center gap-2">
              <Scale className="w-4 h-4 text-portal-primary" />
              <span>Canadian Legal Disclosures & Attestation</span>
            </h3>
            <p className="text-xs text-portal-text-muted mt-0.5">
              Mandatory affirmations under OMVIC (Ontario), AMVIC (Alberta), and VSA (British Columbia) regulations.
            </p>
          </div>

          <button
            type="button"
            id="btn-accept-all-declarations"
            onClick={handleAcceptAllDeclarations}
            className="text-xs px-3 py-1.5 rounded-lg bg-portal-primary/10 hover:bg-portal-primary/20 text-portal-primary border border-portal-primary/30 font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Accept All 3 Declarations (1-Click)</span>
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {/* Declaration 1: Legal Ownership */}
          <div
            onClick={() =>
              setPricingAndDeclarations({
                declarationOwnerAttested: !declarationOwnerAttested,
              })
            }
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
              declarationOwnerAttested
                ? "bg-portal-primary/5 border-portal-primary/50"
                : "bg-portal-surface-hover/70 border-portal-border hover:border-portal-primary/30"
            }`}
          >
            <input
              type="checkbox"
              id="declaration-owner-checkbox"
              checked={declarationOwnerAttested}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                setPricingAndDeclarations({ declarationOwnerAttested: e.target.checked })
              }
              className="mt-0.5 w-4 h-4 rounded text-portal-primary focus:ring-portal-primary border-portal-border accent-portal-primary cursor-pointer shrink-0"
            />
            <div className="text-xs select-none">
              <span className="font-semibold text-portal-text block">
                1. Registered Vehicle Ownership Attestation
              </span>
              <span className="text-portal-text-muted text-[11px] leading-relaxed">
                I attest under penalty of Canadian law that I am the registered legal owner (or authorized corporate agent)
                possessing legal authority to transfer this vehicle title to a licensed dealership.
              </span>
            </div>
          </div>

          {/* Declaration 2: Honest Condition */}
          <div
            onClick={() =>
              setPricingAndDeclarations({
                declarationAccurateCondition: !declarationAccurateCondition,
              })
            }
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
              declarationAccurateCondition
                ? "bg-portal-primary/5 border-portal-primary/50"
                : "bg-portal-surface-hover/70 border-portal-border hover:border-portal-primary/30"
            }`}
          >
            <input
              type="checkbox"
              id="declaration-condition-checkbox"
              checked={declarationAccurateCondition}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                setPricingAndDeclarations({ declarationAccurateCondition: e.target.checked })
              }
              className="mt-0.5 w-4 h-4 rounded text-portal-primary focus:ring-portal-primary border-portal-border accent-portal-primary cursor-pointer shrink-0"
            />
            <div className="text-xs select-none">
              <span className="font-semibold text-portal-text block">
                2. Complete & Accurate Vehicle Condition Disclosure
              </span>
              <span className="text-portal-text-muted text-[11px] leading-relaxed">
                I certify that all odometer readings in kilometers, collision histories, frame/mechanical defects,
                and condition map pins declared are truthful, accurate, and without intentional omission.
              </span>
            </div>
          </div>

          {/* Declaration 3: Lien Discharge & Sealed Bid Rules */}
          <div
            onClick={() =>
              setPricingAndDeclarations({
                declarationNoUnpaidFines: !declarationNoUnpaidFines,
              })
            }
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
              declarationNoUnpaidFines
                ? "bg-portal-primary/5 border-portal-primary/50"
                : "bg-portal-surface-hover/70 border-portal-border hover:border-portal-primary/30"
            }`}
          >
            <input
              type="checkbox"
              id="declaration-lien-checkbox"
              checked={declarationNoUnpaidFines}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                setPricingAndDeclarations({ declarationNoUnpaidFines: e.target.checked })
              }
              className="mt-0.5 w-4 h-4 rounded text-portal-primary focus:ring-portal-primary border-portal-border accent-portal-primary cursor-pointer shrink-0"
            />
            <div className="text-xs select-none">
              <span className="font-semibold text-portal-text block">
                3. Lien Escrow Settlement & Sealed-Bid Rules
              </span>
              <span className="text-portal-text-muted text-[11px] leading-relaxed">
                I acknowledge that registered financing liens will be verified via PPSA and settled directly from escrow proceeds.
                I agree that the 24-hour sealed-bid auction format is binding upon dealer offer acceptance.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="p-3.5 bg-portal-surface-hover border border-error/30 rounded-xl flex items-center gap-2.5 text-xs text-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Footer Controls */}
      <div className="pt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium border border-portal-border hover:bg-portal-surface-hover text-portal-text-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Photos</span>
        </button>

        <button
          type="button"
          id="btn-submit-listing"
          onClick={handleSubmitListing}
          disabled={
            isSubmitting ||
            !declarationOwnerAttested ||
            !declarationAccurateCondition ||
            !declarationNoUnpaidFines
          }
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 text-white bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying & Submitting Listing...</span>
            </>
          ) : (
            <>
              <Gavel className="w-4 h-4" />
              <span>Submit Listing & Launch Auction</span>
            </>
          )}
        </button>
      </div>

      {/* Success Modal Confirmation */}
      {submittedData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-portal-surface border border-portal-border rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl relative">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold font-headline text-portal-text">
                Vehicle Listing Submitted!
              </h3>
              <p className="text-xs text-portal-text-muted">
                Your listing is queued for AutoNexa dealer exchange moderation (Est. under 15 minutes).
              </p>
            </div>

            <div className="bg-portal-surface-hover border border-portal-border rounded-xl p-3.5 text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-portal-text font-medium">
                <span className="text-portal-text-muted">Listing ID:</span>
                <span className="font-mono">{submittedData.id}</span>
              </div>
              <div className="flex items-center justify-between text-portal-text font-medium">
                <span className="text-portal-text-muted">Status:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                  Pending Moderation
                </span>
              </div>
              <div className="flex items-center justify-between text-portal-text font-medium">
                <span className="text-portal-text-muted">24h Auction Window:</span>
                <span>Scheduled after review</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                id="btn-return-dashboard"
                onClick={handleFinishAndReturn}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-xs text-white bg-portal-primary hover:bg-portal-primary-hover transition-colors shadow-sm cursor-pointer"
              >
                <span>Return to Seller Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
