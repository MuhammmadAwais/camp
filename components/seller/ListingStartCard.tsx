"use client";

import { CarFront, Lock } from "lucide-react";
import { useKycStatus } from "@/hooks/useKyc";
import { useVinDecode } from "@/hooks/useVinDecode";
import type { KycStatus } from "@/lib/types/auth";
import { useSellIntentStore } from "@/store/useSellIntentStore";

interface Props {
  initialKycStatus: KycStatus;
}

// Bridges the landing-page VIN into the (next milestone) listing wizard.
export function ListingStartCard({ initialKycStatus }: Props) {
  const vin = useSellIntentStore((s) => s.vin);
  const decode = useVinDecode(vin);
  const { data: kyc } = useKycStatus();
  const isVerified = (kyc?.status ?? initialKycStatus) === "VERIFIED";

  const vehicle = decode.data;
  const title =
    vehicle?.source === "VPIC" ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") : vin ? "Your vehicle" : "Add your vehicle";

  return (
    <section className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="w-12 h-12 rounded-xl bg-portal-primary-tint text-portal-primary flex items-center justify-center shrink-0">
          <CarFront className="w-6 h-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-body text-xs font-bold uppercase tracking-wider text-portal-text-muted">Next step · Create your listing</p>
          <h2 className="mt-1 font-headline text-xl font-bold text-portal-text">{title}</h2>
          {vin ? (
            <p className="mt-1 font-mono text-xs tracking-widest text-portal-text-muted break-all">{vin}</p>
          ) : (
            <p className="mt-1 font-body text-sm text-portal-text-muted">You&apos;ll enter your VIN as the first step of the listing.</p>
          )}
          {vehicle?.source === "VPIC" && (vehicle.trim || vehicle.engine) && (
            <p className="mt-2 font-body text-sm text-portal-text-muted">{[vehicle.trim, vehicle.engine, vehicle.drivetrain].filter(Boolean).join(" · ")}</p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 border-t border-portal-border pt-5">
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-portal-primary px-4 py-2.5 font-body text-sm font-semibold text-white opacity-50 cursor-not-allowed"
        >
          {!isVerified && <Lock className="w-4 h-4" aria-hidden />}
          Start listing
        </button>
        <p className="font-body text-xs text-portal-text-muted">
          {isVerified
            ? "The listing wizard (photos, condition, asking price) ships in the next build."
            : "Unlocks once your identity is verified."}
        </p>
      </div>
    </section>
  );
}
