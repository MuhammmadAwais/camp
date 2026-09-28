"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react";

export function CtaBanner() {
  return (
    <section
      id="cta-banner"
      className="relative w-full bg-[#120F0D] py-12 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* ========================================================================= */}
        {/* Rounded Card Frame with Subtle Amber Border & Faint Grid Pattern          */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl sm:rounded-[36px] border border-secondary/30 bg-[#0D0B0A] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          {/* Subtle Technical Grid Lines Overlay (matching reference) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            }}
          />

          {/* Soft Amber Ambient Glow on the Left */}
          <div className="absolute top-1/2 -left-20 -translate-y-1/2 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

          {/* 2-Column Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 relative z-10 items-end min-h-[360px] sm:min-h-[400px] lg:min-h-[420px]">
            {/* Left Content Column */}
            <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 xl:pl-20 flex flex-col justify-center my-auto">
              <h2 className="font-headline text-3xl sm:text-5xl lg:text-[44px] xl:text-[56px] font-bold tracking-tight text-white leading-[1.12]">
                <span className="block">Ready to elevate your</span>
                <span className="block text-secondary mt-1 sm:mt-2">car &amp; rides?</span>
              </h2>

              <p className="mt-4 sm:mt-6 font-body text-base sm:text-lg text-white/75 max-w-lg leading-relaxed">
                Join thousands of Canadian drivers bypassing trade-in lowballs and
                unlocking guaranteed, sealed-bid wholesale dealer offers.
              </p>
            </div>

            {/* Right Column: Lady Portrait Anchored at Bottom & Reaching Card Top */}
            <div className="lg:col-span-5 relative flex items-end justify-center lg:justify-end px-6 sm:px-10 lg:pr-14 pt-4 lg:pt-0 h-full">
              <div className="relative w-[280px] sm:w-[340px] lg:w-[380px] xl:w-[420px] h-[340px] sm:h-[400px] lg:h-[440px] xl:h-[470px]">
                <Image
                  src="/avatars/happy-woman-in-a-green-sweater-holding-a-phone-and-1.webp"
                  alt="Canadian driver using AutoNexa appraisal on phone"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
                  priority={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
