"use client";

import * as React from "react";
import Image from "next/image";
import { MarketValuationWidget } from "@/components/marketing/MarketValuationWidget";
import { BrandCarousel } from "@/components/marketing/BrandCarousel";

export function HeroSection() {
  return (
    <div
      className="relative w-full bg-[#120F0D] text-white overflow-hidden"
      suppressHydrationWarning
    >
      {/* Hero Visual Section */}
      <section
        className="relative min-h-[92vh] flex flex-col justify-between pt-32 sm:pt-36 lg:pt-42 pb-16 px-4 sm:px-6 lg:px-8"
        suppressHydrationWarning
      >
        {/* Background Image with Top-to-Bottom Dark Gradient Overlay */}
        <div
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
          suppressHydrationWarning
        >
          <Image
            src="/hero-bg.webp"
            alt="AutoNexa Luxury Fleet at Twilight"
            fill
            priority
            className="object-cover object-top sm:object-center brightness-[0.88]"
          />

          {/* Smooth top-to-bottom dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/50 to-black/85 pointer-events-none" />

          {/* Smooth bottom-edge dark transition into WhatIsAutoNexa */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#120F0D] via-[#120F0D]/85 to-transparent pointer-events-none" />
        </div>

        {/* Content Container */}
        <div
          className="relative z-10 max-w-6xl mx-auto flex flex-col items-center text-center my-auto w-full"
          suppressHydrationWarning
        >
          {/* Main Headline (Epilogue) with consistent font styling */}
          <h1 className="font-headline text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] leading-[1.12] max-w-4xl">
            The{" "}
            <span className=" text-secondary underline decoration-secondary/60 underline-offset-8">
              Best
            </span>{" "}
            Way To Sell Your Car.
          </h1>

          {/* Subheading (Plus Jakarta Sans) */}
          <p className="mt-4 sm:mt-5 font-body text-lg sm:text-xl text-white/90 max-w-2xl font-normal leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            Unlock your best price with AutoNexa
          </p>

          {/* Interactive Valuation Widget */}
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
