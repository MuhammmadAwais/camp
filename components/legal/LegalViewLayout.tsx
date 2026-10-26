"use client";

import React, { useState, useEffect } from "react";
import { Shield, FileText } from "lucide-react";

export interface LegalSection {
  id: string;
  number: number;
  title: string;
  content: React.ReactNode;
}

interface LegalViewLayoutProps {
  activeDocument: "privacy" | "terms";
  title: string;
  effectiveDate: string;
  introText?: string;
  sections: LegalSection[];
}

export function LegalViewLayout({
  activeDocument,
  title,
  effectiveDate,
  introText,
  sections,
}: LegalViewLayoutProps) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || "");

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSectionId(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-28 pt-2 font-body text-portal-text">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* LEFT COLUMN: Clean Table of Contents with Active Indicator Rail (Matching Reference Images) */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-16 space-y-4 self-start select-none">
          <span className="text-[11px] font-mono uppercase tracking-wider text-portal-text-muted font-bold block mb-3">
            Table of Contents
          </span>

          {/* Vertical Rail of Links with Active Border Indicator */}
          <nav className="border-l border-portal-border space-y-3">
            {sections.map((section) => {
              const isActive = activeSectionId === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={`block w-full text-left -ml-px transition-all text-xs cursor-pointer ${
                    isActive
                      ? "border-l-2 border-portal-primary pl-4 text-portal-text font-bold"
                      : "border-l-2 border-transparent pl-4 text-portal-text-muted hover:text-portal-text font-medium"
                  }`}
                >
                  {section.title}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* RIGHT COLUMN: Pure Editorial Typography (No Boxy Cards, Clean Underlines & App Colors) */}
        <main className="lg:col-span-8 space-y-8">
          {/* Header with Document Squircle Badge (Matching Reference Image 2) */}
          <div className="flex items-start gap-4 pb-6 border-b border-portal-border">
            <div className="size-12 rounded-2xl bg-portal-primary/10 border border-portal-primary/20 flex items-center justify-center text-portal-primary shrink-0 shadow-2xs">
              {activeDocument === "privacy" ? (
                <Shield className="size-6" />
              ) : (
                <FileText className="size-6" />
              )}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-headline text-portal-text tracking-tight">
                {title}
              </h1>
              <p className="text-xs text-portal-text-muted mt-1 font-mono">
                Last updated: {effectiveDate}
              </p>
            </div>
          </div>

          {/* Introductory Text (Directly on canvas, no box) */}
          {introText && (
            <div className="text-sm sm:text-base leading-relaxed text-portal-text/90 font-medium pb-2">
              {introText}
            </div>
          )}

          {/* Sections: Pure Editorial Typography with Clean Horizontal Dividers (Matching Reference Images) */}
          <div className="space-y-10 pt-2">
            {sections.map((section, idx) => (
              <section
                key={section.id}
                id={section.id}
                className={`scroll-mt-20 ${idx > 0 ? "pt-10 border-t border-portal-border" : ""} space-y-4`}
              >
                {/* Section Title with Numbered Hierarchy */}
                <h2 className="text-xl sm:text-2xl font-bold font-headline text-portal-text tracking-tight">
                  {section.title}
                </h2>

                {/* Section Content with Highlighting, Underlines, and App Colors */}
                <div className="text-sm sm:text-[15px] leading-relaxed text-portal-text/80 space-y-4 font-body">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {/* Jurisdictional Governance Footer */}
          <div className="pt-10 border-t border-portal-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-portal-text-muted">
            <span>AutoNexa Canada Inc. • National Wholesale Platform</span>
            <span>PIPEDA & Quebec Law 25 Certified</span>
          </div>
        </main>
      </div>
    </div>
  );
}
