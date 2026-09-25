"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, MapPin, Gauge, Sparkles, ArrowRight, Clock } from "lucide-react";

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

  const inventory = [
    {
      id: "4runner-2025",
      category: "suv",
      name: "2025 Toyota 4Runner TRD Pro",
      mileage: "8,450 km",
      transmission: "Automatic 4WD",
      location: "Calgary, AB",
      image: "/showcase-cars-with-bg/2025-Toyota-4runner.png",
      status: "Active Auction",
      bidsCount: 16,
      endsIn: "04h 12m",
      condition: "98/100 Grade A",
    },
    {
      id: "civic-2024",
      category: "sedan",
      name: "2024 Honda Civic Touring",
      mileage: "14,200 km",
      transmission: "CVT FWD",
      location: "Toronto, ON",
      image: "/showcase-cars-with-bg/2024-Honda-Civic.webp",
      status: "Ending Soon",
      bidsCount: 22,
      endsIn: "01h 48m",
      condition: "96/100 Grade A",
    },
    {
      id: "atlas-2023",
      category: "suv",
      name: "2023 Volkswagen Atlas Execline",
      mileage: "31,800 km",
      transmission: "8-Speed AWD",
      location: "Montreal, QC",
      image: "/showcase-cars-with-bg/2023-VW-Atlas.png",
      status: "Active Auction",
      bidsCount: 11,
      endsIn: "08h 35m",
      condition: "94/100 Grade A",
    },
    {
      id: "bronco-2022",
      category: "suv",
      name: "2022 Ford Bronco Badlands",
      mileage: "26,100 km",
      transmission: "10-Speed 4x4",
      location: "Vancouver, BC",
      image: "/showcase-cars-with-bg/2022-Ford-Bronco.webp",
      status: "Active Auction",
      bidsCount: 19,
      endsIn: "05h 22m",
      condition: "97/100 Grade A",
    },
    {
      id: "bmw-x1-2021",
      category: "suv",
      name: "2021 BMW X1 xDrive28i",
      mileage: "42,000 km",
      transmission: "Steptronic AWD",
      location: "Ottawa, ON",
      image: "/showcase-cars-with-bg/2021-bmw-x1.webp",
      status: "Active Auction",
      bidsCount: 14,
      endsIn: "06h 15m",
      condition: "95/100 Grade A",
    },
    {
      id: "porsche-911",
      category: "coupe",
      name: "Porsche 911 Carrera S",
      mileage: "18,900 km",
      transmission: "8-Speed PDK",
      location: "Oakville, ON",
      image: "/showcase-cars-with-bg/Porsche-911.webp",
      status: "Ending Soon",
      bidsCount: 28,
      endsIn: "00h 54m",
      condition: "99/100 Grade A+",
    },
  ];

  const filteredInventory =
    activeCategory === "all"
      ? inventory
      : inventory.filter((item) => item.category === activeCategory);

  return (
    <section
      id="explore"
      className="relative w-full bg-surface text-on-surface py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-border-card overflow-hidden"
    >
      {/* Subtle Tactile Stone Texture Layer */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: "url('/textures/stone-background-1400.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ========================================================================= */}
        {/* 1. Top Micro-Section: "Looking to sell your car?" (Comparison Grid)        */}
        {/* ========================================================================= */}
        <div className="mb-24 sm:mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Heading, White Jeep Renegade Cutout & Floating Offer Badges */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
              <h2 className="font-headline text-3xl sm:text-4xl md:text-[40px] font-bold tracking-tight text-on-surface leading-tight mb-2">
                Looking to sell your car?
              </h2>
              <p className="font-body text-sm sm:text-base text-on-surface-variant font-normal mb-8 max-w-md">
                Compare Canadian private listings against our 1,400+ verified dealer wholesale network.
              </p>

              {/* Vehicle Cutout Canvas with Floating Offer Badges */}
              <div className="relative w-full max-w-[420px] aspect-[16/10] mx-auto lg:mx-0 flex items-center justify-center">
                {/* Floating Offer Pill 1 (Top Left) */}
                <div className="absolute top-2 left-0 sm:left-2 z-20 bg-surface-container-lowest/95 backdrop-blur-md border border-border-card rounded-full px-3.5 py-1.5 shadow-[0_6px_20px_rgba(32,27,17,0.08)] flex items-center gap-1.5 animate-bounce-slow">
                  <span className="font-body text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    Offer
                  </span>
                  <span className="font-mono text-xs font-bold text-on-surface">
                    $29,500
                  </span>
                </div>

                {/* Floating Offer Pill 2 (Bottom Left) */}
                <div className="absolute bottom-4 -left-2 sm:left-1 z-20 bg-surface-container-lowest/95 backdrop-blur-md border border-border-card rounded-full px-3.5 py-1.5 shadow-[0_6px_20px_rgba(32,27,17,0.08)] flex items-center gap-1.5">
                  <span className="font-body text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    Offer
                  </span>
                  <span className="font-mono text-xs font-bold text-on-surface">
                    $31,990
                  </span>
                </div>

                {/* Floating Top Bid Pill 3 (Center Right - Highlighted) */}
                <div className="absolute top-1/2 -right-2 sm:right-0 -translate-y-1/2 z-20 bg-primary text-white border border-primary-light/40 rounded-full px-4 py-2 shadow-[0_8px_24px_rgba(142,34,44,0.3)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                  <span className="font-body text-[10px] font-bold uppercase tracking-wider text-secondary-fixed">
                    Top Bid
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    $34,250
                  </span>
                </div>

                {/* Central Car Image (image_38.webp) */}
                <div className="relative w-full h-full">
                  <Image
                    src="/plain-cars-images/image_38.webp"
                    alt="Sell your SUV with AutoNexa"
                    fill
                    className="object-contain drop-shadow-[0_16px_30px_rgba(0,0,0,0.18)]"
                    sizes="(max-width: 768px) 100vw, 420px"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Two Elegant Comparison Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              {/* Card 1: Sell to a Dealership (Fastest Option - AutoNexa Highlighted) */}
              <div className="relative bg-surface-container-lowest border-2 border-primary/40 rounded-2xl p-6 sm:p-7 shadow-[0_10px_35px_rgba(142,34,44,0.08)] flex flex-col justify-between transition-all hover:shadow-[0_12px_45px_rgba(142,34,44,0.14)] hover:border-primary">
                {/* Top Badge: "Fastest Option" */}
                <div className="absolute -top-3.5 left-6 bg-[#201B11] text-white font-body text-[10px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-secondary" />
                  <span>Fastest Option</span>
                </div>

                <div>
                  <h3 className="font-headline text-lg sm:text-xl font-bold text-on-surface mb-1 mt-1">
                    Sell to a dealership
                  </h3>
                  <p className="font-body text-xs text-primary font-semibold mb-6">
                    Direct access to 1,400+ certified Canadian dealers
                  </p>

                  <ul className="space-y-3.5 mb-8">
                    <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span>Sell as early as today</span>
                    </li>
                    <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span>Get multiple competing offers</span>
                    </li>
                    <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span>Trade-in provincial tax credits</span>
                    </li>
                    <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span>Convenient doorstep drop-off</span>
                    </li>
                  </ul>
                </div>

                <a
                  href="#valuation"
                  className="w-full py-3.5 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white font-body text-xs sm:text-sm font-bold tracking-wide shadow-sm hover:shadow-md transition-all text-center block active:scale-[0.99]"
                >
                  Get your offer now
                </a>
              </div>

              {/* Card 2: Sell Privately (Traditional Alternative) */}
              <div className="relative bg-surface-container-lowest/80 border border-border-card rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:border-outline-variant transition-all">
                <div>
                  <h3 className="font-headline text-lg sm:text-xl font-bold text-on-surface mb-1">
                    Sell privately
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant font-medium mb-6">
                    Self-managed classified portal listings
                  </p>

                  <ul className="space-y-3.5 mb-8">
                    <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span>Free to list on classifieds</span>
                    </li>
                    <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span>Reach public retail buyers</span>
                    </li>
                    <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span>List your vehicle in minutes</span>
                    </li>
                    <li className="flex items-center gap-3 text-xs sm:text-sm text-on-surface font-medium">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span>Aim for theoretical retail price</span>
                    </li>
                  </ul>
                </div>

                <a
                  href="#valuation"
                  className="w-full py-3.5 px-5 rounded-xl border-2 border-primary/30 hover:border-primary text-primary hover:bg-primary/5 font-body text-xs sm:text-sm font-bold tracking-wide transition-all text-center block active:scale-[0.99]"
                >
                  List your ad
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. Main Discover Section: Inventory & Makes Showcase Header               */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-border-card">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="font-body text-xs font-bold uppercase tracking-widest text-secondary">
                Live Wholesale Feed
              </span>
            </div>
            <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
              Discover Live Inventory & Makes
            </h2>
            <p className="mt-2 font-body text-sm sm:text-base text-on-surface-variant font-normal">
              Pre-inspected private trade-ins actively bidding across Canadian dealer terminals.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {categories.map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-4 py-2 rounded-lg font-body text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high hover:text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Live Inventory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredInventory.map((car) => (
            <div
              key={car.id}
              className="group bg-surface-container-lowest border border-border-card rounded-2xl overflow-hidden shadow-xs hover:shadow-[0_12px_32px_rgba(56,20,24,0.09)] hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Card Image Banner */}
              <div className="relative h-56 w-full overflow-hidden bg-surface-container">
                <Image
                  src={car.image}
                  alt={car.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Top Status & Timer Pills */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none z-10">
                  <span
                    className={`font-body text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md shadow-xs ${
                      car.status === "Ending Soon"
                        ? "bg-primary text-white"
                        : "bg-black/75 text-white border border-white/20"
                    }`}
                  >
                    {car.status}
                  </span>

                  <span className="flex items-center gap-1 font-mono text-xs font-bold text-white bg-black/75 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full shadow-xs">
                    <Clock className="w-3 h-3 text-secondary" />
                    <span>{car.endsIn}</span>
                  </span>
                </div>

                {/* Bottom Condition Stamp */}
                <div className="absolute bottom-3 left-3.5 pointer-events-none z-10">
                  <span className="font-body text-[10px] font-bold text-white bg-black/60 backdrop-blur-md border border-white/20 px-2.5 py-0.5 rounded-sm">
                    {car.condition}
                  </span>
                </div>
              </div>

              {/* Card Content & Sealed Bid Summary */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-outline" />
                    <span>{car.location}</span>
                  </div>

                  <h3 className="font-headline text-lg font-bold text-on-surface mb-3 tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                    {car.name}
                  </h3>

                  {/* Vehicle Spec Badges */}
                  <div className="grid grid-cols-2 gap-2 pb-4 mb-4 border-b border-border-card/60 text-xs text-on-surface-variant font-medium">
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-outline" />
                      <span>{car.mileage}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-outline" />
                      <span className="truncate">{car.transmission}</span>
                    </div>
                  </div>
                </div>

                {/* Sealed-Bid Auction Footer */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="font-body text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
                      Sealed Auction
                    </span>
                    <span className="font-body text-xs font-bold text-primary flex items-center gap-1">
                      <span>{car.bidsCount} Licensed Bids</span>
                    </span>
                  </div>

                  <a
                    href="#valuation"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-primary text-on-surface hover:text-white font-body text-xs font-bold uppercase tracking-wider transition-all duration-200 group/btn"
                  >
                    <span>View Report</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
