import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, FileText, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | AutoNexa Canada",
  description:
    "AutoNexa Canada terms of service, consumer wholesale trade-in rules, OMVIC/AMVIC/VSA compliance, and sealed-bid binding covenants.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to AutoNexa Homepage</span>
        </Link>

        <div className="space-y-3 pb-6 border-b border-border-card">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            <span>Canadian Motor Vehicle Regulatory Covenants</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-headline tracking-tight text-on-surface">
            AutoNexa Terms of Service &amp; Auction Rules
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-mono">
            Effective Date: October 20, 2026 • Governing Law: Ontario, Canada (OMVIC Oversight)
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-on-surface/90">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                1
              </span>
              The AutoNexa Platform Model
            </h2>
            <p>
              AutoNexa Canada Inc. provides an automated digital marketplace platform facilitating wholesale vehicle transactions between retail registered vehicle owners (&ldquo;Sellers&rdquo;) and provincially licensed motor vehicle dealerships (&ldquo;Dealers&rdquo;). AutoNexa is not a dealership or wholesale broker; title passes directly from the Seller to the purchasing Dealership upon physical vehicle delivery and execution of the Bill of Sale.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                2
              </span>
              Seller Declarations &amp; Accurate Condition Covenants
            </h2>
            <p>
              Sellers warrant and covenant that: (a) they are the registered legal owner of the vehicle or authorized legal representative; (b) the odometer reading in kilometers is authentic and accurate; (c) all known mechanical flaws, accident collision history over $2,000 CAD, structural damage, and cosmetic imperfections have been disclosed via the 2D damage mapping tool; and (d) all active Canadian financial liens (e.g. bank loan or lease balances) have been declared.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                3
              </span>
              Dealer Sealed-Bid Binding Commitments
            </h2>
            <p>
              All sealed bids placed by dealerships during the 24-hour auction window represent irrevocable, legally binding wholesale purchase commitments governed by provincial motor vehicle sales codes (including the Ontario <em>Motor Vehicle Dealers Act, 2002</em>). A dealership may not lower or retract an active sealed bid. Following seller acceptance, the dealership must honor the full purchase price subject only to physical verification of disclosed specifications.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                4
              </span>
              Physical Inspection &amp; 48-Hour Handover Protocol
            </h2>
            <p>
              Upon seller acceptance of a winning dealer offer, AutoNexa issues an authorized Dealership Appointment Voucher with a unique QR verification code. The seller has 48 hours to present the vehicle at the dealership service bay. The dealership conducts an expedited 15-minute hoist and OBD-II verification. Undisclosed defects exceeding $500 CAD in repair costs may be arbitrated through the platform dispute resolution system.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                5
              </span>
              Currency &amp; Financial Settlement
            </h2>
            <p>
              All monetary amounts on AutoNexa are denominated, calculated, and disbursed strictly in Canadian Dollars (CAD). Payouts are made directly to the seller via electronic funds transfer (EFT) or verified dealer certified draft upon signature of the provincial transfer of ownership document.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
