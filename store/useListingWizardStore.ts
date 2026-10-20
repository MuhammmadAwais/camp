import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DecodedVehicle } from "@/lib/schemas/vehicle-schema";

export type WizardStepKey = "vin" | "details" | "condition" | "media" | "pricing";

export const WIZARD_STEPS: Array<{ key: WizardStepKey; label: string; number: number }> = [
  { key: "vin", label: "VIN Decode", number: 1 },
  { key: "details", label: "Specs & History", number: 2 },
  { key: "condition", label: "Condition Map", number: 3 },
  { key: "media", label: "Photo Gallery", number: 4 },
  { key: "pricing", label: "Price & Submit", number: 5 },
];

export type DamageSeverity = "MINOR" | "MODERATE" | "SEVERE";
export type DamageViewType = "front" | "rear" | "driver_side" | "passenger_side" | "roof";

export type DamageHotspot = {
  id: string;
  view: DamageViewType;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  severity: DamageSeverity;
  areaLabel?: string;
  description: string;
  photoUrl?: string;
};

export type ListingPhoto = {
  id: string;
  previewUrl: string;
  s3Key?: string;
  fileName: string;
  fileSizeBytes: number;
  isCover: boolean;
  status: "pending" | "uploading" | "uploaded" | "error";
  progress?: number;
};

export type VehicleSpecsState = {
  mileageKm: number | null;
  transmission: string | null;
  drivetrain: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  keysCount: number;
  accidentDeclaration: boolean;
  accidentCount: number;
  accidentDetails: string;
  hasLien: boolean;
  lienDetails: string;
};

export type ListingWizardState = {
  // Step navigation
  currentStep: WizardStepKey;
  completedSteps: WizardStepKey[];

  // Step 1: VIN & Vehicle Info
  vin: string;
  postalCode: string;
  decodedVehicle: DecodedVehicle | null;
  manualOverride: boolean;
  isVinVerified: boolean;

  // Step 2: Specs & History
  specs: VehicleSpecsState;

  // Step 3: Condition / Damage Hotspots
  damageHotspots: DamageHotspot[];

  // Step 4: Media
  photos: ListingPhoto[];

  // Step 5: Reserve Price & Declarations
  reservePriceCents: number | null; // Integer CAD cents invariant
  declarationOwnerAttested: boolean;
  declarationAccurateCondition: boolean;
  declarationNoUnpaidFines: boolean;

  // Actions
  setCurrentStep: (step: WizardStepKey) => void;
  markStepComplete: (step: WizardStepKey) => void;
  setVin: (vin: string) => void;
  setPostalCode: (postalCode: string) => void;
  setDecodedVehicle: (vehicle: DecodedVehicle | null) => void;
  setManualOverride: (override: boolean) => void;
  updateVehicleSpecs: (partial: Partial<VehicleSpecsState>) => void;
  updateDecodedFields: (partial: Partial<DecodedVehicle>) => void;
  addDamageHotspot: (hotspot: DamageHotspot) => void;
  updateDamageHotspot: (id: string, partial: Partial<DamageHotspot>) => void;
  removeDamageHotspot: (id: string) => void;
  addPhoto: (photo: ListingPhoto) => void;
  removePhoto: (id: string) => void;
  setCoverPhoto: (id: string) => void;
  updatePhotoStatus: (id: string, partial: Partial<ListingPhoto>) => void;
  setPricingAndDeclarations: (data: {
    reservePriceCents?: number | null;
    declarationOwnerAttested?: boolean;
    declarationAccurateCondition?: boolean;
    declarationNoUnpaidFines?: boolean;
  }) => void;
  resetWizard: () => void;
};

const initialSpecs: VehicleSpecsState = {
  mileageKm: null,
  transmission: null,
  drivetrain: null,
  exteriorColor: null,
  interiorColor: null,
  keysCount: 2,
  accidentDeclaration: false,
  accidentCount: 0,
  accidentDetails: "",
  hasLien: false,
  lienDetails: "",
};

