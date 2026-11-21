import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalViewLayout, type LegalSection } from "@/components/legal/LegalViewLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | AutoNexa Canada",
  description:
    "AutoNexa Canada PIPEDA and Quebec Law 25 privacy compliance disclosures, client-side EXIF data scrubbing, and identity protection.",
};

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "data-controller",
    number: 1,
    title: "1. Data Controller & Canadian Governance",
    content: (
      <>
        <p>
          The legal data controller responsible for the AutoNexa digital exchange platform, wholesale dealer terminal, and associated mobile services is:
        </p>

        {/* Clean proportional address block matching Lotessa reference image */}
        <div className="py-2 pl-4 border-l-2 border-portal-border/60 space-y-1 text-sm text-portal-text/90 font-body">
          <p className="font-bold text-portal-text">AutoNexa Canada Inc.</p>
          <p>100 King Street West, Suite 5600</p>
          <p>Toronto, Ontario M5X 1C9, Canada</p>
          <p>
            Platform:{" "}
            <a
              href="https://autonexa.ca"
              target="_blank"
              rel="noreferrer"
              className="text-portal-primary underline underline-offset-4 decoration-portal-primary/40 hover:decoration-portal-primary transition-colors font-medium"
            >
              www.autonexa.ca
            </a>
          </p>
          <p>
            Privacy Office:{" "}
            <a
              href="mailto:privacy@autonexa.ca"
              className="text-portal-primary underline underline-offset-4 decoration-portal-primary/40 hover:decoration-portal-primary transition-colors font-medium"
            >
              privacy@autonexa.ca
            </a>
          </p>
          <p>Toll-Free Inquiries: 1 (800) 555-NEXA (6392)</p>
        </div>

        <p>
          AutoNexa operates in strict compliance with the federal{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            Personal Information Protection and Electronic Documents Act (PIPEDA)
          </mark>
          , Quebec{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            Law 25
          </mark>{" "}
          (An Act to modernize legislative provisions as regards the protection of personal information), and provincial automotive dealer statutes across Ontario (OMVIC), Alberta (AMVIC), and British Columbia (VSA).
        </p>
      </>
    ),
  },
  {
    id: "data-collection",
    number: 2,
    title: "2. Data Collection & Vehicle Information",
    content: (
      <>
        <p>
          We collect personal, vehicular, and transactional information strictly necessary to facilitate wholesale auction discovery, lien clearing, and title transfer:
        </p>
        <ul className="space-y-2.5 pt-1 text-portal-text/90">
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Vehicle Specifications:</strong> 17-character VIN, verified odometer reading in kilometers, mechanical condition disclosures, maintenance histories, and 2D damage hotspot mappings.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Identity & Ownership:</strong> Government photo ID (Driver&apos;s License/Passport) used solely for biometric anti-fraud validation and provincial ownership title verification.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Contact Coordinates:</strong> Verified Canadian mobile telephone number, email address, and general municipal vicinity (e.g. &ldquo;Markham, ON&rdquo;).
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "exif-scrubbing",
    number: 3,
    title: "3. Client-Side EXIF Scrubbing & Photo Privacy",
    content: (
      <>
        <p>
          When you capture or upload vehicle showcase photographs, our proprietary{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            client-side privacy engine
          </mark>{" "}
          executes an automated EXIF metadata scrubber directly in your browser prior to any network transmission.
        </p>
        <p>
          All satellite GPS coordinates, device serial numbers, sensor timestamps, and home street location tags embedded by mobile camera sensors are permanently scrubbed. Images are converted into compressed WebP format with randomized cryptographic hashes to prevent location reverse-engineering.
        </p>
      </>
    ),
  },
  {
    id: "sealed-bid-confidentiality",
    number: 4,
    title: "4. Sealed-Bid Secrecy & Contact Confidentiality",
    content: (
      <>
        <p>
          During active 24-hour wholesale auctions, seller identity remains entirely encrypted and confidential under our{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            Sealed-Bid Invariant
          </mark>
          :
        </p>
        <ul className="space-y-2.5 pt-1 text-portal-text/90">
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>Bidding dealerships receive only general municipal vicinity and calculated transit distance.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>Competing dealerships are strictly barred from seeing competing bid dollar amounts or seller reserve floors.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>Seller contact information is unsealed exclusively to the single winning dealership chosen by the seller to coordinate vehicle hoist check.</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "your-rights",
    number: 5,
    title: "5. Your Rights Under PIPEDA & Quebec Law 25",
    content: (
      <>
        <p>
          Under Canadian privacy frameworks (PIPEDA &amp; Quebec Law 25), you possess statutory, legally enforceable rights regarding your personal records:
        </p>
        <ul className="space-y-2.5 pt-1 text-portal-text/90">
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
            <span><strong className="text-portal-text">Right of Access:</strong> Request access to and copies of your computerized personal records.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
            <span><strong className="text-portal-text">Data Portability:</strong> Obtain your records in a structured, commonly used technological format.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
            <span><strong className="text-portal-text">Right to Erasure:</strong> Request the deletion (&ldquo;right to be forgotten&rdquo;) of obsolete identity records.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
            <span><strong className="text-portal-text">Consent Revocation:</strong> Withdraw consent for electronic commercial messaging (CASL) at any time.</span>
          </li>
        </ul>
        <p className="pt-2">
          To exercise any statutory rights, submit an encrypted request to:{" "}
          <a
            href="mailto:privacy@autonexa.ca"
            className="text-portal-primary underline underline-offset-4 decoration-portal-primary/40 hover:decoration-portal-primary transition-colors font-medium"
          >
            privacy@autonexa.ca
          </a>
        </p>
        <p className="text-xs italic text-portal-text-muted/80">
          You also maintain the right to lodge a formal complaint with the{" "}
          <a
            href="https://www.priv.gc.ca"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 decoration-portal-border hover:text-portal-text transition-colors"
          >
            Office of the Privacy Commissioner of Canada (OPC)
          </a>{" "}
          or the{" "}
          <a
            href="https://www.cai.gouv.qc.ca"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 decoration-portal-border hover:text-portal-text transition-colors"
          >
            Commission d&apos;accès à l&apos;information du Québec (CAI)
          </a>.
        </p>
      </>
    ),
  },
  {
    id: "data-security",
    number: 6,
    title: "6. Data Security & Sovereign Canadian Hosting",
    content: (
      <>
        <p>
          We implement rigorous technical and organizational security measures to protect your vehicle and identity records from unauthorized access, alteration, disclosure, or destruction.
        </p>
        <p>
          All databases and file repositories reside exclusively within Canadian data centers (
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-mono text-xs font-semibold">
            AWS ca-central-1, Montreal
          </mark>
          ) to guarantee sovereign Canadian jurisdiction. Network transit utilizes{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-mono text-xs font-semibold">
            TLS 1.3
          </mark>
          , and database volumes are encrypted with AES-256 rest encryption.
        </p>
      </>
    ),
  },
  {
    id: "data-retention",
    number: 7,
    title: "7. Data Retention & Biometric Purge Limits",
    content: (
      <>
        <p>
          AutoNexa adheres strictly to the principle of limited retention. Raw biometric image scans uploaded during identity verification are permanently deleted within 15 minutes of cryptographic token generation.
        </p>
        <p>
          Completed transaction contracts, bills of sale, and dispute arbitration filings are retained for seven (7) years strictly in accordance with Canada Revenue Agency (CRA) tax audit requirements and provincial motor vehicle dealer council statutes (OMVIC, AMVIC, VSA).
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalViewLayout
      activeDocument="privacy"
      title="Privacy Policy"
      effectiveDate="October 2026"
      introText="This Privacy Policy outlines how AutoNexa Canada collects, uses, protects, and manages your personal vehicle data in strict compliance with the Personal Information Protection and Electronic Documents Act (PIPEDA), Quebec Law 25, and provincial motor vehicle regulatory councils."
      sections={PRIVACY_SECTIONS}
    />
  );
}
