"use client";

import * as React from "react";
import Image from "next/image";
import { Check, X, ArrowRight } from "@phosphor-icons/react";

interface ComparisonMatrixProps {
  id?: string;
}

interface MatrixRow {
  feature: string;
  autonexa: {
    status: "check" | "cross" | "text";
    text?: string;
  };
  tradeIn: {
    status: "check" | "cross" | "text";
    text?: string;
  };
  classifieds: {
    status: "check" | "cross" | "text";
    text?: string;
  };
}

export function ComparisonMatrix({ id = "matrix" }: ComparisonMatrixProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const rows: MatrixRow[] = [
    {
      feature: "Wholesale dealer bidding network",
      autonexa: { status: "text", text: "1,400+ Verified Stores" },
      tradeIn: { status: "text", text: "1 Single Dealership" },
      classifieds: { status: "text", text: "Retail Only" },
    },
    {
      feature: "Blind sealed bidding (zero price suppression)",
      autonexa: { status: "check" },
      tradeIn: { status: "cross" },
      classifieds: { status: "cross" },
    },
    {
      feature: "Zero showroom haggling or desk deductions",
      autonexa: { status: "check" },
      tradeIn: { status: "text", text: "High Pressure" },
      classifieds: { status: "cross" },
    },
    {
      feature: "Strict 24-hour locked sale timeline",
      autonexa: { status: "text", text: "24 Hours" },
      tradeIn: { status: "text", text: "1–3 Days" },
      classifieds: { status: "text", text: "3–6 Weeks" },
    },
    {
      feature: "Complete phone number & home address privacy",
      autonexa: { status: "text", text: "100% Private" },
      tradeIn: { status: "text", text: "Partial" },
      classifieds: { status: "cross", text: "Public DMs" },
    },
    {
      feature: "No unsupervised driveway test drives",
      autonexa: { status: "check" },
      tradeIn: { status: "check" },
      classifieds: { status: "cross" },
    },
    {
      feature: "Guaranteed certified dealer bank draft on drop-off",
      autonexa: { status: "check" },
      tradeIn: { status: "check" },
      classifieds: { status: "text", text: "High Risk" },
    },
    {
      feature: "OMVIC, AMVIC & VSA regulatory compliance",
      autonexa: { status: "check" },
      tradeIn: { status: "check" },
      classifieds: { status: "cross", text: "Unregulated" },
    },
    {
      feature: "Private seller service fees & deductions",
      autonexa: { status: "text", text: "0% Free" },
      tradeIn: { status: "text", text: "Hidden (-18%)" },
      classifieds: { status: "text", text: "$50–$150" },
    },
    {
      feature: "Average net seller payout advantage",
      autonexa: { status: "text", text: "+$2,850 CAD" },
      tradeIn: { status: "text", text: "Wholesale Minimum" },
      classifieds: { status: "text", text: "Uncertain" },
    },
  ];

  return (
    <section
      id={id}
      className="relative w-full bg-surface text-on-surface py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 border-t border-border-card/60 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        {/* ========================================================================= */}
        {/* Editorial Headline Lockup                                                */}
        {/* ========================================================================= */}
        <div data-reveal="header" className="text-left max-w-3xl mb-12 sm:mb-16">
      
          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight text-on-surface leading-[1.08]">
            Other platforms haggle.
            <br />
            <span className="text-primary font-bold">AutoNexa competes.</span>
          </h2>
          <p className="mt-3.5 font-body text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            A side-by-side audit of how Canada&apos;s 24-hour sealed wholesale marketplace protects your equity against conventional trade-ins and classifieds.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* Full-Column Comparison Matrix (Matching Reference Image 5 - CodeAxe)      */}
        {/* ========================================================================= */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative max-w-5xl mx-auto px-2 sm:px-6"
        >
          {/* Subtle cursor spotlight */}
          {isHovered && (
            <div
              className="pointer-events-none absolute -inset-px rounded-3xl opacity-30 transition-opacity duration-300 hidden lg:block"
              style={{
                background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(140, 56, 62, 0.07), transparent 70%)`,
              }}
            />
          )}

          {/* ======================================================================= */}
          {/* Continuous Full-Height AutoNexa Column Card (NO PILLS / NO BOXES)       */}
          {/* ======================================================================= */}
          <div className="hidden md:grid grid-cols-12 gap-6 absolute inset-0 pointer-events-none z-0 px-4 sm:px-6">
            <div className="col-start-6 col-span-3 -my-5 rounded-3xl bg-surface-container-lowest border-2 border-primary/25 shadow-[0_20px_50px_-12px_rgba(140,56,62,0.12)]" />
          </div>

          {/* Mobile Swipe Hint */}
          <div className="md:hidden flex items-center justify-between text-xs text-on-surface-variant font-mono mb-3 px-1">
            <span className="flex items-center gap-1.5">
              <span>Swipe columns to compare</span>
              <ArrowRight weight="bold" className="w-3.5 h-3.5 text-primary" />
            </span>
            <span className="font-bold text-primary">AutoNexa Platform</span>
          </div>

          {/* Table Content Layer (Unified Columns Across All Screens) */}
          <div data-reveal="matrix-table" className="relative z-10 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[620px] md:min-w-0">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 sm:gap-6 pb-6 pt-3 items-center border-b border-border-card/60">
                <div className="col-span-5 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-on-surface-variant/70 pl-2">
                  CRITERIA &amp; SAFETY GUARANTEES
                </div>

                {/* AutoNexa Column Header */}
                <div className="col-span-3 text-center flex flex-col items-center justify-center gap-1.5">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                    <Image
                      src="/logo-mark.webp"
                      alt="AutoNexa Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <span className="font-headline font-bold text-xs sm:text-sm text-primary">AutoNexa</span>
                </div>

                {/* Dealership Trade-In */}
                <div className="col-span-2 text-center flex flex-col items-center justify-center gap-1">
                  <span className="font-headline font-bold text-xs sm:text-sm tracking-tight text-on-surface">
                    Dealership
                  </span>
                  <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-on-surface-variant/60">
                    Trade-In
                  </span>
                </div>

                {/* Classifieds */}
                <div className="col-span-2 text-center flex flex-col items-center justify-center gap-1">
                  <span className="font-headline font-bold text-xs sm:text-sm tracking-tight text-on-surface">
                    Classifieds
                  </span>
                  <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-on-surface-variant/60">
                    Private Sale
                  </span>
                </div>
              </div>

              {/* Matrix Rows */}
              <div>
                {rows.map((row, idx) => {
                  const isSurplusRow = idx === rows.length - 1;

                  return (
                    <div
                      key={idx}
                      data-reveal="matrix-row"
                      className="grid grid-cols-12 gap-3 sm:gap-6 py-3.5 sm:py-4.5 items-center border-b border-border-card/40 last:border-b-0 hover:bg-surface-container-low/30 rounded-xl px-2 transition-colors duration-150"
                    >
                      {/* Feature Label */}
                      <div className="col-span-5 font-body text-xs sm:text-sm font-semibold text-on-surface pr-2 sm:pr-4 pl-2">
                        {row.feature}
                      </div>

                      {/* AutoNexa Column Cell */}
                      <div className="col-span-3 text-center flex items-center justify-center px-1">
                        {row.autonexa.status === "check" ? (
                          <Check weight="bold" className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                        ) : (
                          <span
                            className={
                              isSurplusRow
                                ? "font-headline text-sm sm:text-base font-black text-primary"
                                : "font-body text-xs sm:text-sm font-bold text-primary"
                            }
                          >
                            {row.autonexa.text}
                          </span>
                        )}
                      </div>

                      {/* Dealership Trade-In Cell */}
                      <div className="col-span-2 text-center font-body text-xs sm:text-sm text-on-surface-variant px-1">
                        {row.tradeIn.status === "check" && (
                          <div className="flex justify-center text-success">
                            <Check weight="bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {row.tradeIn.status === "cross" && (
                          <div className="flex justify-center text-error">
                            <X weight="bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {row.tradeIn.text && (
                          <span className="font-body text-[11px] sm:text-sm font-medium">
                            {row.tradeIn.text}
                          </span>
                        )}
                      </div>

                      {/* Classifieds Cell */}
                      <div className="col-span-2 text-center font-body text-xs sm:text-sm text-on-surface-variant px-1">
                        {row.classifieds.status === "check" && (
                          <div className="flex justify-center text-success">
                            <Check weight="bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {row.classifieds.status === "cross" && (
                          <div className="flex justify-center text-error">
                            <X weight="bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {row.classifieds.text && (
                          <span className="font-body text-[11px] sm:text-sm font-medium">
                            {row.classifieds.text}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Action Trigger */}
          <div className="pt-8 text-center flex flex-col items-center justify-center gap-3">
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 min-h-[48px] rounded-xl bg-primary hover:bg-primary-hover text-white font-body text-sm font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
            >
              <span>Start 24h Auction</span>
              <ArrowRight weight="bold" className="w-4 h-4" />
            </a>
            <p className="font-mono text-xs text-on-surface-variant/70">
              100% Free for Private Sellers • No Obligation to Accept
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
