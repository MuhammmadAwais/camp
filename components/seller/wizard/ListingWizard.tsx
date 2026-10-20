"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListingWizardShell } from "./ListingWizardShell";
import { VinDecodeStep } from "./VinDecodeStep";
import { VehicleSpecsStep } from "./VehicleSpecsStep";
import { DamageMapperStep } from "./DamageMapperStep";
import { PhotoUploadStep } from "./PhotoUploadStep";
import { PriceReviewStep } from "./PriceReviewStep";
import {
  WIZARD_STEPS,
  WizardStepKey,
  useListingWizardStore,
} from "@/store/useListingWizardStore";
import {
  Car,
  FileText,
  Camera,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentStep, setCurrentStep, decodedVehicle, markStepComplete } =
    useListingWizardStore();

  // Sync step from query param if provided
  useEffect(() => {
    const stepParam = searchParams.get("step") as WizardStepKey | null;
    if (stepParam && WIZARD_STEPS.some((s) => s.key === stepParam)) {
      if (stepParam !== currentStep) {
        setCurrentStep(stepParam);
      }
    }
  }, [searchParams, currentStep, setCurrentStep]);

  const handleStepChange = (nextStep: WizardStepKey) => {
    setCurrentStep(nextStep);
    router.push(`/seller/list-car?step=${nextStep}`, { scroll: false });
  };

  return (
    <ListingWizardShell currentStep={currentStep} onStepChange={handleStepChange}>
      {/* Step 1: VIN Auto-Decode */}
      {currentStep === "vin" && (
        <VinDecodeStep onNext={() => handleStepChange("details")} />
      )}

      {/* Step 2: Specs & History */}
      {currentStep === "details" && (
        <VehicleSpecsStep
          onNext={() => handleStepChange("condition")}
          onBack={() => handleStepChange("vin")}
        />
      )}

      {/* Step 3: Interactive Condition Mapper */}
      {currentStep === "condition" && (
        <DamageMapperStep
          onNext={() => handleStepChange("media")}
          onBack={() => handleStepChange("details")}
        />
      )}

      {/* Step 4: Photo Gallery & Direct-to-S3 Upload (Milestone 4.2.4) */}
      {currentStep === "media" && (
        <PhotoUploadStep
          onNext={() => handleStepChange("pricing")}
          onBack={() => handleStepChange("condition")}
        />
      )}

      {/* Step 5: Reserve Price & Legal Submission (Milestone 4.2.5) */}
      {currentStep === "pricing" && (
        <PriceReviewStep onBack={() => handleStepChange("media")} />
      )}
    </ListingWizardShell>
  );
}

export function ListingWizard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-portal-canvas flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-portal-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <WizardContent />
    </Suspense>
  );
}
