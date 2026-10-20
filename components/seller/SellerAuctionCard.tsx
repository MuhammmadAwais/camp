"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  Car,
  CheckCircle,
} from "@phosphor-icons/react";
import type { SellerAuctionItem } from "@/lib/types/seller";
import { cn, formatCadCents } from "@/lib/utils";

// Exact Automaker Logo Mapping to local assets in public/car-company-logos
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

interface Props {
  auction: SellerAuctionItem;
  layout?: "grid" | "list";
}

export function SellerAuctionCard({ auction, layout = "grid" }: Props) {
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

  // Telemetry configuration for the frosted top-left badge
  const badgeConfig = React.useMemo(() => {
    switch (auction.status) {
      case "ACTIVE":
        return {
          text: `Live 24h • ${auction.bidCount} ${auction.bidCount === 1 ? "Bid" : "Bids"}`,
          beaconColor: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
          chipClass: "bg-[#16271E] text-emerald-400 border-emerald-500/25",
          chipText: isClient && timeLeft ? `${timeLeft.hours}h ${timeLeft.minutes}m left` : "24h Floor",
        };
      case "COMPLETED":
        return {
          text: `Sold & Finalized • ${auction.bidCount} Bids`,
          beaconColor: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
          chipClass: "bg-[#16271E] text-emerald-400 border-emerald-500/25",
          chipText: "Settled",
        };
      case "PENDING_MODERATION":
        return {
          text: "Appraisal Review • AutoNexa",
          beaconColor: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
          chipClass: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/25",
          chipText: "Review in progress",
        };
      default:
        return {
          text: `Draft • ${auction.bidCount} Bids`,
          beaconColor: "bg-gray-400",
          chipClass: "bg-gray-500/10 text-gray-400 border-gray-500/20",
          chipText: "Draft Listing",
        };
    }
  }, [auction.status, auction.bidCount, isClient, timeLeft]);

  // Signature Notched Card (Exact Geometry Matching Image 2 & 4Runner Reference)
  if (layout === "grid") {
    // Automaker brand marque initial / monogram or authentic logo
    const brandMonogram = auction.make.slice(0, 2).toUpperCase();
    const brandLogo = CAR_BRAND_LOGOS[auction.make.toLowerCase()];

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
          {/* Left Marque / Brand Icon (Direct Icon without background bubble or border) */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              {brandLogo ? (
                <div className="relative w-7 h-7">
                  <Image
                    src={brandLogo}
                    alt={auction.make}
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

            {/* Headline (Make/Model) & Subhead (Trim / Province) */}
            <div className="min-w-0">
              <h3 className="font-headline text-[15px] sm:text-base font-bold text-gray-900 dark:text-white tracking-tight truncate group-hover:text-[#8C383E] dark:group-hover:text-[#E59344] transition-colors leading-snug">
                {auction.year} {auction.make} {auction.model}
              </h3>
              <p className="font-body text-[11px] text-gray-500 dark:text-neutral-400 truncate mt-0.5 font-normal">
                {auction.trim ? `${auction.trim} • ` : ""}{auction.city}, {auction.province}
              </p>
            </div>
          </div>

          {/* Right Status Beacon / Telemetry Pill (Replacing Image 1 Floating Badge) */}
          <div className="shrink-0">
            {auction.status === "ACTIVE" ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                <span className="font-mono text-[11px] font-bold tracking-tight">
                  {auction.bidCount} {auction.bidCount === 1 ? "Bid" : "Bids"}
                </span>
              </div>
            ) : auction.status === "COMPLETED" ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.08] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-neutral-300">
                <CheckCircle weight="fill" className="w-3 h-3 text-emerald-500" />
                <span className="font-mono text-[11px] font-semibold">Sold</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                <Clock weight="bold" className="w-3 h-3" />
                <span className="font-mono text-[11px] font-semibold">Review</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Vehicle Photo Canvas (Clean, Unencumbered, Taller Proportion) */}
        <div className="relative h-60 sm:h-64 w-full rounded-[24px] overflow-hidden bg-neutral-100 dark:bg-white/[0.04] shrink-0">
          {auction.thumbnailUrl ? (
            <Image
              src={auction.thumbnailUrl}
              alt={`${auction.year} ${auction.make} ${auction.model}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-portal-text-muted gap-2">
              <Car className="w-10 h-10 opacity-30" weight="duotone" />
              <span className="text-xs font-mono">No imagery</span>
            </div>
          )}
        </div>

        {/* 3. Card Content Body */}
        <div className="pt-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Specs & Location Rows */}
            <div className="space-y-1.5 text-xs font-body">
              {/* Line 1: Specs */}
              <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-neutral-200 whitespace-nowrap overflow-hidden">
                <span>{auction.mileageKm.toLocaleString()} km</span>
                <span className="text-gray-300 dark:text-white/20 font-normal">•</span>
                <span>Automatic</span>
                <span className="text-gray-300 dark:text-white/20 font-normal">•</span>
                <span>Gasoline</span>
              </div>

              {/* Line 2: Dealer Location & VIN with Carfax badge */}
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-neutral-400 truncate">
                <span className="opacity-70">VIN:</span>
                <span className="font-mono font-semibold text-gray-700 dark:text-neutral-300">
                  ···{auction.vin.slice(-6)}
                </span>
                <span className="text-gray-300 dark:text-white/20 font-normal">•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-body inline-flex items-center gap-0.5">
                  <CheckCircle weight="bold" className="w-3 h-3 shrink-0" />
                  Verified Carfax
                </span>
              </div>
            </div>

            {/* Divider Line */}
            <div className="border-t border-gray-100 dark:border-white/10 my-3" />
          </div>

          {/* Bottom Pricing & Status Pill */}
          <div className="pt-1 flex items-end justify-between min-h-[58px]">
            <div className="flex flex-col justify-end max-w-[calc(100%-78px)] pr-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {/* Large Bold Price */}
                <span className="font-headline text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
                  {formatCadCents(auction.reservePriceCents)}
                </span>

                {/* Sleek Institutional Status Chip */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border font-mono text-[10px] sm:text-[10.5px] font-bold tracking-tight shadow-2xs whitespace-nowrap",
                    badgeConfig.chipClass
                  )}
                >
                  <ArrowUpRight weight="bold" className="w-3 h-3 shrink-0" />
                  <span>{badgeConfig.chipText}</span>
                </span>
              </div>

              {/* Sub-label */}
              <div className="text-[10.5px] sm:text-[11px] font-body text-gray-500 dark:text-neutral-400 flex items-center gap-1 flex-wrap">
                <span className="opacity-75">Reserve asking:</span>
                <span className="font-mono text-gray-400 dark:text-neutral-500 font-medium">CAD</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Docked Concave Corner Notch & Action Squircle Button (Exact Landing Page DiscoverSection Geometry) */}
        <div className="absolute -bottom-[1px] -right-[1px] z-20 pointer-events-auto">
          <div className="relative w-[78px] h-[78px] bg-white dark:bg-[#121212] rounded-tl-[26px] border-t border-l border-gray-200/90 dark:border-white/10 flex items-center justify-center">
            {/* Top Concave Fillet Curve (Smooth transition from card right edge into notch with border) */}
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

            {/* Left Concave Fillet Curve (Smooth transition from card bottom edge into notch with border) */}
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

            {/* Docked Action Button Floating with Uniform Cushion inside Pocket */}
            <Link
              href={`/seller/listings/${auction.id}`}
              className="w-[52px] h-[52px] rounded-[18px] bg-white dark:bg-[#202020] shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(140,56,62,0.25)] dark:hover:shadow-[0_8px_24px_rgba(229,147,68,0.25)] flex items-center justify-center text-gray-900 dark:text-white hover:text-white hover:bg-[#8C383E] dark:hover:bg-[#E59344] dark:hover:text-[#121212] transition-all duration-200 cursor-pointer active:scale-95 group/btn border border-gray-200/90 dark:border-white/15"
              aria-label={`View auction for ${auction.year} ${auction.make} ${auction.model}`}
              title="View live auction floor"
            >
              <ArrowUpRight
                weight="bold"
                className="w-5 h-5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
              />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Horizontal List Layout
  return (
    <div className="group relative bg-white dark:bg-[#121114] rounded-[28px] p-4 sm:p-5 transition-all duration-300 flex flex-col md:flex-row gap-5 border border-gray-200 dark:border-white/10 hover:border-[#8C383E]/50 dark:hover:border-[#E59344]/50 shadow-sm hover:shadow-md">
      {/* Thumbnail Area */}
      <div className="relative w-full md:w-72 h-48 md:h-auto rounded-[20px] overflow-hidden bg-neutral-100 dark:bg-white/[0.04] shrink-0">
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
            <Car className="w-10 h-10 opacity-30" weight="duotone" />
            <span className="text-xs font-mono">No imagery</span>
          </div>
        )}

        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/65 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-semibold border border-white/15">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", badgeConfig.beaconColor)} />
          <span>{badgeConfig.text}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h3 className="font-headline text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-[#8C383E] dark:group-hover:text-[#E59344] transition-colors">
                {auction.year} {auction.make} {auction.model}
              </h3>
              {auction.trim && (
                <p className="font-body text-xs text-gray-500 dark:text-neutral-400 mt-0.5">{auction.trim}</p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <span className="block font-body text-[10px] uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Reserve Asking
              </span>
              <span className="font-headline text-xl font-bold text-gray-900 dark:text-white">
                {formatCadCents(auction.reservePriceCents)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-gray-600 dark:text-neutral-400">
            <span className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10">
              {auction.mileageKm.toLocaleString()} km
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10">
              VIN ···{auction.vin.slice(-6)}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10">
              {auction.city}, {auction.province}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border font-mono text-xs font-bold",
                badgeConfig.chipClass
              )}
            >
              <ArrowUpRight weight="bold" className="w-3.5 h-3.5 shrink-0" />
              <span>{badgeConfig.chipText}</span>
            </span>
          </div>

          <Link
            href={`/seller/listings/${auction.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8C383E] dark:bg-[#E59344] hover:bg-[#752B30] dark:hover:bg-[#D9822F] text-white text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
