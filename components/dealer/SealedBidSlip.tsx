"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Gavel,
  Lock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  TrendingUp,
  RefreshCw,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatCadCents } from "@/lib/utils";
import type { WholesaleAuctionItem } from "@/lib/types/dealer";
import { apiClient } from "@/lib/api-client";

interface SealedBidSlipProps {
  auction: WholesaleAuctionItem | null;
  onClose: () => void;
  onBidSuccess: (auctionId: string, amountCents: number) => void;
}

export function SealedBidSlip({
  auction,
  onClose,
  onBidSuccess,
}: SealedBidSlipProps) {
  if (!auction) return null;

  const minBidCents = auction.myCurrentBidCents
    ? auction.myCurrentBidCents + 25000 // Must be at least $250 higher
    : 1500000; // $15,000 default min floor

  const initialDollars = Math.round(minBidCents / 100);
  const [displayAmount, setDisplayAmount] = useState(
    initialDollars.toLocaleString("en-CA")
  );
  const [bidCents, setBidCents] = useState(minBidCents);
  const [declaration, setDeclaration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle manual input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setDisplayAmount("");
      setBidCents(0);
      return;
    }

    const dollars = parseInt(rawVal, 10);
    setDisplayAmount(dollars.toLocaleString("en-CA"));
    setBidCents(dollars * 100);
  };

  // Quick increment chips
  const addIncrement = (incrementCents: number) => {
    const nextCents = Math.max(minBidCents, bidCents + incrementCents);
    setBidCents(nextCents);
    setDisplayAmount(Math.round(nextCents / 100).toLocaleString("en-CA"));
  };

  // Submit Bid
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (bidCents < minBidCents) {
      setErrorMsg(
        `Bid must be at least ${formatCadCents(minBidCents)} CAD (higher than current or minimum floor).`
      );
      return;
    }

    if (!declaration) {
      setErrorMsg("Please accept the legally binding dealer purchase declaration.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiClient.api.post("/api/dealer/bid", {
        auctionId: auction.id,
        bidAmountCents: bidCents,
        certifiedDeclaration: true,
      });

      if (res.success) {
        onBidSuccess(auction.id, bidCents);
        onClose();
      } else {
        setErrorMsg(res.error || "Failed to submit sealed bid");
      }
    } catch {
      setErrorMsg("Network error submitting bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-portal-surface border border-portal-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-portal-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-portal-primary/10 text-portal-primary flex items-center justify-center">
              <Gavel className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-headline text-portal-text">
                Place Sealed Wholesale Bid
              </h3>
              <span className="text-[10px] text-portal-text-muted font-mono block">
                Confidential Dealer Floor Slip
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vehicle Mini Dossier */}
        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-portal-surface-hover/70 border border-portal-border">
          <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-portal-border bg-portal-surface">
            <Image
              src={auction.thumbnailUrl}
              alt={auction.model}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <h4 className="font-bold text-portal-text truncate">
              {auction.year} {auction.make} {auction.model} {auction.trim}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-portal-text-muted font-mono">
              <span>{auction.mileageKm.toLocaleString()} km</span>
              <span>•</span>
              <span>VIN: ···{auction.vin.slice(-6)}</span>
              <span>•</span>
              <span className="text-portal-primary font-semibold">
                Grade {auction.damageGrade}
              </span>
            </div>
          </div>
        </div>

        {/* Existing Bid Notice (Upward Revision Rule) */}
        {auction.myCurrentBidCents && (
          <div className="p-3 rounded-xl bg-portal-primary/10 border border-portal-primary/25 text-xs text-portal-text flex items-center justify-between">
            <span className="text-portal-text-muted">Your Current Sealed Bid:</span>
            <span className="font-mono font-bold text-portal-primary">
              {formatCadCents(auction.myCurrentBidCents)}
            </span>
          </div>
        )}

        {/* Bid Input Engine */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-portal-text block">
              Sealed Purchase Bid Amount (CAD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold font-mono text-portal-text-muted">
                $
              </span>
              <input
                type="text"
                id="dealer-bid-input"
                inputMode="numeric"
                value={displayAmount}
                onChange={handleAmountChange}
                placeholder="35,000"
                className="w-full pl-9 pr-16 py-3.5 rounded-xl bg-portal-surface-hover border border-portal-border text-2xl font-black font-mono text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary transition-all shadow-inner"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-portal-text-muted uppercase">
                CAD
              </span>
            </div>

            {/* Quick Increment Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-portal-text-muted font-mono mr-1">Quick Add:</span>
              <button
                type="button"
                onClick={() => addIncrement(25000)}
                className="px-2.5 py-1 rounded-lg bg-portal-surface-hover hover:bg-portal-primary/10 hover:text-portal-primary border border-portal-border text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                +$250
              </button>
              <button
                type="button"
                onClick={() => addIncrement(50000)}
                className="px-2.5 py-1 rounded-lg bg-portal-surface-hover hover:bg-portal-primary/10 hover:text-portal-primary border border-portal-border text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                +$500
              </button>
              <button
                type="button"
                onClick={() => addIncrement(100000)}
                className="px-2.5 py-1 rounded-lg bg-portal-surface-hover hover:bg-portal-primary/10 hover:text-portal-primary border border-portal-border text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                +$1,000
              </button>
              <button
                type="button"
                onClick={() => addIncrement(250000)}
                className="px-2.5 py-1 rounded-lg bg-portal-surface-hover hover:bg-portal-primary/10 hover:text-portal-primary border border-portal-border text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                +$2,500
              </button>
            </div>
          </div>

          {/* Sealed Bid Privacy Note */}
          <div className="p-3 rounded-xl bg-portal-surface-hover border border-portal-border text-[11px] text-portal-text-muted flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-portal-primary shrink-0 mt-0.5" />
            <span>
              Your bid remains cryptographically sealed until the auction closes. Competing dealerships and the seller cannot view your offer amount.
            </span>
          </div>

          {/* Legal Commitment Declaration Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-portal-surface-hover/70 border border-portal-border hover:border-portal-primary/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              id="dealer-declaration-checkbox"
              checked={declaration}
              onChange={(e) => setDeclaration(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-portal-primary focus:ring-portal-primary border-portal-border accent-portal-primary cursor-pointer shrink-0"
            />
            <span className="text-[11px] text-portal-text leading-tight select-none">
              I certify under OMVIC/AMVIC dealership regulations that this is a firm, legally binding wholesale purchase commitment funded by verified dealership escrow.
            </span>
          </label>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-portal-surface-hover border border-error/30 rounded-xl flex items-center gap-2 text-xs text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium border border-portal-border hover:bg-portal-surface-hover text-portal-text-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-dealer-bid"
              disabled={isSubmitting || !declaration}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-portal-primary hover:bg-portal-primary-hover shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Sealed Bid...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm Sealed Bid ({formatCadCents(bidCents)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
