"use client";

import * as React from "react";
import { XCircle, CheckCircle, ArrowRight } from "@phosphor-icons/react";

interface ComparisonCardsProps {
  id?: string;
}

export function ComparisonCards({ id = "why-us" }: ComparisonCardsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState<"autonexa" | "traditional">("autonexa");

  // Symmetrical 3D Tilt State for Card 1 (Traditional Approach):
  // Resting: pitch back 2°, yaw inward +3°
  const [traditionalTilt, setTraditionalTilt] = React.useState({
    rotateX: 2,
    rotateY: 3,
    glareX: 50,
    glareY: 50,
    isHovered: false,
  });

  // Symmetrical 3D Tilt State for Card 2 (AutoNexa Platform):
  // Resting: pitch back 2°, yaw inward -3°
  const [autonexaTilt, setAutonexaTilt] = React.useState({
    rotateX: 2,
    rotateY: -3,
    glareX: 50,
    glareY: 50,
    isHovered: false,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleTraditionalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 7;
    const rotateY = ((x - centerX) / centerX) * 7;

    setTraditionalTilt({
      rotateX,
      rotateY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      isHovered: true,
    });
  };

  const handleTraditionalMouseLeave = () => {
    // Return gracefully to symmetrical resting state
    setTraditionalTilt({
      rotateX: 2,
      rotateY: 3,
      glareX: 50,
      glareY: 50,
      isHovered: false,
    });
  };

  const handleAutonexaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 7;
    const rotateY = ((x - centerX) / centerX) * 7;

    setAutonexaTilt({
      rotateX,
      rotateY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      isHovered: true,
    });
  };

  const handleAutonexaMouseLeave = () => {
    // Return gracefully to symmetrical resting state
    setAutonexaTilt({
      rotateX: 2,
      rotateY: -3,
      glareX: 50,
      glareY: 50,
      isHovered: false,
    });
  };

  const challenges = [
    {
      title: "Predatory trade-in lowballing",
      description: "Showrooms offer wholesale minimums to protect their own 20%+ retail margin.",
    },
    {
      title: "Strangers at your driveway",
      description: "Unverified private buyers taking unsupervised test drives from your home address.",
    },
    {
      title: "Endless ghosting & marketplace scams",
      description: "Weeks wasted dealing with tire-kickers, fake buyer profiles, and counterfeit e-transfers.",
    },
    {
      title: "Aggressive desk negotiations",
      description: "Hours trapped in dealership finance offices disputing surprise reconditioning deductions.",
    },
    {
      title: "Payment default & title risks",
      description: "High-risk certified bank draft frauds and delayed loan payout complications.",
    },
    {
      title: "Time-consuming and zero leverage",
      description: "You negotiate against one single buyer instead of letting hundreds compete for you.",
    },
  ];

  const solutions = [
    {
      title: "1,400+ Canadian dealers compete blindly",
      description: "Licensed stores submit sealed, upward-competing bids to capture fresh local inventory.",
    },
    {
      title: "100% private & anonymous",
      description: "Your phone number and physical address are strictly concealed from competing dealers.",
    },
    {
      title: "Strict 24-hour sealed auction clock",
      description: "Every vehicle achieves true wholesale market equity with a binding timeline.",
    },
    {
      title: "Zero negotiation or showroom haggling",
      description: "What dealers bid is what you receive. You review the unsealed ledger and choose.",
    },
    {
      title: "Guaranteed certified dealer funds",
      description: "Payment issued on the spot via certified dealer draft or wire upon simple 15-min drop-off.",
    },
    {
      title: "100% free with zero obligation",
      description: "Private sellers never pay a penny. If no offer meets your expectation, walk away free.",
    },
  ];

  return (
    <section
      id={id}
      className="relative w-full bg-surface text-on-surface py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        {/* ========================================================================= */}
        {/* Section Header                                                           */}
        {/* ========================================================================= */}
        <div data-reveal="header" className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight text-on-surface leading-[1.12]">
            Dealerships negotiate down.
            <br />
            <span className="text-primary font-bold">AutoNexa makes 1,400+ bid up.</span>
          </h2>
          <p className="mt-4 font-body text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Traditional trade-ins cost Canadians an estimated $2,850 in lost equity. Classifieds invite scams and tire-kickers. AutoNexa brings the closed dealer wholesale auction directly to you.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* Desktop Split Header Bar (Hidden on Mobile)                               */}
        {/* ========================================================================= */}
        <div data-reveal="fade-up" className="hidden lg:grid w-full rounded-2xl overflow-hidden border border-border-card shadow-xs grid-cols-2 mb-8 lg:mb-10">
          <div className="py-4 px-6 bg-surface-container text-center text-on-surface font-headline font-bold text-base tracking-tight border-r border-border-card/70 flex items-center justify-center">
            Traditional Approach
          </div>
          <div className="py-4 px-6 bg-primary text-white text-center font-headline font-bold text-base tracking-tight flex items-center justify-center gap-2.5">
            <span>AutoNexa Platform</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Mobile Interactive Segmented Switcher (Visible < 1024px)                  */}
        {/* ========================================================================= */}
        <div className="lg:hidden flex items-center justify-center mb-6">
          <div className="inline-flex p-1 rounded-2xl bg-surface-container border border-border-card shadow-xs w-full max-w-sm">
            <button
              type="button"
              onClick={() => setMobileTab("autonexa")}
              className={`flex-1 py-2.5 px-3 min-h-[44px] rounded-xl font-body text-xs sm:text-sm font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                mobileTab === "autonexa"
                  ? "bg-primary text-white shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>AutoNexa Platform</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("traditional")}
              className={`flex-1 py-2.5 px-3 min-h-[44px] rounded-xl font-body text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
                mobileTab === "traditional"
                  ? "bg-surface-container-highest text-on-surface shadow-xs font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Traditional Approach
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Two-Column Comparison Cards (Symmetrical 3D Perspectives)                 */}
        {/* ========================================================================= */}
        <div
          ref={containerRef}
          data-reveal="stagger-group"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch [perspective:1200px]"
        >
          {/* Subtle cursor spotlight */}
          {isHovered && (
            <div
              className="pointer-events-none absolute -inset-px rounded-3xl opacity-35 transition-opacity duration-300 hidden lg:block"
              style={{
                background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(140, 56, 62, 0.08), transparent 70%)`,
              }}
            />
          )}

          {/* ======================================================================= */}
          {/* Column 1: Traditional Approach (Symmetrical 3D Inward Tilt)              */}
          {/* ======================================================================= */}
          <div data-reveal="card" className={`flex-col ${mobileTab === "traditional" ? "flex" : "hidden lg:flex"}`}>
            <div
              onMouseMove={handleTraditionalMouseMove}
              onMouseLeave={handleTraditionalMouseLeave}
              className="relative flex-1 flex flex-col justify-between rounded-3xl bg-surface-container-low border border-border-card/90 p-5 sm:p-8 lg:p-10 shadow-xs transition-transform ease-out will-change-transform overflow-hidden"
              style={{
                transform: `perspective(1000px) rotateX(${traditionalTilt.rotateX}deg) rotateY(${traditionalTilt.rotateY}deg) ${
                  traditionalTilt.isHovered ? "scale3d(1.02, 1.02, 1.02)" : "scale3d(1, 1, 1)"
                }`,
                transitionDuration: traditionalTilt.isHovered ? "100ms" : "600ms",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Dynamic glare sheen that appears on hover */}
              {traditionalTilt.isHovered && (
                <div
                  className="pointer-events-none absolute -inset-px rounded-3xl opacity-25 transition-opacity duration-300 z-10"
                  style={{
                    background: `radial-gradient(450px circle at ${traditionalTilt.glareX}% ${traditionalTilt.glareY}%, rgba(255, 255, 255, 0.6), transparent 70%)`,
                  }}
                />
              )}

              <div className="relative z-20">
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-error/10 text-error border border-error/20 font-mono text-[10.5px] font-bold uppercase tracking-wider">
                    Traditional Dealership
                  </span>
                  <span className="font-mono text-[10.5px] text-on-surface-variant/70">Trade-In Friction</span>
                </div>

                <span className="block font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/75 mb-6">
                  CHALLENGES &amp; FRICTION
                </span>

                <ul className="space-y-6">
                  {challenges.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3.5">
                      <XCircle weight="fill" className="w-5 h-5 mt-0.5 shrink-0 text-error" />
                      <div>
                        <p className="font-headline font-bold text-sm sm:text-[15px] text-on-surface leading-tight">
                          {item.title}
                        </p>
                        <p className="mt-1 font-body text-xs sm:text-[13px] text-on-surface-variant leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="relative z-20 mt-8 pt-6 border-t border-border-card/60 flex items-center justify-between text-xs font-mono text-on-surface-variant">
                  <span>Avg Timeline: 3–6 Weeks</span>
                  <span className="text-error font-semibold">Low Price Certainty</span>
                </div>

                <div className="lg:hidden mt-4 pt-3 border-t border-border-card/40 text-center">
                  <button
                    type="button"
                    onClick={() => setMobileTab("autonexa")}
                    className="w-full py-2.5 text-xs font-body font-bold text-primary hover:text-primary-hover transition-colors cursor-pointer"
                  >
                    See how AutoNexa solves this &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* Column 2: AutoNexa Platform (Symmetrical 3D Inward Tilt)                 */}
          {/* ======================================================================= */}
          <div data-reveal="card" className={`flex-col ${mobileTab === "autonexa" ? "flex" : "hidden lg:flex"}`}>
            <div
              onMouseMove={handleAutonexaMouseMove}
              onMouseLeave={handleAutonexaMouseLeave}
              className="relative flex-1 flex flex-col justify-between rounded-3xl bg-surface-container-lowest border-2 border-primary/25 p-5 sm:p-8 lg:p-10 shadow-[0_16px_40px_-10px_rgba(140,56,62,0.08)] transition-transform ease-out will-change-transform overflow-hidden"
              style={{
                transform: `perspective(1000px) rotateX(${autonexaTilt.rotateX}deg) rotateY(${autonexaTilt.rotateY}deg) ${
                  autonexaTilt.isHovered ? "scale3d(1.02, 1.02, 1.02)" : "scale3d(1, 1, 1)"
                }`,
                transitionDuration: autonexaTilt.isHovered ? "100ms" : "600ms",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Dynamic glare sheen that appears on hover */}
              {autonexaTilt.isHovered && (
                <div
                  className="pointer-events-none absolute -inset-px rounded-3xl opacity-35 transition-opacity duration-300 z-10"
                  style={{
                    background: `radial-gradient(450px circle at ${autonexaTilt.glareX}% ${autonexaTilt.glareY}%, rgba(255, 255, 255, 0.45), transparent 70%)`,
                  }}
                />
              )}

              <div className="relative z-20">
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono text-[10.5px] font-bold uppercase tracking-wider">
                    AutoNexa Platform
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold text-emerald-600">
                    <CheckCircle weight="fill" className="w-3.5 h-3.5 text-success" /> 1,400+ Dealer Bids
                  </span>
                </div>

                <span className="block font-mono text-[11px] font-bold uppercase tracking-widest text-primary mb-6">
                  OUR SOLUTION
                </span>

                <ul className="space-y-6">
                  {solutions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3.5">
                      <CheckCircle weight="fill" className="w-5 h-5 mt-0.5 shrink-0 text-success" />
                      <div>
                        <p className="font-headline font-bold text-sm sm:text-[15px] text-on-surface leading-tight">
                          {item.title}
                        </p>
                        <p className="mt-1 font-body text-xs sm:text-[13px] text-on-surface-variant leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="relative z-20 mt-8 pt-6 border-t border-border-card/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-xs font-mono text-on-surface-variant flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span>Timeline: 24h Payout</span>
                  </div>

                  <a
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-full bg-primary hover:bg-primary-hover text-white font-body text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 shadow-xs hover:scale-105 active:scale-95"
                  >
                    <span>Get Instant Valuation</span>
                    <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="lg:hidden mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setMobileTab("traditional")}
                    className="text-xs font-body font-medium text-on-surface-variant hover:text-on-surface underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    Compare with traditional dealership risks
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
