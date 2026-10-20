"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CarFront, Clock, Eye, Lock, ShieldCheck } from "lucide-react";
import type { SellerAuctionItem } from "@/lib/types/seller";
import { cn, formatCadCents } from "@/lib/utils";

interface Props {
  auction: SellerAuctionItem;
}

export function SellerAuctionCard({ auction }: Props) {
  const [timeLeft, setTimeLeft] = React.useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    if (!auction.auctionEndsAt || auction.status !== "ACTIVE") return;

    const calculateRemaining = () => {
      const diff = new Date(auction.auctionEndsAt!).getTime() - Date.now();
      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateRemaining());
    const interval = setInterval(() => {
      setTimeLeft(calculateRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [auction.auctionEndsAt, auction.status]);

  const statusConfig = {
    ACTIVE: {
      label: "Live 24h Auction",
      badgeClass: "bg-[#E59344]/10 text-[#E59344] border-[#E59344]/30",
      dotClass: "bg-[#E59344] animate-pulse",
    },
    PENDING_MODERATION: {
      label: "Appraisal Review",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
      dotClass: "bg-amber-500",
    },
    COMPLETED: {
      label: "Sold & Finalized",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-500",
    },
    DRAFT: {
      label: "Draft Listing",
      badgeClass: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      dotClass: "bg-gray-400",
    },
    UNSEALED: {
      label: "Auction Unsealed",
      badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      dotClass: "bg-blue-500",
    },
    ACCEPTED: {
      label: "Bid Accepted",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-500",
    },
    CANCELLED: {
      label: "Cancelled",
      badgeClass: "bg-red-500/10 text-red-500 border-red-500/30",
      dotClass: "bg-red-500",
    },
  }[auction.status];

  return (
    <article className="group relative rounded-2xl border border-portal-border bg-portal-surface overflow-hidden transition-all duration-200 hover:border-[#8C383E]/40 dark:hover:border-[#E59344]/40 hover:shadow-md flex flex-col md:flex-row">
      {/* Thumbnail Area */}
      <div className="relative w-full md:w-64 lg:w-72 h-48 md:h-auto shrink-0 bg-portal-surface-hover overflow-hidden">
        {auction.thumbnailUrl ? (
          <Image
            src={auction.thumbnailUrl}
            alt={`${auction.year} ${auction.make} ${auction.model}`}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-portal-text-muted gap-2">
            <CarFront className="w-10 h-10 opacity-40" />
            <span className="text-xs font-mono">No imagery uploaded</span>
          </div>
        )}

        {/* Gradient Overlay for photo contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-xs",
              statusConfig.badgeClass
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotClass)} />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
        <div>
          {/* Header Row: Title & Reserve Price */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h3 className="font-headline text-lg sm:text-xl font-bold tracking-tight text-portal-text group-hover:text-[#8C383E] dark:group-hover:text-[#E59344] transition-colors">
                {auction.year} {auction.make} {auction.model}
              </h3>
              {auction.trim && (
                <p className="font-body text-xs sm:text-sm text-portal-text-muted mt-0.5">{auction.trim}</p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <span className="block font-body text-[11px] uppercase tracking-wider text-portal-text-muted">
                Reserve Asking
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-portal-text">
                {formatCadCents(auction.reservePriceCents)}
              </span>
            </div>
          </div>

          {/* Vehicle Metadata Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-portal-text-muted">
            <span className="px-2 py-0.5 rounded-md bg-portal-surface-hover border border-portal-border">
              {auction.mileageKm.toLocaleString()} km
            </span>
            <span className="px-2 py-0.5 rounded-md bg-portal-surface-hover border border-portal-border">
              VIN ···{auction.vin.slice(-6)}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-portal-surface-hover border border-portal-border">
              {auction.city}, {auction.province}
            </span>
          </div>
        </div>

        {/* Telemetry Bar: Live 24h Clock & Sealed Bid Pill */}
        <div className="mt-5 pt-4 border-t border-portal-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* 24-Hour Sealed Auction Countdown */}
            {auction.status === "ACTIVE" && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8C383E] dark:text-[#E59344] shrink-0" aria-hidden />
                <span className="font-body text-xs text-portal-text-muted">Closes in:</span>
                <span className="font-mono text-xs sm:text-sm font-bold text-portal-text tracking-wider tabular-nums">
                  {isClient && timeLeft
                    ? `${String(timeLeft.hours).padStart(2, "0")}h ${String(timeLeft.minutes).padStart(2, "0")}m ${String(timeLeft.seconds).padStart(2, "0")}s`
                    : "17h 42m 00s"}
                </span>
              </div>
            )}

            {/* Sealed Bid Count (Strict Invariant: zero dollars exposed) */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#8C383E]/10 dark:bg-[#E59344]/15 border border-[#8C383E]/20 dark:border-[#E59344]/30">
              <Lock className="w-3.5 h-3.5 text-[#8C383E] dark:text-[#E59344]" aria-hidden />
              <span className="font-mono text-xs font-semibold text-[#8C383E] dark:text-[#E59344]">
                {auction.bidCount} {auction.bidCount === 1 ? "Sealed Dealer Bid" : "Sealed Dealer Bids"}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <Link
              href={`/seller/listings/${auction.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-portal-surface-hover hover:bg-[#8C383E]/10 dark:hover:bg-[#E59344]/15 border border-portal-border hover:border-[#8C383E]/30 dark:hover:border-[#E59344]/30 text-portal-text text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <span>{auction.status === "ACTIVE" ? "Live Floor" : "View Details"}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-portal-text-muted group-hover:text-[#8C383E] dark:group-hover:text-[#E59344]" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
