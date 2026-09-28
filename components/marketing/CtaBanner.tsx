"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react";

export function CtaBanner() {
  return (
    <section
      id="cta-banner"
      className="relative w-full bg-[#120F0D] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* ========================================================================= */}
        {/* Rounded Card Frame with Subtle Amber Border & Faint Grid Pattern          */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl sm:rounded-[36px] border border-secondary/35 bg-[#0D0B0A] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          {/* Subtle Technical Grid Lines Overlay (matching reference) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          {/* Soft Amber Ambient Glow on the Left */}
          <div className="absolute top-1/2 -left-20 -translate-y-1/2 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

          {/* 2-Column Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 items-end">
            {/* Left Content Column */}
            <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
              <h2 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
                Ready to elevate your <br />
                <span className="text-secondary">car sale &amp; price?</span>
              </h2>

              <p className="mt-4 sm:mt-6 font-body text-base sm:text-lg text-white/75 max-w-xl leading-relaxed">
                Join thousands of Canadian drivers bypassing dealership trade-in lowballs
                and unlocking 100% free, sealed-bid competition from certified buyers.
              </p>

              <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="#valuation"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-secondary px-7 py-3.5 font-body font-bold text-on-surface shadow-[0_0_24px_rgba(229,147,68,0.35)] transition-all hover:bg-secondary/90 hover:shadow-[0_0_32px_rgba(229,147,68,0.55)] active:scale-[0.98]"
                >
                  <span>Start Free Appraisal</span>
                  <ArrowRight weight="bold" className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right Column: Lady Portrait Anchored at Bottom */}
            <div className="lg:col-span-5 relative flex items-end justify-center lg:justify-end px-6 lg:pr-12 pt-4 lg:pt-0">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] h-[360px] sm:h-[420px] lg:h-[470px]">
                <Image
                  src="/avatars/happy-woman-in-a-green-sweater-holding-a-phone-and-1.webp"
                  alt="Happy Canadian vehicle seller using AutoNexa appraisal on phone"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-contain object-bottom drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)]"
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
