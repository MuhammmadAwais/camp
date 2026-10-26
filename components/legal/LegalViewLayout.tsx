"use client";

import React from "react";
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
  return (
    <div className="max-w-4xl mx-auto pb-28 pt-2 sm:pt-6 font-body text-portal-text">
      <main className="space-y-8">
        {/* Header with Document Squircle Badge (Matching Reference Images) */}
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

        {/* Sections: Pure Editorial Typography with Clean Horizontal Dividers */}
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
  );
}
