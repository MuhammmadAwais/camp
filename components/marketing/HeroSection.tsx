"use client";

import * as React from "react";
import Image from "next/image";
import { MarketValuationWidget } from "@/components/marketing/MarketValuationWidget";
import { BrandCarousel } from "@/components/marketing/BrandCarousel";
import { TrendingUp, Clock, CheckCircle } from "lucide-react";

export function HeroSection() {
  const [seconds, setSeconds] = React.useState(52702); // 14h 38m 22s
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
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
    <div className="relative w-full bg-surface text-on-surface overflow-hidden">
      {/* Hero Visual Section */}
      <section className="relative min-h-[95vh] flex flex-col justify-between pt-28 sm:pt-36 lg:pt-40 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Crisp Raw Background Image (Zero Filters, Zero Texture Overlays) */}
        <div
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
          suppressHydrationWarning
        >
          <Image
            src="/hero-bg.jfif"
            alt="AutoNexa Luxury Fleet at Twilight"
            fill
            priority
            unoptimized
            className="object-cover object-top sm:object-center"
          />

          {/* Gentle bottom-edge transition into the warm ivory page canvas */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-surface via-surface/60 to-transparent pointer-events-none" />
        </div>

        {/* Content Container (Layered on top of background) */}
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center text-center my-auto">
         

          {/* Main Headline (Epilogue) with Italic Keyword Emphasis */}
          <h1 className="font-headline text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] leading-[1.12] max-w-4xl">
            The{" "}
            <span className="italic font-serif text-secondary underline decoration-secondary/60 underline-offset-8">
              Best
            </span>{" "}
            Way To Sell Your Car.
          </h1>

          {/* Subheading (Plus Jakarta Sans) */}
          <p className="mt-4 sm:mt-5 font-body text-lg sm:text-xl text-white/95 max-w-2xl font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            Unlock your best price with AutoNexa
          </p>

          {/* Live Telemetry Ticker Strip */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-2 px-5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/95 font-mono text-xs shadow-lg">
            <span className="flex items-center gap-1.5 text-secondary font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Next Auction Closes:</span>
              <strong className="tracking-wider text-white" suppressHydrationWarning>
                {mounted ? formatCountdown(seconds) : "14:38:22"}
              </strong>
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-1 text-white/90">
              <TrendingUp className="w-3.5 h-3.5 text-success" />
              +$2,850 CAD Avg Over Dealer Trade-in
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-1 text-white/90">
              <CheckCircle className="w-3.5 h-3.5 text-secondary" />
              Zero Lowballing
            </span>
          </div>

          {/* Interactive Valuation Widget (Images 2 & 3 Inspired) */}
          <div className="mt-8 sm:mt-10 w-full" id="valuation">
            <MarketValuationWidget />
          </div>
        </div>
      </section>

      {/* Infinite Car Company Logos Carousel (Micro-Section) */}
      <BrandCarousel />
    </div>
  );
}
