"use client";

import * as React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { VinAppraisalInput } from "@/components/marketing/VinAppraisalInput";
import { MediaTicker } from "@/components/marketing/MediaTicker";
import {
  ShieldCheck,
  Clock,
  TrendingUp,
  Award,
  CheckCircle,
  EyeOff,
} from "lucide-react";

export function HeroSection() {
  const [seconds, setSeconds] = React.useState(52702); // 14h 38m 22s

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 86400));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full overflow-hidden bg-surface pt-8 sm:pt-14 pb-0">
      {/* Subtle Warm Editorial Ambient Glow */}
      <div className="absolute top-0 right-1/4 -z-10 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 -z-10 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Core Value Proposition & Valuation Card */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* National Trust Pill */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-2 px-3 py-1">
                <span className="text-sm">🍁</span>
                <span>Canada&apos;s 100% Sealed-Bid Vehicle Exchange</span>
              </Badge>
            </div>

            {/* Display Headline in Epilogue */}
            <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface leading-[1.12]">
              Wholesale Dealer Bidding.{" "}
              <span className="text-primary underline decoration-secondary/40 decoration-wavy underline-offset-8">
                24 Hours.
              </span>{" "}
              Maximum Net Payout.
            </h1>

            {/* Body Copy in Plus Jakarta Sans */}
            <p className="font-body text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Eliminate lowball dealership trade-in appraisals and risky private
              message flakes. Private Canadian sellers receive upward-revisable,
              binding sealed bids directly from licensed automotive dealerships
              across Ontario, Alberta, BC, and Quebec.
            </p>

            {/* Instant VIN Appraisal Tool */}
            <div className="mt-2">
              <VinAppraisalInput />
            </div>

            {/* 3 Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-container-low/70 border border-border-card/60">
                <TrendingUp className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <div>
                  <div className="font-headline font-bold text-sm text-on-surface">
                    +$2,850 CAD Avg
                  </div>
                  <div className="font-body text-xs text-on-surface-variant">
                    Over dealer trade-in offers
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-container-low/70 border border-border-card/60">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-headline font-bold text-sm text-on-surface">
                    Strict 24h Window
                  </div>
                  <div className="font-body text-xs text-on-surface-variant">
                    Authoritative server-clock
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-container-low/70 border border-border-card/60">
                <EyeOff className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <div>
                  <div className="font-headline font-bold text-sm text-on-surface">
                    100% Sealed Bids
                  </div>
                  <div className="font-body text-xs text-on-surface-variant">
                    Zero collusion or snipe wars
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Showcase & Real-Time Telemetry Simulation */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Elevated Container Card */}
              <div className="relative bg-surface-container-lowest border border-border-card rounded-2xl overflow-hidden shadow-ambient-warm transition-transform hover:-translate-y-1 duration-300">
                {/* Vehicle Showcase Image */}
                <div className="relative h-64 sm:h-72 w-full bg-surface-container">
                  <Image
                    src="/showcase-cars-with-bg/2022-Ford-Bronco.webp"
                    alt="Featured Wholesale Auction Vehicle"
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Top Live Badge */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider">
                      <span className="h-2 w-2 rounded-full bg-brand-neon-crimson animate-ping" />
                      Live Auction
                    </span>
                  </div>

                  {/* Provincial Stamp */}
                  <div className="absolute top-3.5 right-3.5">
                    <span className="px-2.5 py-1 rounded-sm bg-surface-container-lowest/90 backdrop-blur-sm border border-border-card font-mono text-xs font-bold text-primary">
                      ON • OMVIC Verified
                    </span>
                  </div>

                  {/* Vehicle Label on Image */}
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <p className="font-mono text-xs uppercase tracking-wider text-secondary-fixed">
                      VIN: 1FMEE5DH8NLA09876
                    </p>
                    <h2 className="font-headline text-xl font-bold tracking-tight text-white drop-shadow">
                      2022 Ford Bronco Badlands 4x4
                    </h2>
                  </div>
                </div>

                {/* Auction Telemetry Bar (Autumn Editorial Styled) */}
                <div className="p-5 bg-surface-container-lowest space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* 24h Countdown */}
                    <div className="p-3 rounded-lg bg-surface-container-low border border-border-card">
                      <div className="flex items-center gap-1.5 text-on-surface-variant font-body text-xs font-medium mb-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Auction Closes In</span>
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-primary">
                        {formatCountdown(seconds)}
                      </div>
                    </div>

                    {/* Sealed Bid Counter (Invariant: NO live CAD amount shown) */}
                    <div className="p-3 rounded-lg bg-surface-container-low border border-border-card">
                      <div className="flex items-center gap-1.5 text-on-surface-variant font-body text-xs font-medium mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                        <span>Blind Bids Placed</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-xl sm:text-2xl font-bold text-on-surface">
                          19
                        </span>
                        <span className="font-body text-xs font-semibold text-secondary uppercase">
                          Certified Dealers
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Provincial Compliance Strip */}
                  <div className="pt-2 border-t border-border-card/60 flex items-center justify-between text-xs text-on-surface-variant font-medium">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-success" />
                      Clean Carfax Attached
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-secondary">
                      <Award className="w-3.5 h-3.5" />
                      Top 5% Wholesale Tier
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Micro-Section: Recognized Press & Media Ticker */}
      <div className="mt-14 sm:mt-20">
        <MediaTicker />
      </div>
    </div>
  );
}
