"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lightning } from "@phosphor-icons/react";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative w-full bg-[#120F0D] text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Tactile Dark Marble Background Layer (Matches About AutoNexa section) */}
      <div
        className="absolute inset-0 opacity-15 mix-blend-luminosity pointer-events-none"
        style={{
          backgroundImage: "url('/textures/dark-marble.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ========================================================================= */}
        {/* 1. Header: Editorial Tagline & Section Title                               */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
        

          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Institutional power, built for private Canadian sellers.
          </h2>

          <p className="mt-4 font-body text-base sm:text-lg text-white/70 font-normal leading-relaxed">
            AutoNexa replaces dealership haggling with bank-grade blind auction mechanics,
            transparent algorithmic valuation, and guaranteed zero-fee payouts.
          </p>

          <div className="w-16 h-1 bg-secondary mx-auto mt-6 rounded-full" />
        </div>

        {/* ========================================================================= */}
        {/* 2. Clean 2-Column Architecture (Middle Logo Removed for Simple Layout)     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 xl:gap-20">
          {/* ----------------------------------------------------------------------- */}
          {/* Column 1: Feature 01 & Feature 02                                       */}
          {/* ----------------------------------------------------------------------- */}
          <div className="space-y-12 sm:space-y-14">
            {/* Feature 01 */}
            <div className="group">
              <div className="flex items-start gap-4 sm:gap-5">
                <span className="font-headline text-5xl sm:text-6xl font-black tracking-tight text-secondary select-none leading-none">
                  01.
                </span>
                <div className="flex-1">
                  <h3 className="font-headline text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-secondary transition-colors">
                    24-Hour Sealed-Bid Engine
                  </h3>
                </div>
              </div>

              <p className="font-body text-sm sm:text-base text-white/70 leading-relaxed font-normal mt-3 pl-0 sm:pl-[72px]">
                Licensed Canadian dealerships submit blind, upward-only offers without seeing competitor figures. Eliminates dealer collusion, lowballing, and negotiation games.
              </p>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between pl-0 sm:pl-[72px]">
                <a
                  href="#valuation"
                  className="inline-flex items-center gap-2 text-xs font-mono text-secondary font-bold hover:text-white transition-colors group/link"
                >
                  <span>Explore sealed-bid protocol</span>
                  <ArrowRight weight="bold" className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Subtle Divider Line */}
            <div className="w-full h-px bg-white/10" />

            {/* Feature 02 */}
            <div className="group">
              <div className="flex items-start gap-4 sm:gap-5">
                <span className="font-headline text-5xl sm:text-6xl font-black tracking-tight text-primary select-none leading-none">
                  02.
                </span>
                <div className="flex-1">
                  <h3 className="font-headline text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                    Algorithmic Market Valuation
                  </h3>
                </div>
              </div>

              <p className="font-body text-sm sm:text-base text-white/70 leading-relaxed font-normal mt-3 pl-0 sm:pl-[72px]">
                Synthesizes regional auction clearance data, live dealership demand curves, and inter-provincial arbitrage to establish transparent wholesale reserve values.
              </p>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between pl-0 sm:pl-[72px]">
                <a
                  href="#valuation"
                  className="inline-flex items-center gap-2 text-xs font-mono text-primary font-bold hover:text-white transition-colors group/link"
                >
                  <span>View regional valuation spread</span>
                  <ArrowRight weight="bold" className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* Column 2: Feature 03 & Feature 04                                       */}
          {/* ----------------------------------------------------------------------- */}
          <div className="space-y-12 sm:space-y-14">
            {/* Feature 03 */}
            <div className="group">
              <div className="flex items-start gap-4 sm:gap-5">
                <span className="font-headline text-5xl sm:text-6xl font-black tracking-tight text-secondary select-none leading-none">
                  03.
                </span>
                <div className="flex-1">
                  <h3 className="font-headline text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-secondary transition-colors">
                    Digital Damage & Condition HUD
                  </h3>
                </div>
              </div>

              <p className="font-body text-sm sm:text-base text-white/70 leading-relaxed font-normal mt-3 pl-0 sm:pl-[72px]">
                Multi-point interactive damage schematic logs paint depth, cosmetic imperfections, and tire wear in advance. Locks dealer bids without post-auction haggling.
              </p>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between pl-0 sm:pl-[72px]">
                <a
                  href="#valuation"
                  className="inline-flex items-center gap-2 text-xs font-mono text-secondary font-bold hover:text-white transition-colors group/link"
                >
                  <span>Explore condition inspection HUD</span>
                  <ArrowRight weight="bold" className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Subtle Divider Line */}
            <div className="w-full h-px bg-white/10" />

            {/* Feature 04 */}
            <div className="group">
              <div className="flex items-start gap-4 sm:gap-5">
                <span className="font-headline text-5xl sm:text-6xl font-black tracking-tight text-primary select-none leading-none">
                  04.
                </span>
                <div className="flex-1">
                  <h3 className="font-headline text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                    Provincial Regulatory Compliance
                  </h3>
                </div>
              </div>

              <p className="font-body text-sm sm:text-base text-white/70 leading-relaxed font-normal mt-3 pl-0 sm:pl-[72px]">
                Every registered dealership is certified under OMVIC, AMVIC, or VSA regulatory frameworks. All seller photos are automatically stripped of EXIF GPS coordinates for total privacy.
              </p>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between pl-0 sm:pl-[72px]">
                <a
                  href="#legal"
                  className="inline-flex items-center gap-2 text-xs font-mono text-primary font-bold hover:text-white transition-colors group/link"
                >
                  <span>Review Canadian regulatory standards</span>
                  <ArrowRight weight="bold" className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Bottom Span: Feature 05 — Simple, Clean                                 */}
        {/* ========================================================================= */}
        <div className="mt-16 sm:mt-24 pt-10 border-t border-white/10">
          <div className="max-w-4xl mx-auto group">
            <div className="flex items-start gap-4 sm:gap-6">
              <span className="font-headline text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-secondary select-none leading-none">
                05.
              </span>
              <div className="flex-1">
                <h3 className="font-headline text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-secondary transition-colors">
                  Zero-Fee Direct Payout in 48 Hours
                </h3>

                <p className="font-body text-sm sm:text-base text-white/70 leading-relaxed font-normal mt-3">
                  Private Canadian vehicle sellers never pay listing, commission, or transaction fees. Dealerships fund the platform through institutional memberships, ensuring 100% of the winning bid reaches your account via Interac e-Transfer or certified bank draft.
                </p>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                  <a
                    href="#valuation"
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono text-secondary font-bold hover:text-white transition-colors group/link"
                  >
                    <span>Start your free appraisal</span>
                    <ArrowRight weight="bold" className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
