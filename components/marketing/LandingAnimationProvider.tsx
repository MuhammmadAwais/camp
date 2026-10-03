"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface LandingAnimationProviderProps {
  children: React.ReactNode;
}

export function LandingAnimationProvider({ children }: LandingAnimationProviderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Only run on client and if user hasn't requested reduced motion
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    // Scoped GSAP context ensures clean teardown on unmount
    const ctx = gsap.context(() => {
      // 1. Reveal Section Headers (Subtle lift + opacity fade)
      const headers = document.querySelectorAll<HTMLElement>('[data-reveal="header"]');
      headers.forEach((header) => {
        gsap.fromTo(
          header,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: header,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // 2. Reveal Staggered Card Clusters
      const staggerContainers = document.querySelectorAll<HTMLElement>('[data-reveal="stagger-group"]');
      staggerContainers.forEach((container) => {
        const cards = container.querySelectorAll<HTMLElement>('[data-reveal="card"]');
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            { y: 36, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: container,
                start: "top 84%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      });

      // 3. Reveal Individual Content Blocks (Fade up)
      const fadeUpElements = document.querySelectorAll<HTMLElement>('[data-reveal="fade-up"]');
      fadeUpElements.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 86%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // 4. Comparison Matrix Row Cascades
      const matrixTable = document.querySelector<HTMLElement>('[data-reveal="matrix-table"]');
      if (matrixTable) {
        const rows = matrixTable.querySelectorAll<HTMLElement>('[data-reveal="matrix-row"]');
        if (rows.length > 0) {
          gsap.fromTo(
            rows,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.04,
              ease: "power2.out",
              scrollTrigger: {
                trigger: matrixTable,
                start: "top 80%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      }
    }, containerRef);

    // Refresh triggers once fonts and DOM settle
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert(); // Automatically kills all animations and triggers created in this context
    };
  }, []);

  return <div ref={containerRef} className="contents">{children}</div>;
}
