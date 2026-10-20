"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Gavel,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  TrendingUp,
  Zap,
  RefreshCw,
  Award,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import type { ListingDetailData, UnsealedDealerBid } from "@/lib/types/seller";
import { apiClient } from "@/lib/api-client";

interface DealerSelectionViewProps {
  listingId: string;
}

export function DealerSelectionView({ listingId }: DealerSelectionViewProps) {
  const router = useRouter();
  const [data, setData] = useState<ListingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "distance">("price");
  const [selectedBid, setSelectedBid] = useState<UnsealedDealerBid | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.api.get<ListingDetailData>(`/api/listings/${listingId}?status=UNSEALED`);
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || "Failed to load unsealed dealer bids");
        }
      } catch {
        setError("Unable to connect to server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBids();
  }, [listingId]);

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-portal-primary animate-spin" />
          <p className="text-sm font-medium text-portal-text-muted">Unsealing certified dealership bids...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-portal-text">Bids Not Available</h3>
        <p className="text-sm text-portal-text-muted">{error || "Could not load dealer bids."}</p>
        <Link href={`/seller/listings/${listingId}`} className="text-xs text-portal-primary hover:underline font-semibold">
          Return to Auction Floor
        </Link>
      </div>
    );
  }

  const { auction, unsealedBids = [] } = data;

  // Sort bids
  const sortedBids = [...unsealedBids].sort((a, b) => {
    if (sortBy === "price") return b.bidAmountCents - a.bidAmountCents;
    return a.distanceKm - b.distanceKm;
  });

  const highestBid = unsealedBids.reduce((max, b) => (b.bidAmountCents > max ? b.bidAmountCents : max), 0);
  const surplusAboveReserveCents = Math.max(0, highestBid - auction.reservePriceCents);

  // Handle final offer acceptance
  const handleConfirmAccept = async () => {
    if (!selectedBid) return;
    setIsAccepting(true);

    try {
      const res = await apiClient.api.post(`/api/listings/${listingId}`, {
        bidId: selectedBid.id,
      });

      if (res.success) {
        router.push(`/seller/listings/${listingId}/appointment`);
      } else {
        alert(res.error || "Failed to accept bid");
      }
    } catch {
      alert("Error processing dealership acceptance");
    } finally {
      setIsAccepting(false);
      setConfirmModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Back Link & Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/seller/listings/${listingId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-portal-text-muted hover:text-portal-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Auction Floor</span>
        </Link>
      </div>

      {/* Outcome Header Banner */}
      <div className="bg-portal-surface border border-portal-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>24-Hour Auction Concluded</span>
              </span>
              <span className="text-xs font-mono text-portal-text-muted">
                {unsealedBids.length} Certified Bids Unsealed
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-headline text-portal-text">
              Select Winning Dealership Offer
            </h1>
            <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
              Review and select your preferred buyer for the {auction.year} {auction.make} {auction.model}.
              You have 24 hours to lock in your accepted offer.
            </p>
          </div>

          {/* Highest Offer Highlight */}
          <div className="text-left sm:text-right bg-portal-surface-hover/70 p-4 rounded-xl border border-portal-border shrink-0">
            <span className="block text-[11px] font-semibold text-portal-text-muted uppercase tracking-wider">
              Top Unsealed Dealer Offer
            </span>
            <span className="font-mono text-2xl font-black text-portal-primary block">
              {formatCadCents(highestBid)}
            </span>
            {surplusAboveReserveCents > 0 && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center sm:justify-end gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>+{formatCadCents(surplusAboveReserveCents)} above reserve</span>
              </span>
            )}
          </div>
        </div>

        {/* Filter / Sort Switcher */}
        <div className="pt-2 flex items-center justify-between border-t border-portal-border">
          <span className="text-xs text-portal-text-muted font-medium">Ranked Dealer Offers</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-portal-text-muted">Sort by:</span>
            <div className="inline-flex rounded-lg bg-portal-surface-hover border border-portal-border p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSortBy("price")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  sortBy === "price"
                    ? "bg-portal-primary text-white shadow-xs"
                    : "text-portal-text-muted hover:text-portal-text"
                }`}
              >
                Highest Bid
              </button>
              <button
                type="button"
                onClick={() => setSortBy("distance")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  sortBy === "distance"
                    ? "bg-portal-primary text-white shadow-xs"
                    : "text-portal-text-muted hover:text-portal-text"
                }`}
              >
                Nearest Dealership
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ranked Bids Ladder */}
      <div className="space-y-3.5">
        {sortedBids.map((bid, index) => {
          const isHighest = bid.bidAmountCents === highestBid;

          return (
            <div
              key={bid.id}
              className={`bg-portal-surface border rounded-2xl p-5 sm:p-6 transition-all hover:border-portal-primary/50 shadow-xs relative ${
                isHighest
                  ? "border-portal-primary/60 ring-1 ring-portal-primary/20"
                  : "border-portal-border"
              }`}
            >
              {isHighest && (
                <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-portal-primary text-white text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>Top Certified Offer</span>
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Dealer Information */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-portal-surface-hover border border-portal-border flex items-center justify-center font-mono text-xs font-bold text-portal-text">
                      #{index + 1}
                    </span>
                    <h3 className="text-base font-bold text-portal-text">
                      {bid.dealershipName}
                    </h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-portal-surface-hover border border-portal-border text-portal-text-muted">
                      {bid.omvicNumber}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-portal-text-muted">
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{bid.rating.toFixed(1)}</span>
                      <span className="text-portal-text-muted font-normal">({bid.reviewCount} reviews)</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-portal-primary" />
                      <span>{bid.city}, {bid.province} ({bid.distanceKm} km away)</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{bid.payoutSpeedDays}-Day Direct Wire</span>
                    </span>
                  </div>
                </div>

                {/* Right: Dollar Amount & Acceptance Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:text-right">
                  <div>
                    <span className="font-mono text-2xl font-black text-portal-text block">
                      {formatCadCents(bid.bidAmountCents)}
                    </span>
                    <span className="text-[11px] text-portal-text-muted">
                      {bid.bidAmountCents >= auction.reservePriceCents
                        ? "Meets Reserve Floor"
                        : "Below Reserve Asking"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBid(bid);
                      setConfirmModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-portal-primary hover:bg-portal-primary-hover shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    Accept Offer & Lock Dealer
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && selectedBid && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-portal-surface border border-portal-border rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-portal-primary/10 text-portal-primary flex items-center justify-center mx-auto">
              <Gavel className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold font-headline text-portal-text">
                Accept Dealership Offer?
              </h3>
              <p className="text-xs text-portal-text-muted">
                You are accepting the legally binding offer from {selectedBid.dealershipName}.
              </p>
            </div>

            <div className="bg-portal-surface-hover border border-portal-border rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-portal-text-muted">Purchase Price:</span>
                <span className="font-mono font-bold text-portal-text text-sm">
                  {formatCadCents(selectedBid.bidAmountCents)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-portal-text-muted">Buyer Dealership:</span>
                <span className="font-medium text-portal-text">{selectedBid.dealershipName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-portal-text-muted">Location:</span>
                <span>{selectedBid.city}, {selectedBid.province}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-portal-text-muted">Escrow Settlement:</span>
                <span className="text-emerald-600 font-semibold">{selectedBid.payoutSpeedDays}-Day Direct Wire</span>
              </div>
            </div>

            <div className="text-[11px] text-portal-text-muted text-left">
              Upon acceptance, your official Dealership Handover Voucher will be generated with full directions, contact info, and required documentation.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={isAccepting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium border border-portal-border hover:bg-portal-surface-hover text-portal-text-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-accept-bid"
                onClick={handleConfirmAccept}
                disabled={isAccepting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-portal-primary hover:bg-portal-primary-hover shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAccepting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Locking...</span>
                  </>
                ) : (
                  <span>Confirm & Generate Voucher</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
