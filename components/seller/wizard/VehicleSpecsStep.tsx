"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Gauge,
  Sliders,
  Palette,
  Key,
  ShieldAlert,
  FileCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Car,
} from "lucide-react";
import { useListingWizardStore } from "@/store/useListingWizardStore";
import {
  vehicleSpecsFormSchema,
  type VehicleSpecsFormInput,
  type VehicleSpecsFormOutput,
} from "@/lib/schemas/vehicle-schema";

const EXTERIOR_COLORS = [
  { name: "Black", hex: "#111827" },
  { name: "White", hex: "#F9FAFB", border: true },
  { name: "Silver", hex: "#9CA3AF" },
  { name: "Grey", hex: "#4B5563" },
  { name: "Blue", hex: "#1D4ED8" },
  { name: "Red", hex: "#DC2626" },
  { name: "Brown", hex: "#78350F" },
  { name: "Green", hex: "#15803D" },
  { name: "Beige / Gold", hex: "#D97706" },
  { name: "Other / Custom", hex: "transparent", custom: true },
];

const INTERIOR_COLORS = ["Black", "Grey", "Tan / Beige", "Brown", "Red", "Other"];

interface VehicleSpecsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function VehicleSpecsStep({ onNext, onBack }: VehicleSpecsStepProps) {
  const {
    decodedVehicle,
    specs,
    updateVehicleSpecs,
    markStepComplete,
  } = useListingWizardStore();

  // Initialize form with existing store specs or fallback to decoded vehicle data
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<VehicleSpecsFormInput, unknown, VehicleSpecsFormOutput>({
    resolver: zodResolver(vehicleSpecsFormSchema),
    mode: "onChange",
    defaultValues: {
      mileageKm: specs.mileageKm ?? ("" as any),
      transmission: specs.transmission || decodedVehicle?.transmission || "Automatic",
      drivetrain: specs.drivetrain || decodedVehicle?.drivetrain || "AWD",
      exteriorColor: specs.exteriorColor || "Black",
      interiorColor: specs.interiorColor || "Black",
      keysCount: specs.keysCount || 2,
      accidentDeclaration: specs.accidentDeclaration ?? false,
      accidentCount: specs.accidentCount ?? 0,
      accidentDetails: specs.accidentDetails || "",
      hasLien: specs.hasLien ?? false,
      lienDetails: specs.lienDetails || "",
    },
  });

  const hasAccident = watch("accidentDeclaration");
  const hasLien = watch("hasLien");
  const selectedExtColor = watch("exteriorColor");

