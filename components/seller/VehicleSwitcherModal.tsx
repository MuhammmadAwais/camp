"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, X, Plus, CheckCircle2, Gavel, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { useSellerDashboard } from "@/hooks/useSellerDashboard";
import type { SellerAuctionItem } from "@/lib/types/seller";

interface VehicleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentListingId: string;
  currentListingFallback?: {
    year: number;
    make: string;
    model: string;
    vin: string;
    status: string;
    thumbnailUrl?: string;
  };
}

export function VehicleSwitcherModal({
  isOpen,
  onClose,
  currentListingId,
  currentListingFallback,
}: VehicleSwitcherModalProps) {
  const router = useRouter();
  const { data: dashboardData, isLoading } = useSellerDashboard("default");

  if (!isOpen) return null;

  const dashboardAuctions = dashboardData?.auctions ?? [];

  // Combine dashboard auctions with current listing if not already present
  const vehiclesMap = new Map<string, SellerAuctionItem>();
  dashboardAuctions.forEach((a) => vehiclesMap.set(a.id, a));

  if (!vehiclesMap.has(currentListingId) && currentListingFallback) {
    vehiclesMap.set(currentListingId, {
      id: currentListingId,
      vin: currentListingFallback.vin,
      year: currentListingFallback.year,
      make: currentListingFallback.make,
      model: currentListingFallback.model,
      mileageKm: 38450,
      status: currentListingFallback.status as any,
      thumbnailUrl: currentListingFallback.thumbnailUrl || "/showcase-cars-with-bg/2025-Toyota-4runner.png",
      reservePriceCents: 3800000,
      bidCount: 4,
      province: "ON",
      city: "Toronto",
      createdAt: new Date().toISOString(),
    });
  }

  const allVehicles = Array.from(vehiclesMap.values());

  const handleSelectVehicle = (car: SellerAuctionItem) => {
    onClose();
    if (car.id === currentListingId) return;

    if (car.status === "UNSEALED" || car.status === "ACCEPTED") {
      router.push(`/seller/listings/${car.id}/select-dealer`);
    } else {
      router.push(`/seller/listings/${car.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-portal-surface border border-portal-border rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="switch-vehicle-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 id="switch-vehicle-title" className="text-lg font-bold font-headline text-portal-text flex items-center gap-2">
              <Car className="w-5 h-5 text-portal-primary" />
              <span>Switch Listed Vehicle</span>
            </h3>
            <p className="text-xs text-portal-text-muted mt-0.5">
              Select which vehicle auction or dealer offers you want to inspect
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vehicles List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {isLoading && allVehicles.length === 0 ? (
            <div className="py-8 text-center text-xs text-portal-text-muted">
              Loading your listed inventory...
            </div>
          ) : allVehicles.length === 0 ? (
            <div className="py-8 text-center text-xs text-portal-text-muted">
              No other vehicles currently listed.
            </div>
          ) : (
            allVehicles.map((car) => {
              const isCurrent = car.id === currentListingId;
              const hasOffersReady = car.status === "UNSEALED" || car.status === "ACCEPTED";
              const isLive = car.status === "ACTIVE";

              return (
                <div
                  key={car.id}
                  onClick={() => handleSelectVehicle(car)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? "bg-portal-primary/10 border-portal-primary shadow-xs ring-1 ring-portal-primary/30"
                      : "bg-portal-surface-hover/60 border-portal-border hover:border-portal-border-hover hover:bg-portal-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-portal-surface border border-portal-border flex items-center justify-center overflow-hidden shrink-0">
                      {car.thumbnailUrl ? (
                        <img
                          src={car.thumbnailUrl}
                          alt={`${car.year} ${car.make} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="w-6 h-6 text-portal-text-muted" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-portal-text truncate">
                          {car.year} {car.make} {car.model}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-portal-primary text-white shrink-0">
                            Viewing Now
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-portal-text-muted font-mono mt-0.5">
                        <span>{car.mileageKm ? `${car.mileageKm.toLocaleString()} km` : "Ontario"}</span>
                        <span>•</span>
                        <span>VIN: {car.vin.slice(-6)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="text-right shrink-0">
                    {hasOffersReady ? (
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1">
                        <Gavel className="w-3 h-3" />
                        <span>Offers Ready</span>
                      </span>
                    ) : isLive ? (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Live Auction ({car.bidCount || 0})</span>
                      </span>
                    ) : car.status === "COMPLETED" ? (
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-portal-text-muted bg-portal-surface-hover px-2.5 py-1 rounded-full border border-portal-border">
                        In Review
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-portal-border-subtle flex items-center justify-between">
          <Link
            href="/seller/list-car"
            onClick={onClose}
            className="text-xs font-semibold text-portal-primary hover:underline inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>List Another Vehicle</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3 rounded-lg text-xs font-medium text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
