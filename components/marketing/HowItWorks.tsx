"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";

export function HowItWorks() {
  const steps = [
    {
      step: "01.",
      number: "STEP 01",
      title: "Get Instant Valuation",
      subtitle: "Digital Appraisal in 2 Minutes",
      image: "/illustrations/get-estimate.jpg",
      alt: "Canadian car owner appraising vehicle on mobile phone",
      accent: "text-secondary", // Pumpkin amber (like About AutoNexa)
      bulletPoints: [
        "Enter 17-digit VIN to auto-decode factory specs and Canadian build data.",
        "Provide current odometer reading and upload standard exterior photos.",
        "Receive an instant market-backed wholesale estimate and reserve benchmark.",
      ],
    },
    {
      step: "02.",
      number: "STEP 02",
      title: "24h Live Dealer Bidding",
      subtitle: "1,400+ Canadian Licensed Buyers",
      image: "/illustrations/start-bid.png",
      alt: "Laptop terminal showing live dealer bidding exchange",
      accent: "text-primary", // Terracotta wine
      bulletPoints: [
        "Your vehicle enters our synchronized 24-hour sealed wholesale exchange.",
        "Vetted OMVIC, AMVIC, and VSA licensed dealerships compete simultaneously.",
        "Blind sealed-bid mechanics eliminate lowballing and maximize your cash payout.",
      ],
    },
    {
      step: "03.",
      number: "STEP 03",
      title: "Guaranteed Direct Payout",
      subtitle: "100% Free for Private Sellers",
      image: "/illustrations/get-paid.jpg",
      alt: "Happy seller receiving instant Interac direct deposit payment",
      accent: "text-secondary", // Pumpkin amber
      bulletPoints: [
        "Review final unsealed ledger and accept the highest winning dealer bid.",
        "Schedule convenient local vehicle drop-off or doorstep transporter pickup.",
        "Receive full Interac e-Transfer or certified bank draft before keys change hands.",
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative w-full bg-surface text-on-surface py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 border-t border-border-card/60 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* ========================================================================= */}
        {/* 1. Section Header: Clean, Centered Editorial Layout                        */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
        

          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-tight">
            How AutoNexa Works
          </h2>

          <p className="mt-4 font-body text-base sm:text-lg text-on-surface-variant font-normal leading-relaxed">
            Sell your vehicle directly to Canada&apos;s premier wholesale dealer network.
            No classified listing fatigue, zero private tire-kickers, and 100% free.
          </p>

          <div className="w-16 h-1 bg-secondary mx-auto mt-6 rounded-full" />
        </div>

        {/* ========================================================================= */}
        {/* 2. 3-Step Grid with Connecting Directional Flow Arrows                     */}
        {/* ========================================================================= */}
        <div className="relative">
          {/* Desktop Curved Directional Flow Line 1 (Step 1 -> Step 2) */}
          <div className="hidden lg:block absolute top-28 left-[31%] -translate-x-1/2 z-20 pointer-events-none">
            <svg
              width="100"
              height="40"
              viewBox="0 0 100 40"
              fill="none"
              className="text-secondary opacity-70"
            >
              <path
                d="M 5,25 Q 50,5 92,20"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
              <path
                d="M 85,13 L 95,21 L 87,27"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Desktop Curved Directional Flow Line 2 (Step 2 -> Step 3) */}
          <div className="hidden lg:block absolute top-28 left-[65%] -translate-x-1/2 z-20 pointer-events-none">
            <svg
              width="100"
              height="40"
              viewBox="0 0 100 40"
              fill="none"
              className="text-secondary opacity-70"
            >
              <path
                d="M 5,25 Q 50,5 92,20"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
              <path
                d="M 85,13 L 95,21 L 87,27"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* 3 Columns (Cardless Minimalism: Borderless, Floating, Stylish) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 relative z-10">
            {steps.map((item) => (
              <div
                key={item.number}
                className="flex flex-col group"
              >
                {/* 1. Plain Stylish Illustration Image (No box borders, clean rounded frame) */}
                <div className="relative h-60 sm:h-64 w-full rounded-2xl overflow-hidden bg-surface-container/60 shadow-xs group-hover:shadow-md transition-all duration-300">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
                  />
                </div>

                {/* 2. Bold Color Index Numeral & Step Title (Styled like About AutoNexa) */}
                <div className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`font-headline text-3xl sm:text-4xl font-black tracking-tight leading-none select-none ${item.accent}`}
                    >
                      {item.step}
                    </span>
                    <span className="font-body text-xs font-bold uppercase tracking-widest text-on-surface-variant/80">
                      {item.number}
                    </span>
                  </div>

                  <h3 className="font-headline text-xl sm:text-2xl font-bold text-on-surface tracking-tight leading-snug">
                    {item.title}
                  </h3>
                  <p className="font-body text-xs font-semibold text-primary mt-0.5 mb-3">
                    {item.subtitle}
                  </p>

                  {/* Horizontal Line Divider */}
                  <div className="border-t border-border-card/70 mb-4" />

                  {/* 3. Bulleted Feature List (Clean and unboxed as in reference) */}
                  <ul className="space-y-3">
                    {item.bulletPoints.map((bullet, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface font-normal leading-relaxed"
                      >
                        <CheckCircle
                          weight="fill"
                          className="w-4 h-4 text-success shrink-0 mt-0.5"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Wide Flow Swoosh Arrow Across Bottom (Matching User Reference)          */}
        {/* ========================================================================= */}
        <div className="hidden md:block w-full max-w-4xl mx-auto my-12 pointer-events-none">
          <svg
            viewBox="0 0 800 60"
            fill="none"
            className="w-full text-secondary opacity-60"
          >
            <path
              d="M 50,45 Q 400,5 750,35"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              strokeLinecap="round"
            />
            <path
              d="M 740,25 L 755,36 L 742,46"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* ========================================================================= */}
        {/* 4. Bottom Centered Conversion CTA Button                                   */}
        {/* ========================================================================= */}
        <div className="mt-12 sm:mt-16 text-center flex flex-col items-center justify-center">
          <a
            href="#valuation"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-body text-sm sm:text-base font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.98] group cursor-pointer"
          >
            <span>Start Your Free Appraisal</span>
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
