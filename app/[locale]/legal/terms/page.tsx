import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalViewLayout, type LegalSection } from "@/components/legal/LegalViewLayout";

export const metadata: Metadata = {
  title: "Terms of Use | AutoNexa Canada",
  description:
    "AutoNexa Canada terms of service, consumer wholesale trade-in rules, OMVIC/AMVIC/VSA compliance, and sealed-bid binding covenants.",
};

const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    number: 1,
    title: "1. Introduction & Marketplace Model",
    content: (
      <>
        <p>
          These Terms of Use govern your access to and use of the AutoNexa Canada website, mobile applications, wholesale bidding terminal, and related vehicle discovery services.
        </p>
        <p>
          By creating an account, submitting a vehicle listing, accessing the wholesale terminal, or otherwise utilizing any part of the platform, you agree to be bound by these Terms and our{" "}
          <Link
            href="/legal/privacy"
            className="text-portal-primary underline underline-offset-4 decoration-portal-primary/40 hover:decoration-portal-primary transition-colors font-medium"
          >
            Privacy Policy
          </Link>
          . If you do not agree to these Terms, you must not access or use AutoNexa.
        </p>
        <p>
          AutoNexa operates an automated technology platform facilitating wholesale vehicle transactions between retail registered vehicle owners (&ldquo;Sellers&rdquo;) and provincially licensed motor vehicle dealerships (&ldquo;Dealers&rdquo;). AutoNexa is not a dealership, broker, or consignee. Legal title and vehicle ownership pass directly from the Seller to the purchasing Dealership upon physical vehicle delivery and execution of the provincial Bill of Sale.
        </p>
      </>
    ),
  },
  {
    id: "seller-warranties",
    number: 2,
    title: "2. Seller Declarations & Accurate Disclosures",
    content: (
      <>
        <p>
          Sellers warrant and covenant under applicable provincial consumer protection acts that:
        </p>
        <ul className="space-y-2.5 pt-1 text-portal-text/90">
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Ownership Authority:</strong> You are the sole registered legal owner of the vehicle or possess an authenticated, legally executed Power of Attorney.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Authentic Odometer:</strong> The odometer reading in kilometers is authentic, unrolled, tamper-free, and accurately reported.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Collision Disclosures:</strong> All known collision history exceeding $2,000 CAD, structural/unibody damage, and flood/salvage titles have been accurately declared.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Visual Damage Hotspots:</strong> All cosmetic scuffs, scratches, dents, and mechanical flaws have been disclosed using the 2D interactive damage mapping tool.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="size-1.5 rounded-full bg-portal-primary shrink-0 mt-2.5" />
            <span>
              <strong className="text-portal-text">Lien Transparency:</strong> All existing Canadian financial liens (financing, leases, chattel mortgages) have been fully reported for escrow clearance.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "dealer-commitments",
    number: 3,
    title: "3. Dealer Sealed-Bid Binding Commitments",
    content: (
      <>
        <p>
          All sealed bids submitted by verified dealerships represent irrevocable, legally binding commercial purchase covenants governed by provincial motor vehicle regulations, including Ontario&apos;s{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-medium">
            Motor Vehicle Dealers Act, 2002 (MVDA)
          </mark>
          .
        </p>
        <p>
          A dealership is strictly barred from lowering, renegotiating, or retracting an active sealed bid during or following an auction. Once a seller accepts a bid, the purchasing dealership is obligated to honor the full agreed CAD purchase price, subject exclusively to physical verification of the seller&apos;s declared condition.
        </p>
      </>
    ),
  },
  {
    id: "inspection-handover",
    number: 4,
    title: "4. Physical Inspection & 48-Hour Handover",
    content: (
      <>
        <p>
          Upon seller acceptance of a winning dealer offer, AutoNexa issues an authorized{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-mono text-xs font-semibold">
            Dealership Appointment Voucher
          </mark>{" "}
          with a unique QR verification pass. The seller agrees to present the vehicle at the dealership service facility within{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-semibold">
            48 hours
          </mark>
          .
        </p>
        <p>
          A licensed provincial automotive technician conducts an expedited 15-minute hoist inspection and OBD-II electronic diagnostic audit. The dealership must complete the check in the seller&apos;s presence. Minor superficial wear consistent with vehicle age cannot be used to renegotiate or delay settlement.
        </p>
      </>
    ),
  },
  {
    id: "currency-escrow",
    number: 5,
    title: "5. Canadian Currency & Escrow Disbursements",
    content: (
      <>
        <p>
          All monetary amounts on AutoNexa are denominated, calculated, and disbursed strictly in{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-semibold">
            Canadian Dollars (CAD)
          </mark>{" "}
          as whole integer cents to guarantee zero floating-point arithmetic errors.
        </p>
        <p>
          Purchasing dealerships pre-authorize purchase funds through bonded Canadian Electronic Funds Transfer (EFT) accounts held in institutional escrow. Upon physical inspection sign-off, escrow releases funds directly to the seller&apos;s Canadian financial institution, guaranteeing zero seller payment default risks.
        </p>
      </>
    ),
  },
  {
    id: "dispute-resolution",
    number: 6,
    title: "6. Platform Dispute Arbitration ($500 CAD Floor)",
    content: (
      <>
        <p>
          In the event that an undisclosed mechanical, structural, or electronic defect is uncovered during the physical hoist inspection, the transaction is protected by AutoNexa&apos;s Neutral Arbitration Protocol.
        </p>
        <p>
          To prevent frivolous renegotiation, claims require a minimum certified repair threshold of{" "}
          <mark className="bg-portal-primary/10 text-portal-primary px-1.5 py-0.5 rounded font-semibold">
            $500.00 CAD
          </mark>{" "}
          verified by an independent technician estimate. The dispute docket is reviewed within 2 hours by an AutoNexa compliance arbitrator who may: (a) approve an agreed price adjustment; (b) reject the claim and compel full settlement; or (c) order mutual deal cancellation with zero penalties to either party.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    number: 7,
    title: "7. Limitation of Liability & Governing Law",
    content: (
      <>
        <p>
          These Terms of Use are governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, subject to mandatory provincial automotive licensing statutes in Alberta (AMVIC), British Columbia (VSA), and Quebec (OPC).
        </p>
        <p className="text-xs italic text-portal-text-muted/80">
          AutoNexa shall not be liable for any indirect, punitive, or consequential damages arising from vehicle mechanical breakdown post-handover. All warranties are governed exclusively by provincial motor vehicle regulations.
        </p>
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalViewLayout
      activeDocument="terms"
      title="Terms of Use"
      effectiveDate="October 2026"
      introText="These Terms of Use govern your access to and use of the AutoNexa Canada digital marketplace, auction terminal, and related vehicle wholesale trade-in services."
      sections={TERMS_SECTIONS}
    />
  );
}
