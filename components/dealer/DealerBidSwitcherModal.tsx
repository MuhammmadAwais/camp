"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gavel,
  X,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  TrendingUp,
  Lock,
  RefreshCw,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import type { WholesaleAuctionItem } from "@/lib/types/dealer";
import { useDealerInventory } from "@/hooks/useDealerInventory";

interface DealerBidSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAuctionId: string;
  onSelectVehicle?: (vehicle: WholesaleAuctionItem) => void;
}

const emptySubscribe = () => () => {};

export function DealerBidSwitcherModal({
  isOpen,
  onClose,
  currentAuctionId,
  onSelectVehicle,
}: DealerBidSwitcherModalProps) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [activeTab, setActiveTab] = useState<"BIDS" | "ALL">("BIDS");

  const { data, isLoading } = useDealerInventory({ enabled: isOpen });
  const items = data?.items ?? [];

  // Disable body scroll & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Filter items based on active tab
  const activeBidsList = items.filter(
    (item) => item.myCurrentBidCents !== null && item.myCurrentBidCents !== undefined && item.myCurrentBidCents > 0
  );
  const displayedItems = activeTab === "BIDS" ? activeBidsList : items;

  const handleSelect = (car: WholesaleAuctionItem) => {
    onClose();
    if (car.id === currentAuctionId) return;

    if (onSelectVehicle) {
      onSelectVehicle(car);
    }
    router.push(`/dealer/auctions/${car.id}`);
  };

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        className="bg-portal-surface border border-portal-border rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="switch-bids-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3
              id="switch-bids-modal-title"
              className="text-lg font-bold font-headline text-portal-text flex items-center gap-2"
            >
              <Gavel className="w-5 h-5 text-portal-primary" />
              <span>Switch Active Bids & Auctions</span>
            </h3>
            <p className="text-xs text-portal-text-muted mt-0.5">
              Jump between wholesale lots with active bids or explore the live floor
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

        {/* Segmented Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-portal-surface-hover/70 border border-portal-border text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("BIDS")}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "BIDS"
                ? "bg-portal-surface text-portal-text shadow-2xs border border-portal-border"
                : "text-portal-text-muted hover:text-portal-text"
            }`}
          >
            <span>My Active Bids</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
              {activeBidsList.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-portal-surface text-portal-text shadow-2xs border border-portal-border"
                : "text-portal-text-muted hover:text-portal-text"
            }`}
          >
            <span>Live Floor Inventory</span>
            <span className="px-1.5 py-0.2 rounded-md bg-portal-surface-hover text-portal-text-muted font-mono text-[10px]">
              {items.length}
            </span>
          </button>
        </div>

        {/* Vehicles List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-10 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-portal-primary mx-auto animate-spin" />
              <p className="text-xs text-portal-text-muted">
                Loading live trading floor...
              </p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Gavel className="w-8 h-8 text-portal-text-muted mx-auto opacity-50" />
              <p className="text-xs text-portal-text-muted">
                {activeTab === "BIDS"
                  ? "You have no active bids placed on live auctions yet."
                  : "No auctions currently active."}
              </p>
              {activeTab === "BIDS" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("ALL")}
                  className="text-xs text-portal-primary hover:underline font-semibold cursor-pointer"
                >
                  Browse all live auctions
                </button>
              )}
            </div>
          ) : (
            displayedItems.map((car) => {
              const isCurrent = car.id === currentAuctionId;
              const hasBid = Boolean(
                car.myCurrentBidCents && car.myCurrentBidCents > 0
              );

              return (
                <div
                  key={car.id}
                  onClick={() => handleSelect(car)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    isCurrent
                      ? "bg-portal-primary/5 border-portal-primary/50 shadow-2xs"
                      : "bg-portal-surface hover:bg-portal-surface-hover border-portal-border hover:border-portal-border-subtle"
                  }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-portal-border bg-portal-surface-hover">
                      <Image
                        src={car.thumbnailUrl || car.photos[0] || ""}
                        alt={`${car.year} ${car.make}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-portal-text truncate">
                          {car.year} {car.make} {car.model}
                        </h4>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-portal-primary/10 text-portal-primary border border-portal-primary/20 shrink-0">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-portal-text-muted flex flex-wrap items-center gap-1.5">
                        <span className="font-mono">
                          {car.mileageKm.toLocaleString()} km
                        </span>
                        <span>•</span>
                        <span>
                          {car.city}, {car.province}
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          Grade {car.damageGrade}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Bidding Status & Switch CTA */}
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="space-y-0.5">
                      {hasBid ? (
                        <>
                          <div className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCadCents(car.myCurrentBidCents!)}
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] text-portal-text-muted font-mono flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-portal-primary" />
                              Active Sealed Bid
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-mono text-xs font-semibold text-portal-text-muted">
                            Floor Open
                          </div>
                          <div className="text-[10px] text-portal-text-muted font-mono">
                            {car.totalBidsPlaced}{" "}
                            {car.totalBidsPlaced === 1 ? "bid" : "bids"} placed
                          </div>
                        </>
                      )}
                    </div>

                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-portal-text-muted group-hover:text-portal-text group-hover:bg-portal-surface transition-colors">
                      {isCurrent ? (
                        <CheckCircle2 className="w-4 h-4 text-portal-primary" />
                      ) : (
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-portal-border flex items-center justify-between text-xs">
          <Link
            href="/dealer/active-bids"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 font-medium text-portal-text-muted hover:text-portal-primary transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>All Active Bids Tracker</span>
          </Link>
          <Link
            href="/dealer/inventory"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 font-semibold text-portal-primary hover:underline"
          >
            <span>Trading Floor Feed</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
