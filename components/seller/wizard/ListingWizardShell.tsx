"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Save, ShieldCheck } from "lucide-react";
import { WIZARD_STEPS, WizardStepKey, useListingWizardStore } from "@/store/useListingWizardStore";

interface ListingWizardShellProps {
  currentStep: WizardStepKey;
  onStepChange: (step: WizardStepKey) => void;
  children: React.ReactNode;
}

export function ListingWizardShell({
  currentStep,
  onStepChange,
  children,
}: ListingWizardShellProps) {
  const router = useRouter();
  const completedSteps = useListingWizardStore((s) => s.completedSteps);

  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.key === currentStep);
  const activeStepMeta = WIZARD_STEPS[currentStepIndex] ?? WIZARD_STEPS[0];

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const prevStep = WIZARD_STEPS[currentStepIndex - 1];
      onStepChange(prevStep.key);
    } else {
      router.push("/seller/dashboard");
    }
  };

  const handleSaveAndExit = () => {
    // Draft is already in local/session storage via Zustand persist
    router.push("/seller/dashboard");
  };

  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-portal-surface/90 backdrop-blur-md border-b border-portal-border">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-medium text-portal-text-muted hover:text-portal-text transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-portal-surface-hover"
            aria-label="Go to previous step"
          >
            <ArrowLeft className="w-5 h-5 text-portal-primary" />
            <span className="hidden sm:inline">
              {currentStepIndex === 0 ? "Dashboard" : "Back"}
            </span>
          </button>

          {/* Center Brand & Progress Title */}
          <div className="text-center">
            <h1 className="text-sm font-semibold tracking-wide font-headline">
              List Your Vehicle
            </h1>
            <p className="text-xs text-portal-text-muted">
              Step {activeStepMeta.number} of {WIZARD_STEPS.length}:{" "}
              <span className="font-medium text-portal-primary">{activeStepMeta.label}</span>
            </p>
          </div>

          {/* Save & Exit Button */}
          <button
            type="button"
            onClick={handleSaveAndExit}
            className="flex items-center gap-1.5 text-xs font-medium text-portal-text-muted hover:text-portal-primary transition-colors px-2.5 py-1.5 rounded-lg border border-portal-border hover:border-portal-primary/30 hover:bg-portal-surface-hover"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Exit</span>
          </button>
        </div>

        {/* Linear Stepper Progress Bar */}
        <div className="max-w-3xl mx-auto px-4 pb-3">
          {/* Progress track */}
          <div className="grid grid-cols-5 gap-2 pt-1">
            {WIZARD_STEPS.map((step, idx) => {
              const isCurrent = step.key === currentStep;
              const isComplete = completedSteps.includes(step.key) || idx < currentStepIndex;

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => {
                    // Allow navigating back to completed steps
                    if (isComplete || idx <= currentStepIndex) {
                      onStepChange(step.key);
                    }
                  }}
                  disabled={!isComplete && idx > currentStepIndex}
                  className={`group flex flex-col items-start text-left transition-all ${
                    !isComplete && idx > currentStepIndex
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  {/* Step bar indicator */}
                  <div
                    className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                      isCurrent
                        ? "bg-portal-primary shadow-sm"
                        : isComplete
                        ? "bg-portal-primary/60"
                        : "bg-portal-border"
                    }`}
                  />
                  {/* Step label on medium+ screens */}
                  <div className="hidden md:flex items-center gap-1 mt-1.5">
                    <span
                      className={`text-[11px] font-medium transition-colors ${
                        isCurrent
                          ? "text-portal-primary font-semibold"
                          : isComplete
                          ? "text-portal-text"
                          : "text-portal-text-muted"
                      }`}
                    >
                      {step.number}. {step.label}
                    </span>
                    {isComplete && !isCurrent && (
                      <Check className="w-3 h-3 text-portal-primary shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 md:py-8">
        {children}

        {/* Canadian Marketplace Trust Footer */}
        <aside className="mt-8 pt-6 border-t border-portal-border flex items-center justify-center gap-2 text-xs text-portal-text-muted">
          <ShieldCheck className="w-4 h-4 text-portal-primary shrink-0" />
          <span>
            Protected by AutoNexa Sealed-Bid Architecture · OMVIC & AMVIC Compliant
          </span>
        </aside>
      </main>
    </div>
  );
}
