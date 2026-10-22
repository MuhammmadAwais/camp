"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Car,
  CheckCircle2,
  Gavel,
  ArrowRight,
  MapPin,
  Lock,
} from "lucide-react";
import type { WholesaleAuctionItem } from "@/lib/types/dealer";
import { cn, formatCadCents } from "@/lib/utils";

// Automaker Brand Logo Mapping to local assets in public/car-company-logos
const CAR_BRAND_LOGOS: Record<string, string> = {
  toyota: "/car-company-logos/image_16 - Copy.png",
  jeep: "/car-company-logos/image_15.png",
  ford: "/car-company-logos/image_14.svg",
  honda: "/car-company-logos/image_12.png",
  polestar: "/car-company-logos/image_11.png",
  mitsubishi: "/car-company-logos/image_10.png",
  hyundai: "/car-company-logos/image_09.png",
  cadillac: "/car-company-logos/image_13.png",
};

interface DealerAuctionCardProps {
  item: WholesaleAuctionItem;
  onOpenBid: (item: WholesaleAuctionItem) => void;
}

export function DealerAuctionCard({ item, onOpenBid }: DealerAuctionCardProps) {
  const [timeLeft, setTimeLeft] = React.useState<{ hours: number; minutes: number } | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    if (!item.auctionEndsAt) return;

    const calculateRemaining = () => {
      const diff = new Date(item.auctionEndsAt).getTime() - Date.now();
      if (diff <= 0) {
        return { hours: 0, minutes: 0 };
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return { hours, minutes };
    };

    setTimeLeft(calculateRemaining());
    const interval = setInterval(() => {
      setTimeLeft(calculateRemaining());
    }, 60000);

    return () => clearInterval(interval);
  }, [item.auctionEndsAt]);

  const msLeft = Math.max(0, new Date(item.auctionEndsAt).getTime() - Date.now());
  const isUrgent = msLeft > 0 && msLeft < 15 * 60 * 1000;

  const brandMonogram = item.make.slice(0, 2).toUpperCase();
  const brandLogo = CAR_BRAND_LOGOS[item.make.toLowerCase()];

  return (
    <div className="group relative bg-white dark:bg-[#1E1E1E] rounded-tl-[32px] rounded-tr-[32px] rounded-bl-[32px] rounded-br-none p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between border border-gray-200/90 dark:border-white/10 hover:-translate-y-1">
      {/* Smooth Masked Shadow Layer: Excises bottom-right corner for clean notch transparency */}
      <div
        className="absolute inset-0 rounded-tl-[32px] rounded-tr-[32px] rounded-bl-[32px] rounded-br-none pointer-events-none -z-10 shadow-[0_4px_20px_rgba(0,0,0,0.05)] group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] transition-shadow duration-300"
        style={{
          maskImage: "radial-gradient(circle at bottom right, transparent 0, transparent 90px, black 125px)",
          WebkitMaskImage: "radial-gradient(circle at bottom right, transparent 0, transparent 90px, black 125px)",
        }}
      />

      {/* 1. Top Header Row Above Photo Canvas */}
      <div className="flex items-center justify-between gap-3 pb-3">
        {/* Left Marque / Brand Icon & Vehicle Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            {brandLogo ? (
              <div className="relative w-7 h-7">
                <Image
                  src={brandLogo}
                  alt={item.make}
                  fill
                  className="object-contain dark:brightness-0 dark:invert"
                />
              </div>
            ) : (
              <span className="font-headline font-black text-sm tracking-wider text-gray-800 dark:text-neutral-200">
                {brandMonogram}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-headline text-[15px] sm:text-base font-bold text-gray-900 dark:text-white tracking-tight truncate group-hover:text-portal-primary transition-colors leading-snug">
              {item.year} {item.make} {item.model}
            </h3>
            <p className="font-body text-[11px] text-gray-500 dark:text-neutral-400 truncate mt-0.5 font-normal">
              {item.trim ? `${item.trim} • ` : ""}{item.city}, {item.province}
            </p>
          </div>
        </div>

        {/* Right Status Beacon / Urgency Pill */}
        <div className="shrink-0 flex items-center gap-1.5">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-tight border",
              isUrgent
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse"
                : "bg-neutral-100 dark:bg-white/[0.08] text-gray-800 dark:text-neutral-200 border-gray-200 dark:border-white/10"
            )}
          >
            <Clock className={cn("w-3 h-3", isUrgent ? "text-red-500" : "text-portal-primary")} />
            <span>
              {isClient && timeLeft ? `${timeLeft.hours}h ${timeLeft.minutes}m left` : "Floor Open"}
            </span>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.08] text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-white/10 text-[11px] font-mono">
            <Lock className="w-2.5 h-2.5 text-portal-text-muted" />
            <span>{item.totalBidsPlaced} bids</span>
          </div>
        </div>
      </div>

      {/* 2. Vehicle Photo Canvas (Clean & Tall, links to Inspection) */}
      <Link
        href={`/dealer/auctions/${item.id}`}
        className="relative h-56 sm:h-60 w-full rounded-[24px] overflow-hidden bg-neutral-100 dark:bg-white/[0.04] shrink-0 block cursor-pointer"
        aria-label={`View details for ${item.year} ${item.make} ${item.model}`}
      >
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={`${item.year} ${item.make} ${item.model}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-portal-text-muted gap-2">
            <Car className="w-10 h-10 opacity-30" />
            <span className="text-xs font-mono">No imagery</span>
          </div>
        )}
      </Link>

      {/* 3. Card Content Body */}
      <div className="pt-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Key Specs Row */}
          <div className="space-y-1.5 text-xs font-body">
            <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-neutral-200 whitespace-nowrap overflow-hidden">
              <span>{item.mileageKm.toLocaleString()} km</span>
              <span className="text-gray-300 dark:text-white/20 font-normal">•</span>
              <span>{item.transmission || "Automatic"}</span>
              <span className="text-gray-300 dark:text-white/20 font-normal">•</span>
              <span>{item.drivetrain || "AWD"}</span>
            </div>

            {/* VIN & Carfax Status */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-neutral-400 truncate">
              <span className="opacity-70">VIN:</span>
              <span className="font-mono font-semibold text-gray-700 dark:text-neutral-300">
                ···{item.vin.slice(-6)}
              </span>
              <span className="text-gray-300 dark:text-white/20 font-normal">•</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                Verified Carfax
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-white/10 my-3" />
        </div>

        {/* Bottom Bid Telemetry & Direct Actions */}
        <div className="pt-1 flex items-end justify-between min-h-[58px]">
          <div className="flex flex-col justify-end max-w-[calc(100%-84px)] pr-2">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {item.myCurrentBidCents ? (
                <>
                  <span className="font-headline text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
                    {formatCadCents(item.myCurrentBidCents)}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-[10px] font-bold bg-portal-primary/10 text-portal-primary border-portal-primary/25 whitespace-nowrap">
                    Active Bid
                  </span>
                </>
              ) : (
                <>
                  <span className="font-headline text-base sm:text-lg font-bold text-gray-500 dark:text-neutral-400 tracking-tight whitespace-nowrap">
                    No Bid Placed
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold bg-neutral-100 dark:bg-white/[0.08] text-gray-600 dark:text-neutral-300 border-gray-200 dark:border-white/10 whitespace-nowrap">
                    Floor Open
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <Link
                href={`/dealer/auctions/${item.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-portal-text-muted hover:text-portal-primary transition-colors group/inspect"
              >
                <span>Inspect details</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover/inspect:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Docked Concave Corner Notch & Sealed Bid Action Squircle Button */}
      <div className="absolute -bottom-[1px] -right-[1px] z-20 pointer-events-auto">
        <div className="relative w-[78px] h-[78px] bg-white dark:bg-[#121212] rounded-tl-[26px] border-t border-l border-gray-200/90 dark:border-white/10 flex items-center justify-center">
          {/* Top Concave Fillet Curve */}
          <svg
            viewBox="0 0 20 20"
            className="w-5 h-5 absolute -top-5 right-0 pointer-events-none overflow-visible"
          >
            <path
              d="M 20,0 A 20 20 0 0 1 0,20 L 20,20 Z"
              className="fill-white dark:fill-[#121212]"
            />
            <path
              d="M 20,0 A 20 20 0 0 1 0,20"
              fill="none"
              stroke="currentColor"
              className="text-gray-200/90 dark:text-white/10"
              strokeWidth="1"
            />
          </svg>

          {/* Left Concave Fillet Curve */}
          <svg
            viewBox="0 0 20 20"
            className="w-5 h-5 absolute bottom-0 -left-5 pointer-events-none overflow-visible"
          >
            <path
              d="M 0,20 A 20 20 0 0 0 20,0 L 20,20 Z"
              className="fill-white dark:fill-[#121212]"
            />
            <path
              d="M 0,20 A 20 20 0 0 0 20,0"
              fill="none"
              stroke="currentColor"
              className="text-gray-200/90 dark:text-white/10"
              strokeWidth="1"
            />
          </svg>

          {/* Docked Action Button: Launches Sealed Bid Slip Modal */}
          <button
            type="button"
            onClick={() => onOpenBid(item)}
            className="w-[52px] h-[52px] rounded-[18px] bg-[#8C383E] dark:bg-[#E59344] hover:bg-[#752B30] dark:hover:bg-[#D9822F] text-white shadow-[0_4px_14px_rgba(140,56,62,0.3)] dark:shadow-[0_4px_14px_rgba(229,147,68,0.3)] flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 group/btn"
            aria-label={item.myCurrentBidCents ? `Raise bid on ${item.model}` : `Place sealed bid on ${item.model}`}
            title={item.myCurrentBidCents ? "Raise Sealed Bid" : "Place Sealed Bid"}
          >
            <Gavel className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );
}
