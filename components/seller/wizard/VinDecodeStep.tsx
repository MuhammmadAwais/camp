"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Car,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useListingWizardStore } from "@/store/useListingWizardStore";
import { useSellIntentStore } from "@/store/useSellIntentStore";
import { sanitizeVinInput, isValidVin, computeVinCheckDigit } from "@/lib/vin";
import { normalizePostalCode, isValidPostalCode, suggestProvinceFromPostal } from "@/lib/canada";
import { apiClient } from "@/lib/api-client";
import type { DecodedVehicle } from "@/lib/schemas/vehicle-schema";

interface VinDecodeStepProps {
  onNext: () => void;
}

export function VinDecodeStep({ onNext }: VinDecodeStepProps) {
  const {
    vin,
    postalCode,
    decodedVehicle,
    manualOverride,
    setVin,
    setPostalCode,
    setDecodedVehicle,
    setManualOverride,
    updateDecodedFields,
    markStepComplete,
  } = useListingWizardStore();

  const sellIntent = useSellIntentStore();

  // Local form state
  const [inputVin, setInputVin] = useState(vin);
  const [inputPostal, setInputPostal] = useState(postalCode);
  const [showVinHelp, setShowVinHelp] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync with landing page sell intent if wizard is fresh
  useEffect(() => {
    if (!vin && sellIntent.vin) {
      setInputVin(sellIntent.vin);
      setVin(sellIntent.vin);
    }
    if (!postalCode && sellIntent.postalCode) {
      setInputPostal(sellIntent.postalCode);
      setPostalCode(sellIntent.postalCode);
    }
  }, [vin, postalCode, sellIntent, setVin, setPostalCode]);

  // Real-time VIN checks
  const sanitizedVin = sanitizeVinInput(inputVin);
  const isExact17 = sanitizedVin.length === 17;
  const isCheckDigitValid = isExact17 && isValidVin(sanitizedVin);
  const checkDigit = isExact17 ? computeVinCheckDigit(sanitizedVin) : null;

  // Canadian postal code check
  const isPostalValid = inputPostal.trim() === "" || isValidPostalCode(inputPostal);
  const detectedProvince = inputPostal ? suggestProvinceFromPostal(inputPostal) : null;

  // TanStack mutation for NHTSA vPIC auto-decode
  const decodeMutation = useMutation({
    mutationFn: async (targetVin: string) => {
      const res = await apiClient.api.post<DecodedVehicle>("/api/vin/decode", {
        vin: targetVin,
      });
      if (!res.success) {
        throw new Error(res.error || "Failed to decode VIN");
      }
      return res.data;
    },
    onSuccess: (data) => {
      setValidationError(null);
      setDecodedVehicle(data);
      if (data.source === "MANUAL") {
        setManualOverride(true);
      }
    },
    onError: (err: Error) => {
      setValidationError(err.message || "Decoding timed out. Please enter specs manually.");
      setManualOverride(true);
    },
  });

  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeVinInput(raw);
    setInputVin(sanitized);
    setVin(sanitized);
    setValidationError(null);
  };

  const handlePostalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const normalized = normalizePostalCode(raw);
    setInputPostal(normalized);
    setPostalCode(normalized);
  };

  const handleDecode = () => {
    if (!isExact17) {
      setValidationError("A valid VIN must have exactly 17 characters.");
      return;
    }
    if (!isCheckDigitValid) {
      setValidationError(
        "This VIN fails the ISO 3779 checksum test. Please verify the characters on your vehicle ownership slip."
      );
      return;
    }
    decodeMutation.mutate(sanitizedVin);
  };

  const handleProceed = () => {
    if (!decodedVehicle) {
      handleDecode();
      return;
    }
    // Mark Step 1 complete and advance to Step 2
    markStepComplete("vin");
    onNext();
  };

  // Determine if ready to proceed
  const canProceed =
    decodedVehicle &&
    (decodedVehicle.year !== null || manualOverride) &&
    (decodedVehicle.make !== null || manualOverride) &&
    (decodedVehicle.model !== null || manualOverride);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold font-headline text-portal-text">
          Vehicle Identification & Origin
        </h2>
        <p className="text-sm text-portal-text-muted mt-1">
          Enter your 17-character VIN. We’ll automatically decode the year, make, model,
          and factory specs to build your 24h auction listing.
        </p>
      </div>

      {/* Main VIN Intake Card */}
      <div className="bg-portal-surface border border-portal-border rounded-xl p-5 md:p-6 shadow-xs space-y-5">
        {/* VIN Input Group */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="vin-input"
              className="text-xs font-semibold uppercase tracking-wider text-portal-text flex items-center gap-1.5"
            >
              <Car className="w-3.5 h-3.5 text-portal-primary" />
              <span>Vehicle Identification Number (VIN)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowVinHelp(!showVinHelp)}
              className="text-xs text-portal-text-muted hover:text-portal-primary flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Where to find?</span>
            </button>
          </div>

          {/* VIN helper banner */}
          {showVinHelp && (
            <div className="mb-3 p-3 bg-portal-surface-hover rounded-lg text-xs text-portal-text-muted border border-portal-border-subtle animate-in fade-in duration-200">
              <p className="font-medium text-portal-text mb-1">
                Your VIN is located in 3 common places:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Driver&apos;s side door jamb on the manufacturer sticker</li>
                <li>Lower-left corner of the dashboard/windshield (visible from outside)</li>
                <li>Canadian vehicle registration/ownership slip</li>
              </ul>
            </div>
          )}

          <div className="relative">
            <input
              id="vin-input"
              type="text"
              value={inputVin}
              onChange={handleVinChange}
              placeholder="e.g. 2T3C1RFV1NC123456"
              maxLength={17}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
              className={`w-full px-4 py-3 rounded-xl font-mono text-base tracking-wider bg-portal-surface border transition-all outline-none ${
                isExact17
                  ? isCheckDigitValid
                    ? "border-portal-primary/60 focus:border-portal-primary focus:ring-2 focus:ring-portal-primary/20"
                    : "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                  : "border-portal-border focus:border-portal-primary focus:ring-2 focus:ring-portal-primary/20"
              }`}
            />
            {/* Character counter & check-digit status */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span
                className={`text-xs font-mono font-medium ${
                  isExact17 ? "text-portal-primary" : "text-portal-text-muted"
                }`}
              >
                {sanitizedVin.length}/17
              </span>
              {isExact17 && (
                isCheckDigitValid ? (
                  <CheckCircle2 className="w-4 h-4 text-portal-primary" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-error" />
                )
              )}
            </div>
          </div>

          {/* Real-time check-digit helper notice */}
          {isExact17 && !isCheckDigitValid && (
            <p className="text-xs text-error mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Checksum invalid (expected check digit &apos;{checkDigit}&apos; at position 9). Please re-check characters.
              </span>
            </p>
          )}
        </div>

        {/* Postal Code Input (for regional dealer distance matching) */}
        <div>
          <label
            htmlFor="postal-input"
            className="text-xs font-semibold uppercase tracking-wider text-portal-text flex items-center gap-1.5 mb-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-portal-primary" />
            <span>Canadian Postal Code (Vehicle Location)</span>
          </label>
          <div className="relative max-w-xs">
            <input
              id="postal-input"
              type="text"
              value={inputPostal}
              onChange={handlePostalChange}
              placeholder="e.g. M5V 2T6"
              maxLength={7}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono tracking-wider bg-portal-surface border transition-all outline-none ${
                inputPostal && !isPostalValid
                  ? "border-error focus:ring-error/20"
                  : "border-portal-border focus:border-portal-primary focus:ring-2 focus:ring-portal-primary/20"
              }`}
            />
            {detectedProvince && isPostalValid && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-portal-primary bg-portal-primary/10 px-2 py-0.5 rounded-md">
                {detectedProvince}
              </span>
            )}
          </div>
          <p className="text-[11px] text-portal-text-muted mt-1">
            Helps verified local dealers within your 25km–150km radius match your auction.
          </p>
        </div>

        {/* Validation error display */}
        {validationError && (
          <div className="p-3 bg-portal-surface-hover border border-error/30 rounded-xl flex items-start gap-2.5 text-xs text-error">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to automatically verify VIN</p>
              <p className="mt-0.5">{validationError}</p>
            </div>
          </div>
        )}

        {/* Decode Action Button */}
        {!decodedVehicle && (
          <button
            type="button"
            onClick={handleDecode}
            disabled={!isExact17 || !isCheckDigitValid || decodeMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 text-white bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {decodeMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Decoding with NHTSA vPIC...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Decode Vehicle Specifications</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Verified Vehicle Preview Card (Appears once decoded) */}
      {decodedVehicle && (
        <div className="bg-portal-surface border border-portal-primary/40 rounded-xl p-5 md:p-6 shadow-sm space-y-4 animate-in fade-in-50 duration-300">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-portal-primary bg-portal-primary/10 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3" />
                  {decodedVehicle.source === "VPIC" ? "NHTSA Auto-Decoded" : "Manual Specification"}
                </span>
                <span className="text-xs text-portal-text-muted font-mono">{decodedVehicle.vin}</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold font-headline text-portal-text mt-1.5">
                {decodedVehicle.year} {decodedVehicle.make} {decodedVehicle.model}{" "}
                {decodedVehicle.trim ? `• ${decodedVehicle.trim}` : ""}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => decodeMutation.mutate(sanitizedVin)}
              disabled={decodeMutation.isPending}
              className="text-xs text-portal-text-muted hover:text-portal-primary flex items-center gap-1 transition-colors p-1"
              title="Re-decode VIN"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${decodeMutation.isPending ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Vehicle Spec Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-portal-border-subtle text-xs">
            <div className="bg-portal-surface-hover p-2.5 rounded-lg">
              <span className="text-portal-text-muted block text-[11px]">Body Class</span>
              <span className="font-semibold text-portal-text truncate block">
                {decodedVehicle.bodyStyle ?? "Standard"}
              </span>
            </div>
            <div className="bg-portal-surface-hover p-2.5 rounded-lg">
              <span className="text-portal-text-muted block text-[11px]">Engine</span>
              <span className="font-semibold text-portal-text truncate block">
                {decodedVehicle.engine ?? "Factory Spec"}
              </span>
            </div>
            <div className="bg-portal-surface-hover p-2.5 rounded-lg">
              <span className="text-portal-text-muted block text-[11px]">Transmission</span>
              <span className="font-semibold text-portal-text truncate block">
                {decodedVehicle.transmission ?? "Automatic"}
              </span>
            </div>
            <div className="bg-portal-surface-hover p-2.5 rounded-lg">
              <span className="text-portal-text-muted block text-[11px]">Drivetrain</span>
              <span className="font-semibold text-portal-text truncate block">
                {decodedVehicle.drivetrain ?? "Front-Wheel Drive"}
              </span>
            </div>
            <div className="bg-portal-surface-hover p-2.5 rounded-lg">
              <span className="text-portal-text-muted block text-[11px]">Fuel Type</span>
              <span className="font-semibold text-portal-text truncate block">
                {decodedVehicle.fuelType ?? "Gasoline"}
              </span>
            </div>
            <div className="bg-portal-surface-hover p-2.5 rounded-lg">
              <span className="text-portal-text-muted block text-[11px]">Location</span>
              <span className="font-semibold text-portal-text truncate block">
                {detectedProvince ? `${detectedProvince}, Canada` : "Canada"}
              </span>
            </div>
          </div>

          {/* Manual override expansion accordion */}
          <div className="pt-2 border-t border-portal-border-subtle">
            <button
              type="button"
              onClick={() => setManualOverride(!manualOverride)}
              className="text-xs font-medium text-portal-text-muted hover:text-portal-primary flex items-center justify-between w-full py-1 transition-colors"
            >
              <span>Not your vehicle or need to correct details?</span>
              {manualOverride ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {manualOverride && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-2 border-t border-portal-border-subtle text-xs animate-in fade-in duration-200">
                <div>
                  <label className="text-[11px] font-medium text-portal-text-muted block mb-1">
                    Model Year
                  </label>
                  <input
                    type="number"
                    value={decodedVehicle.year ?? ""}
                    onChange={(e) =>
                      updateDecodedFields({ year: e.target.value ? Number(e.target.value) : null })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-portal-surface border border-portal-border text-portal-text outline-none focus:border-portal-primary"
                    placeholder="e.g. 2022"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-portal-text-muted block mb-1">
                    Make
                  </label>
                  <input
                    type="text"
                    value={decodedVehicle.make ?? ""}
                    onChange={(e) => updateDecodedFields({ make: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg bg-portal-surface border border-portal-border text-portal-text outline-none focus:border-portal-primary"
                    placeholder="e.g. Toyota"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-portal-text-muted block mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={decodedVehicle.model ?? ""}
                    onChange={(e) => updateDecodedFields({ model: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg bg-portal-surface border border-portal-border text-portal-text outline-none focus:border-portal-primary"
                    placeholder="e.g. RAV4"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-portal-text-muted block mb-1">
                    Trim / Package
                  </label>
                  <input
                    type="text"
                    value={decodedVehicle.trim ?? ""}
                    onChange={(e) => updateDecodedFields({ trim: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg bg-portal-surface border border-portal-border text-portal-text outline-none focus:border-portal-primary"
                    placeholder="e.g. XLE Premium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-portal-text-muted block mb-1">
                    Transmission
                  </label>
                  <select
                    value={decodedVehicle.transmission ?? "Automatic"}
                    onChange={(e) => updateDecodedFields({ transmission: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-portal-surface border border-portal-border text-portal-text outline-none focus:border-portal-primary"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                    <option value="CVT">CVT</option>
                    <option value="Dual-Clutch">Dual-Clutch</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-portal-text-muted block mb-1">
                    Drivetrain
                  </label>
                  <select
                    value={decodedVehicle.drivetrain ?? "AWD"}
                    onChange={(e) => updateDecodedFields({ drivetrain: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-portal-surface border border-portal-border text-portal-text outline-none focus:border-portal-primary"
                  >
                    <option value="AWD">All-Wheel Drive (AWD)</option>
                    <option value="4WD">Four-Wheel Drive (4WD)</option>
                    <option value="FWD">Front-Wheel Drive (FWD)</option>
                    <option value="RWD">Rear-Wheel Drive (RWD)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom Actions */}
      <div className="pt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={handleProceed}
          disabled={!canProceed}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 text-white bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <span>Confirm & Continue to Specs</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