  const onSubmit = (data: VehicleSpecsFormOutput) => {
    updateVehicleSpecs({
      mileageKm: data.mileageKm,
      transmission: data.transmission,
      drivetrain: data.drivetrain,
      exteriorColor: data.exteriorColor,
      interiorColor: data.interiorColor,
      keysCount: data.keysCount,
      accidentDeclaration: data.accidentDeclaration,
      accidentCount: data.accidentDeclaration ? data.accidentCount : 0,
      accidentDetails: data.accidentDeclaration ? data.accidentDetails : "",
      hasLien: data.hasLien,
      lienDetails: data.hasLien ? data.lienDetails : "",
    });
    markStepComplete("details");
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Intro & Decoded Vehicle Capsule */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary flex items-center gap-1">
            <Car className="w-3 h-3" />
            <span>
              {decodedVehicle
                ? `${decodedVehicle.year} ${decodedVehicle.make} ${decodedVehicle.model}`
                : "Vehicle Identified"}
            </span>
          </span>
          {decodedVehicle?.trim && (
            <span className="text-xs text-portal-text-muted">{decodedVehicle.trim}</span>
          )}
        </div>
        <h2 className="text-xl md:text-2xl font-bold font-headline text-portal-text">
          Vehicle Specifications & History
        </h2>
        <p className="text-sm text-portal-text-muted mt-1">
          Accurate mileage and history ensure fair wholesale bids from certified Canadian dealers.
        </p>
      </div>

      {/* 1. Odometer Reading Card */}
      <div className="bg-portal-surface border border-portal-border rounded-xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-portal-primary" />
          <h3 className="text-sm font-semibold text-portal-text uppercase tracking-wider">
            Odometer Mileage
          </h3>
        </div>

        <div>
          <label htmlFor="mileageKm" className="text-xs font-medium text-portal-text-muted block mb-1.5">
            Current Kilometers (km) <span className="text-error">*</span>
          </label>
          <div className="relative max-w-sm">
            <input
              id="mileageKm"
              type="number"
              placeholder="e.g. 84500"
              {...register("mileageKm")}
              className={`w-full px-4 py-3 rounded-xl font-mono text-base bg-portal-surface border transition-all outline-none ${
                errors.mileageKm
                  ? "border-error focus:ring-2 focus:ring-error/20"
                  : "border-portal-border focus:border-portal-primary focus:ring-2 focus:ring-portal-primary/20"
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-portal-text-muted uppercase">
              KM
            </span>
          </div>
          {errors.mileageKm && (
            <p className="text-xs text-error mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.mileageKm.message}</span>
            </p>
          )}
          <p className="text-[11px] text-portal-text-muted mt-1.5">
            Must reflect the exact reading displayed on your dashboard gauge cluster.
          </p>
        </div>
      </div>

      {/* 2. Drivetrain & Transmission Card */}
      <div className="bg-portal-surface border border-portal-border rounded-xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-portal-primary" />
          <h3 className="text-sm font-semibold text-portal-text uppercase tracking-wider">
            Powertrain Configuration
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Transmission Select */}
          <div>
            <label htmlFor="transmission" className="text-xs font-medium text-portal-text-muted block mb-1.5">
              Transmission <span className="text-error">*</span>
            </label>
            <select
              id="transmission"
              {...register("transmission")}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-portal-surface border border-portal-border text-portal-text outline-none focus:border-portal-primary focus:ring-2 focus:ring-portal-primary/20"
            >
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual (Standard)</option>
              <option value="CVT">CVT (Continuously Variable)</option>
              <option value="Dual-Clutch">Dual-Clutch (DCT / DSG)</option>
            </select>
            {errors.transmission && (
              <p className="text-xs text-error mt-1">{errors.transmission.message}</p>
            )}
          </div>

          {/* Drivetrain Select */}
          <div>
            <label htmlFor="drivetrain" className="text-xs font-medium text-portal-text-muted block mb-1.5">
              Drivetrain <span className="text-error">*</span>
            </label>
            <select
              id="drivetrain"
              {...register("drivetrain")}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-portal-surface border border-portal-border text-portal-text outline-none focus:border-portal-primary focus:ring-2 focus:ring-portal-primary/20"
            >
              <option value="AWD">All-Wheel Drive (AWD)</option>
              <option value="FWD">Front-Wheel Drive (FWD)</option>
              <option value="4WD">Four-Wheel Drive (4WD / 4x4)</option>
              <option value="RWD">Rear-Wheel Drive (RWD)</option>
            </select>
            {errors.drivetrain && (
              <p className="text-xs text-error mt-1">{errors.drivetrain.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Colours & Keys Card */}
      <div className="bg-portal-surface border border-portal-border rounded-xl p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-portal-primary" />
          <h3 className="text-sm font-semibold text-portal-text uppercase tracking-wider">
            Colors & Key Count
          </h3>
        </div>

        {/* Exterior Color Swatches */}
        <div>
          <label className="text-xs font-medium text-portal-text-muted block mb-2">
            Exterior Colour <span className="text-error">*</span>
          </label>
          <Controller
            name="exteriorColor"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {EXTERIOR_COLORS.map((color) => {
                  const isSelected = field.value === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => field.onChange(color.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? "border-portal-primary bg-portal-primary/10 text-portal-primary font-semibold shadow-xs"
                          : "border-portal-border bg-portal-surface text-portal-text hover:bg-portal-surface-hover"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                        style={{
                          backgroundColor: color.hex,
                          borderColor: color.border ? "#D1D5DB" : "rgba(0,0,0,0.1)",
                        }}
                      />
                      <span>{color.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.exteriorColor && (
            <p className="text-xs text-error mt-1">{errors.exteriorColor.message}</p>
          )}
        </div>

        {/* Interior Color Select & Number of Keys */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-portal-border-subtle">
          <div>
            <label htmlFor="interiorColor" className="text-xs font-medium text-portal-text-muted block mb-1.5">
              Interior Colour <span className="text-error">*</span>
            </label>
            <select
              id="interiorColor"
              {...register("interiorColor")}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-portal-surface border border-portal-border text-portal-text outline-none focus:border-portal-primary focus:ring-2 focus:ring-portal-primary/20"
            >
              {INTERIOR_COLORS.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="keysCount" className="text-xs font-medium text-portal-text-muted block mb-1.5 flex items-center gap-1">
              <Key className="w-3 h-3 text-portal-primary" />
              <span>Working Keys / Fobs <span className="text-error">*</span></span>
            </label>
            <select
              id="keysCount"
              {...register("keysCount")}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-portal-surface border border-portal-border text-portal-text outline-none focus:border-portal-primary focus:ring-2 focus:ring-portal-primary/20"
            >
              <option value="1">1 Key</option>
              <option value="2">2 Keys (Standard Pair)</option>
              <option value="3">3 Keys</option>
              <option value="4">4+ Keys</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Canadian History, Accident & Lien Declarations */}
      <div className="bg-portal-surface border border-portal-border rounded-xl p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-portal-primary" />
          <h3 className="text-sm font-semibold text-portal-text uppercase tracking-wider">
            History & Ownership Declarations
          </h3>
        </div>

        {/* Accident Declaration Toggle */}
        <div className="p-4 rounded-xl border border-portal-border bg-portal-surface-hover/50 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-portal-text">
                Has this vehicle ever had a reported collision or insurance claim?
              </p>
              <p className="text-[11px] text-portal-text-muted mt-0.5">
                Full disclosure protects your sale and prevents post-auction price adjustments.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                type="checkbox"
                {...register("accidentDeclaration")}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-portal-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-portal-primary"></div>
            </label>
          </div>

          {/* Conditional Accident Details */}
          {hasAccident && (
            <div className="pt-3 border-t border-portal-border space-y-3 animate-in fade-in duration-200">
              <div className="max-w-xs">
                <label htmlFor="accidentCount" className="text-[11px] font-medium text-portal-text-muted block mb-1">
                  Number of Claims
                </label>
                <input
                  id="accidentCount"
                  type="number"
                  min={1}
                  max={10}
                  {...register("accidentCount")}
                  className="w-full px-3 py-2 rounded-lg bg-portal-surface border border-portal-border text-sm text-portal-text outline-none focus:border-portal-primary"
                  placeholder="e.g. 1"
                />
              </div>

              <div>
                <label htmlFor="accidentDetails" className="text-[11px] font-medium text-portal-text-muted block mb-1">
                  Details & Repaired Areas (Optional)
                </label>
                <textarea
                  id="accidentDetails"
                  rows={2}
                  {...register("accidentDetails")}
                  placeholder="e.g. Rear bumper replaced after parking lot scrape in 2023. Repaired by certified Toyota collision centre."
                  className="w-full px-3 py-2 rounded-lg bg-portal-surface border border-portal-border text-xs text-portal-text outline-none focus:border-portal-primary resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Existing Lien / Loan Toggle */}
        <div className="p-4 rounded-xl border border-portal-border bg-portal-surface-hover/50 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-portal-text">
                Is there an active lease, loan, or lien on the title?
              </p>
              <p className="text-[11px] text-portal-text-muted mt-0.5">
                Lien payouts are handled securely and transparently by the winning dealership.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                type="checkbox"
                {...register("hasLien")}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-portal-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-portal-primary"></div>
            </label>
          </div>

          {/* Conditional Lien Details */}
          {hasLien && (
            <div className="pt-3 border-t border-portal-border space-y-2 animate-in fade-in duration-200">
              <label htmlFor="lienDetails" className="text-[11px] font-medium text-portal-text-muted block mb-1">
                Lienholder Financial Institution & Payout Estimate (CAD)
              </label>
              <input
                id="lienDetails"
                type="text"
                {...register("lienDetails")}
                placeholder="e.g. Scotiabank Automotive Financing (~$12,400 remaining)"
                className="w-full px-3 py-2 rounded-lg bg-portal-surface border border-portal-border text-xs text-portal-text outline-none focus:border-portal-primary"
              />
              <p className="text-[11px] text-portal-text-muted flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-portal-primary shrink-0" />
                <span>The dealer will contact the bank directly to obtain the payout letter upon sale.</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium border border-portal-border hover:bg-portal-surface-hover text-portal-text-muted transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to VIN</span>
        </button>

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 text-white bg-portal-primary hover:bg-portal-primary-hover shadow-sm"
        >
          <span>Continue to Condition Map</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
