"use client";

import * as React from "react";
import Link from "next/link";
import { AutoNexaPhysicsCanvas } from "./AutoNexaPhysicsCanvas";
import { ArrowUpRight, ShieldCheck } from "@phosphor-icons/react";

export function Footer() {
  return (
    <footer className="relative w-full bg-[#0A0807] text-white pt-20 sm:pt-28 pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Soft Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-secondary/10 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ========================================================================= */}
        {/* 1. Top Hero Prompt: Massive "READY TO SELL?" (Matching Image 2)           */}
        {/* ========================================================================= */}
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-24">
          <h2 className="font-headline text-5xl sm:text-7xl md:text-8xl lg:text-[104px] font-black tracking-tight text-white leading-none">
            READY TO SELL?
          </h2>

          <div className="mt-8 sm:mt-10 flex justify-center">
            <a
              href="#valuation"
              className="inline-flex items-center justify-center rounded-full bg-secondary px-8 sm:px-11 py-4 font-body font-bold text-on-surface shadow-[0_0_35px_rgba(229,147,68,0.55)] transition-all duration-300 hover:bg-secondary/90 hover:scale-105 hover:shadow-[0_0_55px_rgba(229,147,68,0.85)] active:scale-95 text-base sm:text-lg"
            >
              Get Your Free Appraisal
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. Four-Column Directory Grid (Matching Image 2 Structure)                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-14 pb-16 sm:pb-20 border-b border-white/10">
          {/* Column 1: Contact */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50 mb-5">
              Contact
            </h3>
            <ul className="space-y-3 font-body text-sm text-white/80">
              <li>
                <a
                  href="mailto:support@autonexa.ca"
                  className="hover:text-secondary transition-colors"
                >
                  support@autonexa.ca
                </a>
              </li>
              <li>
                <a
                  href="tel:18884288669"
                  className="hover:text-secondary transition-colors"
                >
                  +1 (888) 428-8669
                </a>
              </li>
              <li className="text-white/60">
                Toronto, ON &amp; Vancouver, BC
              </li>
              <li className="text-white/60">Canada</li>
            </ul>
          </div>

          {/* Column 2: Platform */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50 mb-5">
              Platform
            </h3>
            <ul className="space-y-3 font-body text-sm text-white/80">
              <li>
                <a href="#how-it-works" className="hover:text-secondary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-secondary transition-colors">
                  Sealed Bidding Engine
                </a>
              </li>
              <li>
                <a href="#valuation" className="hover:text-secondary transition-colors">
                  Instant VIN Valuation
                </a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-secondary transition-colors">
                  Why AutoNexa
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50 mb-5">
              Company
            </h3>
            <ul className="space-y-3 font-body text-sm text-white/80">
              <li>
                <a href="#about" className="hover:text-secondary transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#dealer-terminal" className="hover:text-secondary transition-colors inline-flex items-center gap-1">
                  <span>Dealer Network</span>
                  <ArrowUpRight weight="bold" className="w-3.5 h-3.5 text-white/40" />
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-secondary transition-colors">
                  Seller Stories
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-secondary transition-colors">
                  Support &amp; FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Compliance */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50 mb-5">
              Legal &amp; Trust
            </h3>
            <ul className="space-y-3 font-body text-sm text-white/80">
              <li>
                <Link href="/legal/privacy" className="hover:text-secondary transition-colors">
                  Privacy Policy (PIPEDA)
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-secondary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-white/60 text-xs leading-relaxed block">
                  OMVIC (ON) • AMVIC (AB) • VSA (BC) Certified
                </span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                <ShieldCheck weight="fill" className="w-4 h-4 shrink-0" />
                <span>Quebec Law 25 Compliant</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Interactive Physics Dot-Matrix Brand Display (Images 3, 4, 5)          */}
        {/* ========================================================================= */}
        <div className="pt-8 sm:pt-10 pb-4">
          <div className="flex items-center justify-between text-xs font-mono text-white/40 mb-3 px-2">
            <span>INTERACTIVE FLEET TELEMETRY</span>
            <span className="hidden sm:inline">HOVER TO DISPERSE BEADS</span>
          </div>

          <AutoNexaPhysicsCanvas />
        </div>

        {/* ========================================================================= */}
        {/* 4. Bottom Copyright & Regulatory Footnote                                 */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-body text-white/45">
          <p>© 2026 AutoNexa Technologies Inc. All rights reserved. Registered Canadian Marketplace.</p>
          <p className="font-mono text-[11px]">Designed with Autumn Editorial system</p>
        </div>
      </div>
    </footer>
  );
}
