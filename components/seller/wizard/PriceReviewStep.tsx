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
  Tag,
  RefreshCw,
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

    // Validate declarations
    if (
      !declarationOwnerAttested ||
      !declarationAccurateCondition ||
      !declarationNoUnpaidFines
    ) {
      setErrorMsg("Please accept all three ownership and condition declarations to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        vin,
        postalCode,
        year: decodedVehicle?.year,
        make: decodedVehicle?.make,
        model: decodedVehicle?.model,
        trim: decodedVehicle?.trim || "",
        bodyStyle: decodedVehicle?.bodyStyle || "",
        transmission: specs.transmission || decodedVehicle?.transmission || "Automatic",
        drivetrain: specs.drivetrain || decodedVehicle?.drivetrain || "AWD",
        fuelType: decodedVehicle?.fuelType || "Gasoline",
        mileageKm: specs.mileageKm || 0,
        reservePriceCents: isNoReserve ? 0 : reservePriceCents,
        damageHotspots,
        photoUrls: photos.map((p) => p.previewUrl),
        coverPhotoUrl: coverPhoto?.previewUrl || photos[0]?.previewUrl || "",
        declarationOwnerAttested,
        declarationAccurateCondition,
        declarationNoUnpaidFines,
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
      {/* 1. Header (Clean, concise, no clutter pills) */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold font-headline text-portal-text">
          Price & Review Your Listing
        </h2>
        <p className="text-sm text-portal-text-muted mt-1">
          Set your minimum reserve price and confirm your vehicle details to launch your 24-hour dealer auction.
        </p>
      </div>

      {/* 2. Unified Vehicle Summary Bar (Single cohesive card, no separate mini-boxes) */}
      <div className="bg-portal-surface border border-portal-border rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {coverPhoto ? (
              <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-portal-border bg-portal-surface-hover">
                <Image
                  src={coverPhoto.previewUrl}
                  alt="Vehicle cover preview"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="w-16 h-12 rounded-lg bg-portal-primary/10 text-portal-primary flex items-center justify-center shrink-0">
                <Car className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-bold font-headline text-portal-text truncate">
                {decodedVehicle
                  ? `${decodedVehicle.year} ${decodedVehicle.make} ${decodedVehicle.model} ${decodedVehicle.trim || ""}`
                  : "Vehicle Under Appraisal"}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-portal-text-muted">
                <span className="font-mono">VIN: {vin ? `${vin.slice(0, 8)}••••••••` : "UNVERIFIED"}</span>
                <span>•</span>
                <span>{postalCode || "M5V 2T6"}</span>
              </div>
            </div>
          </div>

          {/* Quick Specs Inline Row */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-portal-text border-t sm:border-t-0 pt-3 sm:pt-0 border-portal-border-subtle w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-portal-text-muted">Odometer:</span>
              <span className="font-semibold font-mono">{specs.mileageKm ? `${specs.mileageKm.toLocaleString()} km` : "N/A"}</span>
            </div>
            <span className="text-portal-border hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-portal-text-muted">Powertrain:</span>
              <span className="font-semibold">{specs.drivetrain || "FWD"} • {specs.transmission || "Automatic"}</span>
            </div>
            <span className="text-portal-border hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-portal-text-muted">Condition:</span>
              <span className="font-semibold">
                {damageHotspots.length === 0 ? "Clean Body" : `${damageHotspots.length} Tagged`}
              </span>
            </div>
            <span className="text-portal-border hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-portal-text-muted">Photos:</span>
              <span className="font-semibold font-mono">{photos.length} Photos</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Unified Pricing Card (Integrated Wholesale Estimate + Reserve Input) */}
      <div className="bg-portal-surface border border-portal-border rounded-xl p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-portal-text flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-portal-primary" />
              <span>Minimum Reserve Price</span>
            </h3>
            <p className="text-xs text-portal-text-muted mt-0.5">
              The lowest offer you&apos;re willing to accept. Competing dealers cannot see this number.
            </p>
          </div>

          {/* Reserve / No Reserve Toggle */}
          <div className="flex items-center gap-1 bg-portal-surface-hover p-1 rounded-xl border border-portal-border shrink-0 self-start sm:self-auto">
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

        {/* Integrated Wholesale Corridor Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl bg-portal-surface-hover/70 border border-portal-border text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-portal-primary shrink-0" />
            <div>
              <span className="text-portal-text-muted">Estimated Wholesale Range: </span>
              <span className="font-bold font-mono text-portal-text">
                {formatCadCents(wholesaleCorridor.lowCents, false)} – {formatCadCents(wholesaleCorridor.highCents)}
              </span>
            </div>
          </div>
          <button
            type="button"
            id="btn-apply-corridor"
            onClick={applyCorridorMedian}
            className="text-xs font-semibold text-portal-primary hover:underline inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Use Recommended ({formatCadCents(wholesaleCorridor.midCents)})</span>
          </button>
        </div>

        {/* Currency Input or No-Reserve Notice */}
        {!isNoReserve ? (
          <div className="space-y-2">
            <div className="relative max-w-xs">
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
                className="w-full pl-9 pr-14 py-3 rounded-xl bg-portal-surface border border-portal-border text-xl font-bold font-mono text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary focus:border-transparent transition-all shadow-inner"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-portal-text-muted">
                CAD
              </span>
            </div>
            <p className="text-xs text-portal-text-muted flex items-center gap-1.5 pt-0.5">
              <Lock className="w-3.5 h-3.5 text-portal-primary shrink-0" />
              <span>100% Private: Dealers cannot see your reserve price during bidding.</span>
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>No-Reserve Auction Selected</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Your vehicle will sell to the highest certified dealer bid at the end of the 24-hour auction.
            </p>
          </div>
        )}
      </div>

      {/* 4. Declarations (Single clean container with checklist, no separate inner cards) */}
      <div className="bg-portal-surface border border-portal-border rounded-xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-portal-text flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-portal-primary" />
              <span>Owner Declarations</span>
            </h3>
            <p className="text-xs text-portal-text-muted mt-0.5">
              Standard compliance affirmations under Canadian wholesale regulations.
            </p>
          </div>

          <button
            type="button"
            id="btn-accept-all-declarations"
            onClick={handleAcceptAllDeclarations}
            className="text-xs px-3 py-1.5 rounded-lg bg-portal-primary/10 hover:bg-portal-primary/20 text-portal-primary border border-portal-primary/30 font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Accept All (1-Click)</span>
          </button>
        </div>

        {/* Clean Checklist (Divided rows instead of 3 nested cards) */}
        <div className="divide-y divide-portal-border-subtle border-t border-portal-border-subtle pt-1">
          <label className="flex items-start gap-3 py-3 cursor-pointer group">
            <input
              type="checkbox"
              id="declaration-owner-checkbox"
              checked={declarationOwnerAttested}
              onChange={(e) => setPricingAndDeclarations({ declarationOwnerAttested: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded text-portal-primary focus:ring-portal-primary border-portal-border accent-portal-primary cursor-pointer shrink-0"
            />
            <div className="text-xs select-none">
              <span className="font-semibold text-portal-text block group-hover:text-portal-primary transition-colors">
                1. Registered Vehicle Ownership
              </span>
              <span className="text-portal-text-muted text-[11px] leading-relaxed">
                I confirm that I am the registered legal owner (or authorized corporate agent) with authority to transfer vehicle ownership.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 py-3 cursor-pointer group">
            <input
              type="checkbox"
              id="declaration-condition-checkbox"
              checked={declarationAccurateCondition}
              onChange={(e) => setPricingAndDeclarations({ declarationAccurateCondition: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded text-portal-primary focus:ring-portal-primary border-portal-border accent-portal-primary cursor-pointer shrink-0"
            />
            <div className="text-xs select-none">
              <span className="font-semibold text-portal-text block group-hover:text-portal-primary transition-colors">
                2. Accurate Vehicle Condition
              </span>
              <span className="text-portal-text-muted text-[11px] leading-relaxed">
                I certify that all declared mileage, mechanical history, and condition marks are accurate and complete.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 py-3 cursor-pointer group">
            <input
              type="checkbox"
              id="declaration-lien-checkbox"
              checked={declarationNoUnpaidFines}
              onChange={(e) => setPricingAndDeclarations({ declarationNoUnpaidFines: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded text-portal-primary focus:ring-portal-primary border-portal-border accent-portal-primary cursor-pointer shrink-0"
            />
            <div className="text-xs select-none">
              <span className="font-semibold text-portal-text block group-hover:text-portal-primary transition-colors">
                3. Clear Title & Lien Settlement
              </span>
              <span className="text-portal-text-muted text-[11px] leading-relaxed">
                I acknowledge that active financing liens will be verified and settled directly through escrow upon sale.
              </span>
            </div>
          </label>
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
              <span>Submitting Listing...</span>
            </>
          ) : (
            <>
              <span>Submit Listing & Launch Auction</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Success Modal Confirmation */}
      {submittedData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-portal-surface border border-portal-border rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl relative">
            <div className="w-14 h-14 rounded-full bg-portal-primary/10 text-portal-primary flex items-center justify-center mx-auto">
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
