"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Search, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface VinAppraisalInputProps {
  onCalculate?: (vin: string) => void;
}

export function VinAppraisalInput({ onCalculate }: VinAppraisalInputProps) {
  const [vin, setVin] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const cleanVin = (input: string) => {
    return input.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanVin(e.target.value);
    setVin(cleaned);
    if (error) setError(null);
    if (successMsg) setSuccessMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vin.length < 17) {
      setError(`VIN requires 17 characters (currently ${vin.length})`);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg(`Vehicle identified! Forwarding to valuation appraisal...`);
      onCalculate?.(vin);
    }, 600);
  };

  const sampleVins = [
    { label: "2024 Honda Civic", vin: "2HGFC2F74RH501234" },
    { label: "2022 Ford Bronco", vin: "1FMEE5DH8NLA09876" },
    { label: "2021 BMW X1", vin: "WBAHT9C00M5B23456" },
  ];

  return (
    <div
      id="vin-appraisal"
      className="w-full bg-surface-container-lowest/95 backdrop-blur-sm border border-border-card rounded-2xl p-4 sm:p-6 shadow-ambient-warm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
          <span className="font-body text-xs font-bold uppercase tracking-wider text-secondary">
            Instant Canada Valuation
          </span>
        </div>
        <span className="font-mono text-xs text-on-surface-variant font-medium">
          NHTSA VPIC • Canadian Registry Connected
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
            <Search className="w-5 h-5 text-outline" />
          </div>
          <input
            type="text"
            value={vin}
            onChange={handleInputChange}
            placeholder="Enter 17-Character Vehicle VIN (e.g. 2HGF...)"
            className="w-full pl-11 pr-20 py-3.5 bg-surface-container-low/50 border border-outline-variant/60 rounded-sm font-mono text-sm sm:text-base font-semibold tracking-wider uppercase text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            maxLength={17}
            aria-label="Vehicle Identification Number"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <span
              className={`font-mono text-xs font-bold ${
                vin.length === 17
                  ? "text-success"
                  : "text-on-surface-variant/50"
              }`}
            >
              {vin.length}/17
            </span>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full sm:w-auto px-7 whitespace-nowrap shadow-sm group"
        >
          <Sparkles className="w-4 h-4 mr-2 text-secondary-fixed transition-transform group-hover:rotate-12" />
          <span>Get Dealer Offers</span>
        </Button>
      </form>

      {error && (
        <div className="mt-2.5 flex items-center gap-2 text-xs font-body font-medium text-error animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-2.5 flex items-center gap-2 text-xs font-body font-semibold text-success animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Quick Sample VIN pills */}
      <div className="mt-3.5 pt-3 border-t border-border-card/60 flex flex-wrap items-center gap-2">
        <span className="font-body text-xs text-on-surface-variant font-medium">
          Try a demo vehicle:
        </span>
        {sampleVins.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              setVin(item.vin);
              setError(null);
            }}
            className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-xs bg-surface-container hover:bg-surface-container-high border border-border-card text-on-surface transition-colors cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