export const useListingWizardStore = create<ListingWizardState>()(
  persist(
    (set) => ({
      currentStep: "vin",
      completedSteps: [],

      vin: "",
      postalCode: "",
      decodedVehicle: null,
      manualOverride: false,
      isVinVerified: false,

      specs: initialSpecs,
      damageHotspots: [],
      photos: [],

      reservePriceCents: null,
      declarationOwnerAttested: false,
      declarationAccurateCondition: false,
      declarationNoUnpaidFines: false,

      setCurrentStep: (currentStep) => set({ currentStep }),

      markStepComplete: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),

      setVin: (vin) => set({ vin, isVinVerified: false }),

      setPostalCode: (postalCode) => set({ postalCode }),

      setDecodedVehicle: (decodedVehicle) =>
        set((state) => {
          const isVerified = Boolean(decodedVehicle && decodedVehicle.source === "VPIC");
          return {
            decodedVehicle,
            isVinVerified: isVerified,
            // Sync initial specs from decoded data
            specs: {
              ...state.specs,
              transmission: decodedVehicle?.transmission ?? state.specs.transmission,
              drivetrain: decodedVehicle?.drivetrain ?? state.specs.drivetrain,
            },
          };
        }),

      setManualOverride: (manualOverride) => set({ manualOverride }),

      updateVehicleSpecs: (partial) =>
        set((state) => ({
          specs: { ...state.specs, ...partial },
        })),

      updateDecodedFields: (partial) =>
        set((state) => ({
          decodedVehicle: state.decodedVehicle
            ? { ...state.decodedVehicle, ...partial }
            : {
                vin: state.vin,
                year: null,
                make: null,
                model: null,
                trim: null,
                bodyStyle: null,
                engine: null,
                transmission: null,
                drivetrain: null,
                fuelType: null,
                source: "MANUAL",
                ...partial,
              },
        })),

      addDamageHotspot: (hotspot) =>
        set((state) => ({
          damageHotspots: [...state.damageHotspots, hotspot],
        })),

      updateDamageHotspot: (id, partial) =>
        set((state) => ({
          damageHotspots: state.damageHotspots.map((h) =>
            h.id === id ? { ...h, ...partial } : h
          ),
        })),

      removeDamageHotspot: (id) =>
        set((state) => ({
          damageHotspots: state.damageHotspots.filter((h) => h.id !== id),
        })),

      addPhoto: (photo) =>
        set((state) => {
          const isFirst = state.photos.length === 0;
          return {
            photos: [...state.photos, { ...photo, isCover: photo.isCover || isFirst }],
          };
        }),

      removePhoto: (id) =>
        set((state) => {
          const remaining = state.photos.filter((p) => p.id !== id);
          if (remaining.length > 0 && !remaining.some((p) => p.isCover)) {
            remaining[0].isCover = true;
          }
          return { photos: remaining };
        }),

      setCoverPhoto: (id) =>
        set((state) => ({
          photos: state.photos.map((p) => ({
            ...p,
            isCover: p.id === id,
          })),
        })),

      updatePhotoStatus: (id, partial) =>
        set((state) => ({
          photos: state.photos.map((p) => (p.id === id ? { ...p, ...partial } : p)),
        })),

      setPricingAndDeclarations: (data) =>
        set((state) => ({
          reservePriceCents:
            data.reservePriceCents !== undefined
              ? data.reservePriceCents
              : state.reservePriceCents,
          declarationOwnerAttested:
            data.declarationOwnerAttested !== undefined
              ? data.declarationOwnerAttested
              : state.declarationOwnerAttested,
          declarationAccurateCondition:
            data.declarationAccurateCondition !== undefined
              ? data.declarationAccurateCondition
              : state.declarationAccurateCondition,
          declarationNoUnpaidFines:
            data.declarationNoUnpaidFines !== undefined
              ? data.declarationNoUnpaidFines
              : state.declarationNoUnpaidFines,
        })),

      resetWizard: () =>
        set({
          currentStep: "vin",
          completedSteps: [],
          vin: "",
          postalCode: "",
          decodedVehicle: null,
          manualOverride: false,
          isVinVerified: false,
          specs: initialSpecs,
          damageHotspots: [],
          photos: [],
          reservePriceCents: null,
          declarationOwnerAttested: false,
          declarationAccurateCondition: false,
          declarationNoUnpaidFines: false,
        }),
    }),
    {
      name: "autonexa-listing-wizard-draft",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
