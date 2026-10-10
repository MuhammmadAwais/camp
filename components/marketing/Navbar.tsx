"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // Animation Refs
  const navbarPillRef = React.useRef<HTMLDivElement>(null);
  const emblemRef = React.useRef<HTMLAnchorElement>(null);
  const emblemIconRef = React.useRef<HTMLDivElement>(null);
  const navContainerRef = React.useRef<HTMLDivElement>(null);
  const gliderRef = React.useRef<HTMLDivElement>(null);
  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const ctaPillRef = React.useRef<HTMLAnchorElement>(null);
  const ctaArrowRef = React.useRef<HTMLSpanElement>(null);

  // Scroll detection to adapt pill elevation without glows
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Initial gentle entrance animation
  React.useEffect(() => {
    if (navbarPillRef.current) {
      gsap.fromTo(
        navbarPillRef.current,
        { y: -24, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out", delay: 0.05 }
      );
    }
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "#about" },
    { label: "Auctions", href: "#explore" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Valuation", href: "#valuation" },
  ];

  // 1. Left Emblem Hover: Professional 3D Gyroscope Tumbling Flip (Clean, No Glow)
  const handleEmblemEnter = () => {
    if (emblemIconRef.current) {
      gsap.killTweensOf(emblemIconRef.current);
      gsap.to(emblemIconRef.current, {
        rotationY: "+=360",
        scale: 1.15,
        duration: 0.65,
        ease: "power2.out",
      });
    }
    if (emblemRef.current) {
      gsap.to(emblemRef.current, {
        scale: 1.05,
        duration: 0.25,
        ease: "power2.out",
      });
    }
  };

  const handleEmblemLeave = () => {
    if (emblemIconRef.current) {
      gsap.to(emblemIconRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
    if (emblemRef.current) {
      gsap.to(emblemRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  // 2. Center Nav Item Hover: 3D Vertical Cylinder Text Flip & Matte Sliding Glider
  const handleLinkEnter = (index: number, e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = linkRefs.current[index];
    if (!el) return;

    const topText = el.querySelector<HTMLElement>(".nav-text-top");
    const bottomText = el.querySelector<HTMLElement>(".nav-text-bottom");

    if (topText && bottomText) {
      gsap.killTweensOf([topText, bottomText]);

      // 3D kinetic rolling cylinder flip
      gsap.to(topText, {
        rotateX: 90,
        yPercent: -100,
        opacity: 0,
        duration: 0.32,
        ease: "power2.inOut",
      });

      gsap.to(bottomText, {
        rotateX: 0,
        yPercent: 0,
        opacity: 1,
        duration: 0.32,
        ease: "power2.inOut",
      });
    }

    // Move matte sliding glider
    if (gliderRef.current && navContainerRef.current) {
      const navRect = navContainerRef.current.getBoundingClientRect();
      const linkRect = el.getBoundingClientRect();
      const xPos = linkRect.left - navRect.left;
      const width = linkRect.width;

      gsap.killTweensOf(gliderRef.current);
      gsap.to(gliderRef.current, {
        x: xPos,
        width: width,
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power3.out",
      });
    }
  };

  const handleLinkLeave = (index: number) => {
    const el = linkRefs.current[index];
    if (!el) return;

    const topText = el.querySelector<HTMLElement>(".nav-text-top");
    const bottomText = el.querySelector<HTMLElement>(".nav-text-bottom");

    if (topText && bottomText) {
      gsap.killTweensOf([topText, bottomText]);

      gsap.to(topText, {
        rotateX: 0,
        yPercent: 0,
        opacity: 1,
        duration: 0.32,
        ease: "power2.inOut",
      });

      gsap.to(bottomText, {
        rotateX: -90,
        yPercent: 100,
        opacity: 0,
        duration: 0.32,
        ease: "power2.inOut",
      });
    }
  };

  const handleNavContainerLeave = () => {
    if (gliderRef.current) {
      gsap.to(gliderRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.25,
        ease: "power2.in",
      });
    }
  };

  // 3. Right CTA Button Hover: Clean 3D Text Roll & Arrow Rotation (No Glow)
  const handleCtaEnter = () => {
    const top = ctaPillRef.current?.querySelector<HTMLElement>(".cta-text-top");
    const btm = ctaPillRef.current?.querySelector<HTMLElement>(".cta-text-bottom");

    if (top && btm) {
      gsap.killTweensOf([top, btm]);
      gsap.to(top, {
        rotateX: 90,
        yPercent: -100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
      gsap.to(btm, {
        rotateX: 0,
        yPercent: 0,
        opacity: 1,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }

    if (ctaArrowRef.current) {
      gsap.to(ctaArrowRef.current, {
        rotation: 45,
        scale: 1.15,
        duration: 0.28,
        ease: "power2.out",
      });
    }

    if (ctaPillRef.current) {
      gsap.to(ctaPillRef.current, {
        scale: 1.03,
        duration: 0.22,
        ease: "power2.out",
      });
    }
  };

  const handleCtaLeave = () => {
    const top = ctaPillRef.current?.querySelector<HTMLElement>(".cta-text-top");
    const btm = ctaPillRef.current?.querySelector<HTMLElement>(".cta-text-bottom");

    if (top && btm) {
      gsap.killTweensOf([top, btm]);
      gsap.to(top, {
        rotateX: 0,
        yPercent: 0,
        opacity: 1,
        duration: 0.3,
        ease: "power2.inOut",
      });
      gsap.to(btm, {
        rotateX: -90,
        yPercent: 100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }

    if (ctaArrowRef.current) {
      gsap.to(ctaArrowRef.current, {
        rotation: 0,
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
      });
    }

    if (ctaPillRef.current) {
      gsap.to(ctaPillRef.current, {
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
      });
    }
  };

  return (
    <header className="fixed top-4 sm:top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* Floating Pill Capsule in App Decided Dark Canvas Token (#201B11) */}
      <div
        ref={navbarPillRef}
        className={`pointer-events-auto max-w-fit flex items-center gap-2 sm:gap-3.5 p-1.5 sm:p-2 rounded-full transition-all duration-300 ${
          scrolled
            ? "bg-[#201B11]/95 backdrop-blur-2xl border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
            : "bg-[#201B11]/90 backdrop-blur-xl border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        }`}
      >
        {/* ========================================================================= */}
        {/* 1. Left White Circle: Official AutoNexa Gold Logo with GSAP 3D Spin       */}
        {/* ========================================================================= */}
        <Link
          href="/"
          ref={emblemRef}
          onMouseEnter={handleEmblemEnter}
          onMouseLeave={handleEmblemLeave}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-surface border border-border-card/40 flex items-center justify-center shadow-xs shrink-0 transition-transform cursor-pointer"
          aria-label="AutoNexa Home"
        >
          <div
            ref={emblemIconRef}
            className="relative w-7 h-4 sm:w-8 sm:h-4.5 flex items-center justify-center transition-transform"
            style={{ perspective: "400px" }}
          >
            <Image
              src="/logo-mark.webp"
              alt="AutoNexa Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* ========================================================================= */}
        {/* 2. Center Nav Links: 3D Kinetic Roll in Autumn Palette + Matte Glider     */}
        {/* ========================================================================= */}
        <nav
          ref={navContainerRef}
          onMouseLeave={handleNavContainerLeave}
          className="relative hidden md:flex items-center gap-1 sm:gap-1.5 px-1 py-0.5"
        >
          {/* Crisp Matte Glider (No Colored Glows) */}
          <div
            ref={gliderRef}
            className="absolute top-0.5 bottom-0.5 left-0 rounded-full bg-white/[0.08] border border-white/15 pointer-events-none opacity-0"
            style={{ width: 0 }}
          />

          {navLinks.map((link, idx) => (
            <a
              key={link.label}
              href={link.href}
              ref={(el) => {
                linkRefs.current[idx] = el;
              }}
              onMouseEnter={(e) => handleLinkEnter(idx, e)}
              onMouseLeave={() => handleLinkLeave(idx)}
              className="relative px-3.5 sm:px-4 py-2 rounded-full cursor-pointer flex items-center justify-center select-none z-10"
            >
              {/* 3D Perspective Roll Container */}
              <div
                className="relative overflow-hidden h-5 flex flex-col justify-center"
                style={{ perspective: "450px" }}
              >
                {/* Resting State: Warm Oat Surface Text */}
                <span
                  className="nav-text-top block font-body text-xs sm:text-sm font-semibold tracking-wide text-surface/85"
                  style={{ transformOrigin: "50% 50% -10px" }}
                >
                  {link.label}
                </span>

                {/* Hover State: Autumn Honey Amber Secondary Accent */}
                <span
                  className="nav-text-bottom absolute inset-0 flex items-center justify-center font-body text-xs sm:text-sm font-bold tracking-wide text-secondary whitespace-nowrap"
                  style={{
                    transformOrigin: "50% 50% -10px",
                    transform: "rotateX(-90deg) translateY(100%)",
                    opacity: 0,
                  }}
                >
                  {link.label}
                </span>
              </div>
            </a>
          ))}
        </nav>

        {/* ========================================================================= */}
        {/* 3. Right Action Pill Button: Color Palette + Arrow Tilt (No Glow)         */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden md:inline-flex px-3 py-2 rounded-full font-body text-sm font-semibold text-surface/85 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            Sign in
          </Link>
          <a
            href="#valuation"
            ref={ctaPillRef}
            onMouseEnter={handleCtaEnter}
            onMouseLeave={handleCtaLeave}
            className="relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-surface text-on-surface border border-border-card/40 font-body text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 shrink-0 cursor-pointer overflow-hidden group select-none transition-colors hover:border-primary/40"
          >
            {/* 3D Kinetic Roll inside CTA */}
            <div
              className="relative overflow-hidden h-4.5 flex flex-col justify-center"
              style={{ perspective: "400px" }}
            >
              <span className="cta-text-top block text-on-surface whitespace-nowrap font-bold">
                Get Free Appraisal
              </span>
              <span
                className="cta-text-bottom absolute inset-0 flex items-center justify-center text-primary font-extrabold whitespace-nowrap"
                style={{
                  transformOrigin: "50% 50% -10px",
                  transform: "rotateX(-90deg) translateY(100%)",
                  opacity: 0,
                }}
              >
                Instant 48h Offer ✦
              </span>
            </div>

            {/* Rotating Arrow in Signature Brand Wine Red Accent */}
            <span ref={ctaArrowRef} className="text-primary flex items-center justify-center">
              <ArrowUpRight
                weight="bold"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              />
            </span>
          </a>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full text-surface/85 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto md:hidden fixed top-20 left-4 right-4 mx-auto max-w-sm rounded-3xl bg-[#201B11]/98 backdrop-blur-2xl border border-white/15 p-5 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-250">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl font-body text-sm font-semibold text-surface/85 hover:text-secondary hover:bg-white/5 transition-all flex items-center justify-between"
              >
                <span>{link.label}</span>
                <span className="text-secondary/70 text-xs font-mono">0{navLinks.indexOf(link) + 1}</span>
              </a>
            ))}
          </nav>

          <div className="pt-4 mt-3 border-t border-white/10 flex flex-col gap-2.5">
            <a
              href="#valuation"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-3 rounded-full bg-surface text-on-surface font-bold text-xs uppercase tracking-wider shadow-xs hover:bg-primary hover:text-white transition-colors"
            >
              Get Free Appraisal ↗
            </a>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-3 rounded-full border border-white/15 text-surface font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              Seller sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
