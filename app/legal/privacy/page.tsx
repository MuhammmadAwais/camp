import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, FileText, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | AutoNexa Canada",
  description:
    "AutoNexa Canada PIPEDA and Quebec Law 25 privacy compliance disclosures, EXIF data handling, and identity protection.",
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PIPEDA &amp; Quebec Law 25 Compliant</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-headline tracking-tight text-on-surface">
            AutoNexa Canadian Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-mono">
            Effective Date: October 20, 2026 • Version 2.4 (National Canadian Jurisdiction)
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-on-surface/90">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                1
              </span>
              Overview &amp; Regulatory Jurisdiction
            </h2>
            <p>
              AutoNexa Canada Inc. (&ldquo;AutoNexa&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a digital wholesale vehicle trade-in exchange connecting Canadian retail vehicle owners with verified licensed motor vehicle dealerships across Ontario (OMVIC), Alberta (AMVIC), British Columbia (VSA), and Quebec (OPC). We comply strictly with the <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA), Quebec <em>Law 25 (An Act to modernize legislative provisions as regards the protection of personal information)</em>, and CASL anti-spam regulations.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                2
              </span>
              Client-Side EXIF Metadata Scrubbing &amp; Media Privacy
            </h2>
            <p>
              When sellers capture and upload vehicle showcase photos, our client-side software executes an automated EXIF metadata scrubber in the browser before any image bytes are transmitted to storage. All GPS satellite coordinates, device serial numbers, and home street location tags embedded by mobile cameras are permanently stripped.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                3
              </span>
              Sealed-Bid Secrecy &amp; Contact Confidentiality
            </h2>
            <p>
              During active 24-hour marketplace auctions, seller legal names, street addresses, phone numbers, and email addresses remain strictly encrypted and confidential. Bidding dealerships receive only municipal general vicinity (e.g. &ldquo;Markham, ON&rdquo;) and calculated travel distance. Seller contact information is unsealed exclusively to the single winning dealership selected by the seller.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                4
              </span>
              Identity Verification &amp; KYC Data Retention
            </h2>
            <p>
              Government-issued identification documents uploaded for anti-fraud identity verification (Driver&apos;s License / Passport) are processed using encrypted biometric liveness checks. Verification tokens are cryptographically signed. Image files are scrubbed after identity validation in accordance with provincial retention statutes.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                5
              </span>
              Chief Privacy Officer Contact
            </h2>
            <p>
              Inquiries, access requests, or deletion requests under PIPEDA or Quebec Law 25 may be addressed directly to our Canadian Compliance Office:
            </p>
            <div className="p-4 rounded-xl bg-surface-container border border-border-card font-mono text-xs space-y-1">
              <div>AutoNexa Canada Inc. — Office of the Privacy Commissioner Officer</div>
              <div>100 University Avenue, 8th Floor, Toronto, ON, M5J 2Y1</div>
              <div>Direct: <a href="mailto:privacy@autonexa.ca" className="text-primary underline">privacy@autonexa.ca</a></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
