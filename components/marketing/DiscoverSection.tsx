"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Lightning,
  CheckCircle,
  ArrowRight,
  ArrowUpRight,
} from "@phosphor-icons/react";

export function DiscoverSection() {
  const [activeCategory, setActiveCategory] = React.useState("all");

  const categories = [
    { id: "all", label: "All Makes" },
    { id: "suv", label: "SUVs" },
    { id: "sedan", label: "Sedans" },
    { id: "truck", label: "Trucks" },
    { id: "coupe", label: "Coupes" },
    { id: "electric", label: "Electric & Hybrid" },
  ];

  const recentSales = [
    {
      id: "4runner-2025",
      category: "suv",
      badge: "Sold in 24h • 18 Bids",
      title: "2025 Toyota 4Runner TRD Pro",
      description:
        "Off-road flagship with factory lift, FOX internal bypass shocks, and verified clean Carfax inspection.",
      mileage: "8,450 km",
      transmission: "Automatic",
      fuel: "Gasoline",
      dealer: "Brampton, ON",
      image: "/showcase-cars-with-bg/2025-Toyota-4runner.png",
      soldPrice: "$58,900",
      tradeInOffer: "$54,700 CAD",
      surplus: "+$4,200  ",
    },
    {
      id: "civic-2024",
      category: "sedan",
      badge: "Sold in 24h • 14 Bids",
      title: "2024 Honda Civic Touring",
      description:
        "Single-owner commuter sedan with premium leather, Bose audio, and verified safety certification.",
      mileage: "14,200 km",
      transmission: "Automatic",
      fuel: "Gasoline",
      dealer: "Toronto, ON",
      image: "/showcase-cars-with-bg/2024-Honda-Civic.webp",
      soldPrice: "$27,400",
      tradeInOffer: "$24,600 CAD",
      surplus: "+$2,800  ",
    },
    {
      id: "atlas-2023",
      category: "suv",
      badge: "Sold in 24h • 16 Bids",
      title: "2023 Volkswagen Atlas Execline",
      description:
        "7-passenger family SUV with panoramic sunroof, 3.6L V6 AWD, and zero accident history.",
      mileage: "31,800 km",
      transmission: "Automatic",
      fuel: "Gasoline",
      dealer: "Montreal, QC",
      image: "/showcase-cars-with-bg/2023-VW-Atlas.png",
      soldPrice: "$41,200",
      tradeInOffer: "$37,500 CAD",
      surplus: "+$3,700  ",
    },
    {
      id: "bronco-2022",
      category: "suv",
      badge: "Sold in 24h • 21 Bids",
      title: "2022 Ford Bronco Badlands",
      description:
        "Sasquatch package with 35-inch tires, electronic front/rear lockers, and verified clean title.",
      mileage: "26,100 km",
      transmission: "Automatic",
      fuel: "Gasoline",
      dealer: "Vancouver, BC",
      image: "/showcase-cars-with-bg/2022-Ford-Bronco.webp",
      soldPrice: "$51,500",
      tradeInOffer: "$46,800 CAD",
      surplus: "+$4,700  ",
    },
    {
      id: "bmw-x1-2021",
      category: "suv",
      badge: "Sold in 24h • 12 Bids",
      title: "2021 BMW X1 xDrive28i",
      description:
        "Compact luxury crossover with M Sport styling, heated steering wheel, and fresh inspection cert.",
      mileage: "42,000 km",
      transmission: "Automatic",
      fuel: "Gasoline",
      dealer: "Ottawa, ON",
      image: "/showcase-cars-with-bg/2021-bmw-x1.webp",
      soldPrice: "$30,800",
      tradeInOffer: "$27,600 CAD",
      surplus: "+$3,200  ",
    },
    {
      id: "porsche-911",
      category: "coupe",
      badge: "Sold in 24h • 27 Bids",
      title: "Porsche 911 Carrera S",
      description:
        "Iconic 3.0L twin-turbo flat-six with Sport Chrono, sports exhaust, and dealer service logs.",
      mileage: "18,900 km",
      transmission: "Automatic",
      fuel: "Gasoline",
      dealer: "Oakville, ON",
      image: "/showcase-cars-with-bg/Porsche-911.webp",
      soldPrice: "$124,000",
      tradeInOffer: "$114,500 CAD",
      surplus: "+$9,500  ",
    },
  ];

  const filteredSales =
    activeCategory === "all"
      ? recentSales
      : recentSales.filter((item) => item.category === activeCategory);

  return (
    <section
      id="explore"
      className="relative w-full bg-surface text-on-surface py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-border-card overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* ========================================================================= */}
        {/* 1. Top Micro-Section: "Looking to sell your car?" (Unclipped & Geometric) */}
        {/* ========================================================================= */}
        <div className="mb-24 sm:mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Heading, White Jeep Renegade Cutout & Unobstructed Badges */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
              <h2 className="font-headline text-3xl sm:text-4xl md:text-[40px] font-bold tracking-tight text-on-surface leading-tight mb-2">
                Looking to sell your car?
              </h2>
              <p className="font-body text-sm sm:text-base text-on-surface-variant font-normal mb-8 max-w-md">
                Compare Canadian private listings against our 1,400+ verified
                dealer wholesale network.
              </p>

              {/* Vehicle Cutout Canvas with Balanced, Matte Floating Offer Badges */}
              <div className="relative w-full max-w-[440px] aspect-[16/10] mx-auto lg:mx-0 flex items-center justify-center pt-4 pb-2">
                {/* Floating Badge 1 (Top Left, elevated clear of roof) */}
                <div className="absolute -top-1 left-2 sm:left-4 z-20 bg-surface-container-lowest border border-border-card rounded-md px-3.5 py-1.5 shadow-[0_4px_14px_rgba(32,27,17,0.06)] flex items-center gap-2">
                  <span className="font-body text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Offer
                  </span>
                  <span className="font-mono text-xs font-bold text-on-surface">
                    $29,500 CAD
                  </span>
                </div>

                {/* Floating Badge 2 (Bottom Left, alongside wheel base) */}
                <div className="absolute -bottom-2 left-0 sm:left-2 z-20 bg-surface-container-lowest border border-border-card rounded-md px-3.5 py-1.5 shadow-[0_4px_14px_rgba(32,27,17,0.06)] flex items-center gap-2">
                  <span className="font-body text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Offer
                  </span>
                  <span className="font-mono text-xs font-bold text-on-surface">
                    $31,990 CAD
                  </span>
                </div>

                {/* Floating Badge 3 (Top Right, above fender - No green ping, zero grille masking) */}
                <div className="absolute -top-1 right-2 sm:right-4 z-20 bg-primary text-white border border-primary-hover [clip-path:polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,6px_100%,0_calc(100%-6px))] px-3.5 py-1.5 shadow-sm flex items-center gap-2">
                  <span className="font-body text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Top Dealer Bid
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    $34,250 CAD
                  </span>
                </div>

                {/* Central Car Image (image_38.webp) */}
                <div className="relative w-full h-full">
                  <Image
                    src="/plain-cars-images/image_38.webp"
                    alt="Sell your vehicle with AutoNexa"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 440px"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Two Sharp Geometric Comparison Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              {/* Card 1 Wrapper (Allows Fastest Option badge to sit above without clipping) */}
              <div className="relative pt-3 flex flex-col">
                {/* Geometric Top Badge: "Fastest Option" with Phosphor Lightning (Unclipped) */}
                <div className="absolute top-0 left-6 bg-[#201B11] text-white font-body text-[10px] font-bold uppercase tracking-widest px-3.5 py-1 [clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,8px_100%,0_calc(100%-8px))] shadow-sm flex items-center gap-1.5 z-20 border-y border-white/20">
                  <Lightning
                    weight="fill"
                    className="w-3.5 h-3.5 text-secondary"
                  />
                  <span>Fastest Option</span>
                </div>

                {/* Card 1 Body: Geometric Chamfer */}
                <div className="group relative flex-1 bg-surface-container-lowest border border-primary/40 [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,24px_100%,0_calc(100%-24px))] p-6 sm:p-7 shadow-[0_8px_30px_rgba(32,27,17,0.06)] flex flex-col justify-between transition-all duration-300 hover:border-primary">
                  {/* Subtle stone texture on card surface */}
                  <div
                    className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none"
                    style={{
                      backgroundImage:
                        "url('/textures/stone-background-1400.jpg')",
                    }}
                  />

                  {/* Solid Corner Triangles (Top-Right Crimson & Bottom-Left Pumpkin) */}
                  <div className="absolute top-0 right-0 w-6 h-6 pointer-events-none z-10">
                    <div className="w-full h-full bg-primary [clip-path:polygon(100%_0,0_0,100%_100%)] opacity-90 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none z-10">
                    <div className="w-full h-full bg-secondary [clip-path:polygon(0_100%,0_0,100%_100%)] opacity-90 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Technical Aerospace Corner Crosshairs */}
                  <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-primary/40 pointer-events-none z-10" />
                  <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-primary/40 pointer-events-none z-10" />

                  <div className="relative z-10 pt-3">
                    <h3 className="font-headline text-lg sm:text-xl font-bold text-on-surface mb-1">
                      Sell to a dealership
                    </h3>
                    <p className="font-body text-xs text-primary font-semibold mb-6">
                      Direct access to 1,400+ certified Canadian dealers
                    </p>

                    <ul className="space-y-3.5 mb-8">
                      <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                        <CheckCircle
                          weight="fill"
                          className="w-4 h-4 text-success shrink-0"
                        />
                        <span>Sell as early as today</span>
                      </li>
                      <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                        <CheckCircle
                          weight="fill"
                          className="w-4 h-4 text-success shrink-0"
                        />
                        <span>Get multiple competing offers</span>
                      </li>
                      <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                        <CheckCircle
                          weight="fill"
                          className="w-4 h-4 text-success shrink-0"
                        />
                        <span>Trade-in provincial tax credits</span>
                      </li>
                      <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                        <CheckCircle
                          weight="fill"
                          className="w-4 h-4 text-success shrink-0"
                        />
                        <span>Convenient doorstep drop-off</span>
                      </li>
                    </ul>
                  </div>

                  <div className="relative z-10">
                    <a
                      href="#valuation"
                      className="w-full py-3.5 px-5 bg-primary hover:bg-primary-hover text-white font-body text-xs sm:text-sm font-bold tracking-wide [clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,8px_100%,0_calc(100%-8px))] shadow-sm transition-all text-center block active:scale-[0.99]"
                    >
                      Get your offer now
                    </a>
                  </div>
                </div>
              </div>

              {/* Card 2 Wrapper & Body: Sell Privately */}
              <div className="relative pt-3 flex flex-col">
                <div className="group relative flex-1 bg-surface-container-lowest/90 border border-border-card [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,24px_100%,0_calc(100%-24px))] p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:border-outline-variant transition-all duration-300">
                  {/* Subtle stone texture on card surface */}
                  <div
                    className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none"
                    style={{
                      backgroundImage:
                        "url('/textures/stone-background-1400.jpg')",
                    }}
                  />

                  {/* Subtle Neutral Corner Triangles */}
                  <div className="absolute top-0 right-0 w-6 h-6 pointer-events-none z-10">
                    <div className="w-full h-full bg-outline-variant/60 [clip-path:polygon(100%_0,0_0,100%_100%)] opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none z-10">
                    <div className="w-full h-full bg-outline-variant/60 [clip-path:polygon(0_100%,0_0,100%_100%)] opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Technical Corner Crosshairs */}
                  <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-outline-variant/60 pointer-events-none z-10" />
                  <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-outline-variant/60 pointer-events-none z-10" />

                  <div className="relative z-10 pt-3">
                    <h3 className="font-headline text-lg sm:text-xl font-bold text-on-surface mb-1">
                      Sell privately
                    </h3>
                    <p className="font-body text-xs text-on-surface-variant font-medium mb-6">
                      Self-managed classified portal listings
                    </p>

                    <ul className="space-y-3.5 mb-8">
                      <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                        <CheckCircle
                          weight="fill"
                          className="w-4 h-4 text-success shrink-0"
                        />
                        <span>Free to list on classifieds</span>
                      </li>
                      <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                        <CheckCircle
                          weight="fill"
                          className="w-4 h-4 text-success shrink-0"
                        />
                        <span>Reach public retail buyers</span>
                      </li>
                      <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                        <CheckCircle
                          weight="fill"
                          className="w-4 h-4 text-success shrink-0"
                        />
                        <span>List your vehicle in minutes</span>
                      </li>
                      <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                        <CheckCircle
                          weight="fill"
                          className="w-4 h-4 text-success shrink-0"
                        />
                        <span>Aim for theoretical retail price</span>
                      </li>
                    </ul>
                  </div>

                  <div className="relative z-10">
                    <a
                      href="#valuation"
                      className="w-full py-3.5 px-5 border-2 border-primary/30 hover:border-primary text-primary hover:bg-primary/5 font-body text-xs sm:text-sm font-bold tracking-wide [clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,8px_100%,0_calc(100%-8px))] transition-all text-center block active:scale-[0.99]"
                    >
                      List your ad
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* 2. Main Sales Showcase: Clean Header with Floating Text Tabs               */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-4 border-b border-border-card/60">
          <div>
            <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
              Recently Sold Above Market Rate
            </h2>
            <p className="mt-2 font-body text-sm sm:text-base text-on-surface-variant font-normal">
              Real sales. Real competition. See what Canadian car owners
              unlocked by letting 1,400+ licensed dealers bid.
            </p>
          </div>

          {/* Clean Floating Text Category Tabs (Red Underline on Active, No Bubbly Pills) */}
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto scrollbar-none pt-2">
            {categories.map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`relative pb-3 pt-1 -mb-[1px] font-body text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer bg-transparent border-b-2 outline-none focus:outline-none ${
                    isActive
                      ? "text-primary font-bold border-primary"
                      : "text-on-surface-variant hover:text-on-surface font-medium border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Product Cards with Portrait Aspect Ratio, Purposeful Telemetry & Notch  */}
        {/* ========================================================================= */}
        <div className="max-w-[1080px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSales.map((car) => {
              return (
                <div
                  key={car.id}
                  className="group relative bg-white rounded-[32px] p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between border border-border-card/60 hover:-translate-y-1"
                >
                  {/* Smooth Masked Shadow Layer: Zero shadow under the bottom-right corner, soft natural fade */}
                  <div
                    className="absolute inset-0 rounded-[32px] pointer-events-none -z-10 shadow-[0_4px_24px_rgba(32,27,17,0.05)] group-hover:shadow-[0_16px_40px_rgba(32,27,17,0.09)] transition-shadow duration-300"
                    style={{
                      maskImage:
                        "radial-gradient(circle at bottom right, transparent 0, transparent 80px, black 120px)",
                      WebkitMaskImage:
                        "radial-gradient(circle at bottom right, transparent 0, transparent 80px, black 120px)",
                    }}
                  />

                  {/* 1. Vehicle Photo Canvas (Taller 4:3 Proportion for High-End Aspect Ratio) */}
                  <div className="relative h-60 sm:h-64 w-full rounded-[24px] overflow-hidden bg-surface-container/60 shrink-0">
                    <Image
                      src={car.image}
                      alt={car.title}
                      fill
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 360px"
                    />

                    {/* Top-Left Purposeful Telemetry Badge (Frosted Obsidian Pill with Emerald Beacon) */}
                    <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2 bg-black/65 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-semibold border border-white/15 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      <span className="tracking-wide font-body">
                        {car.badge}
                      </span>
                    </div>
                  </div>

                  {/* 2. Card Content Body */}
                  <div className="pt-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Title */}
                      <h3 className="font-headline text-lg sm:text-[19px] font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                        {car.title}
                      </h3>

                      {/* Short Description */}
                      <p className="font-body text-xs text-on-surface-variant leading-relaxed line-clamp-2 mt-1.5 font-normal">
                        {car.description}
                      </p>

                      {/* Horizontal Divider Line 1 (Between description & specs) */}
                      <div className="border-t border-border-card/50 my-3" />

                      {/* Specs & Dealer Details (Moved to clean dedicated lines with zero crowding) */}
                      <div className="space-y-1.5 text-xs font-body">
                        {/* Line 1: Specs */}
                        <div className="flex items-center gap-2 font-semibold text-on-surface whitespace-nowrap overflow-hidden">
                          <span>{car.mileage}</span>
                          <span className="text-outline-variant font-normal">
                            •
                          </span>
                          <span>{car.transmission}</span>
                          <span className="text-outline-variant font-normal">
                            •
                          </span>
                          <span>{car.fuel}</span>
                        </div>

                        {/* Line 2: Dealer Location */}
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant">
                          <span className="opacity-70">Sold to Dealer in:</span>
                          <span className="font-bold text-on-surface uppercase tracking-wide">
                            {car.dealer}
                          </span>
                        </div>
                      </div>

                      {/* Horizontal Divider Line 2 (Between specs & pricing) */}
                      <div className="border-t border-border-card/60 my-3" />
                    </div>

                    {/* 3. Bottom Row: Payout & Surplus over Trade-In */}
                    <div className="pt-2 flex items-end justify-between min-h-[60px]">
                      {/* Left: Pricing with Trade-in Comparison & Sleek Institutional Surplus Chip */}
                      <div className="flex flex-col justify-end max-w-[calc(100%-70px)] pr-2">
                        <div className="flex items-center gap-2.5 mb-1 flex-wrap sm:flex-nowrap">
                          <span className="font-headline text-2xl font-black text-on-surface tracking-tight whitespace-nowrap">
                            {car.soldPrice}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#16271E] text-emerald-400 border border-emerald-500/25 font-mono text-[10.5px] font-bold tracking-tight shadow-xs whitespace-nowrap">
                            <ArrowUpRight
                              weight="bold"
                              className="w-3 h-3 text-emerald-400 shrink-0"
                            />
                            <span>{car.surplus}</span>
                          </span>
                        </div>
                        <div className="text-[11px] font-body text-on-surface-variant flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-on-surface-variant/70 font-medium">
                            Dealer trade-in was:
                          </span>
                          <span className="line-through font-mono text-on-surface-variant/50 font-medium">
                            {car.tradeInOffer}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Docked Concave Corner Notch & Action Button */}
                  <div className="absolute -bottom-[1px] -right-[1px] z-20 pointer-events-auto">
                    <div className="relative w-[77px] h-[77px] bg-surface rounded-tl-[26px] border-t border-l border-border-card/60 flex items-center justify-center">
                      {/* Top Concave Fillet Curve (Smooth transition from card right edge into notch with border) */}
                      <svg
                        viewBox="0 0 20 20"
                        className="w-5 h-5 absolute -top-5 right-0 pointer-events-none overflow-visible"
                      >
                        <path
                          d="M 20,0 A 20 20 0 0 1 0,20 L 20,20 Z"
                          className="fill-surface"
                        />
                        <path
                          d="M 20,0 A 20 20 0 0 1 0,20"
                          fill="none"
                          stroke="var(--color-border-card, #EADDCB)"
                          strokeOpacity="0.6"
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
                          className="fill-surface"
                        />
                        <path
                          d="M 0,20 A 20 20 0 0 0 20,0"
                          fill="none"
                          stroke="var(--color-border-card, #EADDCB)"
                          strokeOpacity="0.6"
                          strokeWidth="1"
                        />
                      </svg>

                      {/* Docked Action Button Linking to #valuation for sellers */}
                      <a
                        href="#valuation"
                        className="w-[52px] h-[52px] rounded-[18px] bg-white shadow-[0_4px_14px_rgba(32,27,17,0.12)] hover:shadow-[0_6px_20px_rgba(140,56,62,0.25)] flex items-center justify-center text-on-surface hover:text-white hover:bg-primary transition-all duration-200 cursor-pointer active:scale-95 group/btn"
                        aria-label="Value your car"
                        title="Value your car"
                      >
                        <ArrowUpRight
                          weight="bold"
                          className="w-5 h-5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                        />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. Mid-Section Centered Conversion CTA Button (Web App Navigation)         */}
        {/* ========================================================================= */}
        <div className="mt-16 sm:mt-20 text-center flex flex-col items-center justify-center">
          <a
            href="https://app.autonexa.ca"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-body text-sm sm:text-base font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.98] group cursor-pointer"
          >
            <span>Explore All Live Wholesale Deals</span>
            <ArrowRight
              weight="bold"
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
