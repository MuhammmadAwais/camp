"use client";

import * as React from "react";
import Image from "next/image";

export function WhyUsSection() {
  const problems = [
    "Low trust in traditional dealer trade-in valuations",
    "Complex and unclear vehicle sales journey",
    "Aggressive dealership lowball tactics",
    "Lack of wholesale price transparency",
  ];

  const solutions = [
    "Built a trust-focused sealed-bid structure",
    "Simplified the 3-step private seller journey",
    "Certified condition HUD & transparent Carfax",
    "Algorithmic reserve pricing & 100% free payouts",
  ];

  return (
    <section
      id="why-us"
      className="relative w-full min-h-[900px] lg:min-h-[960px] xl:min-h-[1000px] bg-black text-white py-20 lg:py-0 px-4 sm:px-6 lg:px-12 overflow-hidden flex items-center"
    >
      {/* 1. Cinematic Background Car Silhouette (Why-Us.jfif) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/illustrations/Why-Us.jfif"
          alt="Why AutoNexa Car Silhouette"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center pointer-events-none"
        />
        {/* Subtle Edge Vignettes for smooth blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 pointer-events-none" />
      </div>

      <div className="max-w-[1500px] mx-auto w-full relative z-10">
        {/* ========================================================================= */}
        {/* Desktop Absolute Layout (Exact Reference Match on lg+ screens)           */}
        {/* ========================================================================= */}
        <div className="hidden lg:block relative w-full h-[840px] xl:h-[880px]">
          {/* Top-Right Corner Header Lockup: One-line title positioned in the top-right corner */}
          <div className="absolute top-8 sm:top-10 xl:top-12 right-2 sm:right-6 xl:right-12 text-right z-20">
            <h2 className="font-headline text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-white whitespace-nowrap leading-none">
              Why AutoNexa
            </h2>
            <p className="font-headline text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-secondary mt-3 whitespace-nowrap">
              Problems & Solutions
            </p>
            <div className="w-16 h-1 bg-secondary rounded-full mt-4 ml-auto" />
          </div>

          {/* Card 1: PROBLEMS (Bottom-left placement, generous size) */}
          <div className="absolute top-36 xl:top-40 left-0 xl:left-2 w-[470px] xl:w-[520px] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-9 xl:p-11 shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all hover:border-white/20">
            <span className="block text-xs font-mono tracking-widest text-white/50 uppercase font-semibold mb-6">
              PROBLEMS
            </span>
            <ul className="space-y-5 font-body text-base xl:text-[18px] text-white/95">
              {problems.map((item) => (
                <li key={item} className="flex items-start gap-3.5">
                  <span className="w-2 h-2 bg-white/70 mt-2 shrink-0 rounded-[1px]" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: SOLUTIONS (Offset lower and reaches middle) */}
          <div className="absolute top-[410px] xl:top-[440px] left-[230px] xl:left-[290px] w-[490px] xl:w-[540px] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-9 xl:p-11 shadow-[0_16px_50px_rgba(0,0,0,0.75)] transition-all hover:border-secondary/30 z-10">
            {/* Top-Right Key Asset: Positioned on the top-right corner of second card */}
            <div className="absolute -top-16 -right-6 xl:-top-20 xl:-right-8 w-36 h-44 xl:w-44 xl:h-52 pointer-events-none z-20">
              <Image
                src="/illustrations/why-us-top-key.png"
                alt="AutoNexa Key"
                fill
                className="object-contain drop-shadow-[0_16px_30px_rgba(0,0,0,0.9)] -rotate-12"
                priority
              />
            </div>

            <span className="block text-xs font-mono tracking-widest text-secondary uppercase font-semibold mb-6">
              SOLUTIONS
            </span>
            <ul className="space-y-5 font-body text-base xl:text-[18px] text-white/95">
              {solutions.map((item) => (
                <li key={item} className="flex items-start gap-3.5">
                  <span className="w-2 h-2 bg-secondary mt-2 shrink-0 rounded-[1px]" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Mobile / Tablet Responsive Layout (< lg screens)                          */}
        {/* ========================================================================= */}
        <div className="lg:hidden flex flex-col space-y-10">
          {/* Header Hierarchy */}
          <div className="text-left mb-2">
            <h2 className="font-headline text-3xl sm:text-4xl font-black tracking-tight text-white whitespace-nowrap leading-tight">
              Why AutoNexa
            </h2>
            <p className="font-headline text-xl sm:text-2xl font-bold tracking-tight text-secondary mt-2 whitespace-nowrap">
              Problems & Solutions
            </p>
            <div className="w-14 h-1 bg-secondary rounded-full mt-4" />
          </div>

          {/* Card 1: PROBLEMS */}
          <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-7 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
            <span className="block text-xs font-mono tracking-widest text-white/50 uppercase font-semibold mb-5">
              PROBLEMS
            </span>
            <ul className="space-y-4 font-body text-sm sm:text-base text-white/90">
              {problems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-white/70 mt-1.5 shrink-0 rounded-[1px]" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: SOLUTIONS with Key on Top-Right Corner */}
          <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-7 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative pt-10 sm:pt-8">
            {/* Key on top-right corner */}
            <div className="absolute -top-12 -right-2 sm:-top-16 sm:-right-4 w-28 h-36 sm:w-36 sm:h-44 pointer-events-none z-20">
              <Image
                src="/illustrations/why-us-top-key.png"
                alt="AutoNexa Key"
                fill
                className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)] -rotate-12"
                priority
              />
            </div>

            <span className="block text-xs font-mono tracking-widest text-secondary uppercase font-semibold mb-5">
              SOLUTIONS
            </span>
            <ul className="space-y-4 font-body text-sm sm:text-base text-white/90">
              {solutions.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-secondary mt-1.5 shrink-0 rounded-[1px]" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
