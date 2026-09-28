"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export function WhatIsAutoNexa() {
  const highlights = [
    "Certified Canadian Wholesale",
    "Direct Dealer Bidding",
    "100% Free For Sellers",
    "Guaranteed Payout",
  ];

  const showcaseCards = [
    {
      id: "hub",
      title: "LIVE AUCTION HUB",
      tagline: "Wholesale Dealer Exchange",
      description:
        "Access a live synchronized inventory stream of private Canadian trades with verified condition reports, Carfax disclosures, and sealed-bid integrity.",
      image: "/illustrations/live-auction-hub.webp",
      cta: "EXPLORE AUCTIONS",
      href: "#explore",
      cornerAccent: "secondary", // Pumpkin
    },
    {
      id: "sell",
      title: "SELL YOUR CAR",
      tagline: "Private Seller Appraisal",
      description:
        "Get guaranteed wholesale offers from 1,400+ licensed dealers across Canada. 100% free for private sellers, zero lowballing, and zero dealership haggling.",
      image: "/illustrations/sell-your-car.webp",
      cta: "GET APPRAISAL",
      href: "#valuation",
      cornerAccent: "primary", // Red
    },
  ];

  return (
    <section
      id="about"
      className="relative w-full bg-[#120F0D] text-white py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Tactile Dark Marble Background Layer */}
      <div
        className="absolute inset-0 opacity-15 mix-blend-luminosity pointer-events-none"
        style={{
          backgroundImage: "url('/textures/dark-marble.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Half: Editorial Narrative Split (Inspired by Reference 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start pb-16 sm:pb-20 border-b border-white/10">
          {/* Left Column: Numeral 01 & Feature Tags */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Bold Orange/Pumpkin Index & Subhead (Vertically Centered & Clean) */}
              <div className="flex items-center gap-4 sm:gap-5 mb-8">
                <span className="font-headline text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-secondary select-none leading-none">
                  01.
                </span>
                <h2 className="font-headline text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white uppercase leading-[1.15]">
                  About<br />AutoNexa
                </h2>
              </div>

              {/* Clean Tag Pills without Icons */}
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {highlights.map((label) => (
                  <div
                    key={label}
                    className="px-4 py-2 rounded-full font-body text-xs font-semibold tracking-wide text-white/80 bg-white/[0.06] hover:bg-white/[0.12] hover:text-white border border-white/10 hover:border-secondary/50 backdrop-blur-md transition-all duration-200 cursor-pointer shadow-xs"
                  >
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Lead Copy with Underlines & Keyword Highlights */}
          <div className="lg:col-span-7 lg:border-l lg:border-white/10 lg:pl-12 flex flex-col justify-between">
            <p className="font-body text-lg sm:text-2xl md:text-[25px] font-light text-white/70 leading-relaxed sm:leading-[1.7]">
              <span className="font-bold text-white tracking-tight">AutoNexa</span> is Canada&apos;s modern web auction platform engineered specifically for{" "}
              <span className="font-semibold text-white underline decoration-secondary decoration-2 underline-offset-6">
                transparent wholesale vehicle transactions
              </span>
              . We eliminate predatory trade-in lowballing by giving private sellers direct access to a competitive network of over{" "}
              <span className="font-semibold text-white underline decoration-primary decoration-2 underline-offset-6">
                1,400+ licensed dealers
              </span>{" "}
              competing simultaneously in sealed-bid auctions. Every car achieves its{" "}
              <span className="font-bold text-white tracking-tight">true national market price</span> — with{" "}
              <span className="font-semibold text-white">zero seller fees</span>, full Canadian regulatory compliance (OMVIC, AMVIC, VSA), and guaranteed payouts in 48 hours.
            </p>

            {/* Interactive Explore Link */}
            <div className="mt-8 flex items-center gap-3">
              <a
                href="#how-it-works"
                className="group inline-flex items-center gap-2 font-body text-xs sm:text-sm font-semibold uppercase tracking-wider text-secondary hover:text-secondary-hover transition-colors"
              >
                <span>How the sealed-bid auction works</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Half: Two Geometric Cut Action Cards (Inspired by Reference 2) */}
        <div className="mt-14 sm:mt-18 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {showcaseCards.map((card) => {
            const isPumpkin = card.cornerAccent === "secondary";

            return (
              <div
                key={card.id}
                className="group relative h-[420px] sm:h-[460px] w-full overflow-hidden bg-black/60 border border-white/15 [clip-path:polygon(0_0,calc(100%-28px)_0,100%_28px,100%_100%,28px_100%,0_calc(100%-28px))] transition-all duration-300 hover:border-white/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
              >
                {/* Background Imagery with Smooth Zoom on Hover */}
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  unoptimized={card.image.endsWith(".jfif")}
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

                {/* Dark Vignette Overlay for Crisp Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 pointer-events-none" />

                {/* Geometric Corner Triangle Cut Accents (Top-Right & Bottom-Left) */}
                <div className="absolute top-0 right-0 w-7 h-7 pointer-events-none z-20">
                  <div
                    className={`w-full h-full ${
                      isPumpkin ? "bg-secondary" : "bg-primary"
                    } [clip-path:polygon(100%_0,0_0,100%_100%)] opacity-90 group-hover:opacity-100 transition-opacity`}
                  />
                </div>
                <div className="absolute bottom-0 left-0 w-7 h-7 pointer-events-none z-20">
                  <div
                    className={`w-full h-full ${
                      isPumpkin ? "bg-primary" : "bg-secondary"
                    } [clip-path:polygon(0_100%,0_0,100%_100%)] opacity-90 group-hover:opacity-100 transition-opacity`}
                  />
                </div>

                {/* Precision Aerospace Corner Crosshair Accents */}
                <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-white/40 pointer-events-none z-20" />
                <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-white/40 pointer-events-none z-20" />

                {/* Floating Glassmorphic Content Banner */}
                <div className="absolute inset-x-4 sm:inset-x-6 bottom-4 sm:bottom-6 z-20 bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 group-hover:bg-white/[0.12] group-hover:border-white/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-[11px] font-bold uppercase tracking-widest text-secondary">
                      {card.tagline}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  </div>

                  <h3 className="font-headline text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                    {card.title}
                  </h3>

                  <p className="font-body text-xs sm:text-sm text-white/80 leading-relaxed mb-4 line-clamp-2">
                    {card.description}
                  </p>

                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg bg-white/10 hover:bg-primary text-white border border-white/25 hover:border-primary font-body text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-all duration-300 group/btn active:scale-[0.98]"
                  >
                    <span>{card.cta}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
