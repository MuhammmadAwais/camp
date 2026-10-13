"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PanelContent = {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  points: string[];
};

const DEFAULT_PANEL: PanelContent = {
  image: "/auth/deal-making.jfif",
  eyebrow: "Wholesale Auction Floor",
  title: "Your car, Canada's top dealers, one sealed-bid auction.",
  subtitle: "Connecting verified private sellers with hundreds of licensed Canadian dealerships competing for wholesale inventory.",
  points: [
    "24-Hour sealed-bid auction guarantees top wholesale value",
    "Bids exclusively from OMVIC, AMVIC & VSA licensed dealers",
    "Zero fees for private vehicle sellers — 100% free",
    "Doorstep pickup & certified escrow payment across Canada",
  ],
};

const PANELS: Record<string, PanelContent> = {
  "/login": {
    image: "/auth/deal-making.jfif",
    eyebrow: "Wholesale Auction Floor",
    title: "Canada's Premier Wholesale Vehicle Marketplace",
    subtitle: "Sign in to track your live auction, review certified dealer bids in real time, and manage your vehicle offers.",
    points: [
      "Real-time bid count & countdown telemetry tracking",
      "Confidential sealed bids prevent dealer price collusion",
      "Immediate settlement & legal ownership transfer support",
    ],
  },
  "/register": {
    image: "/auth/keys-giving.jpg",
    eyebrow: "Seller Registration",
    title: "Verified Sellers Get Maximum Dealer Competition",
    subtitle: "Create your free account to access over 1,200 licensed dealerships across Ontario, Alberta, and British Columbia.",
    points: [
      "Dealers bid aggressively knowing listings are 100% verified",
      "Your personal phone and email stay strictly private until you accept",
      "Zero hidden fees, zero listing commissions, zero obligation",
    ],
  },
  "/sell": {
    image: "/auth/keys-giving.jpg",
    eyebrow: "Instant Valuation",
    title: "Skip Lowball Trade-Ins. Let Canadian Dealers Compete.",
    subtitle: "Decode your VIN to start a 24-hour sealed-bid auction where licensed buyers compete to offer the highest payout.",
    points: [
      "Instant VIN decode automatically populates factory specifications",
      "Launch a 24-hour sealed auction in under 3 minutes",
      "Accept the winning offer or walk away with zero penalty",
    ],
  },
  "/verify": {
    image: "/auth/keys-giving.jpg",
    eyebrow: "Account Security",
    title: "Two Quick Codes Keep Your Account Protected",
    subtitle: "Protecting private sellers and dealer bids with bank-grade two-factor authentication.",
    points: [
      "Two-factor verification via email and SMS text message",
      "Takes less than 60 seconds to complete",
      "Your phone number is never shared with dealers",
    ],
  },
  "/verify-kyc": {
    image: "/auth/keys-giving.jpg",
    eyebrow: "Identity Verification",
    title: "Confirming Ownership Protects Every Transaction",
    subtitle: "Required once before your vehicle auction goes live to ensure dealer trust and maximum bidding activity.",
    points: [
      "Fast automated scan of government photo ID",
      "Handled by specialized, PIPEDA-compliant verification partners",
      "We store the verification result, never your raw identity images",
    ],
  },
  "/forgot-password": {
    image: "/auth/deal-making.jfif",
    eyebrow: "Account Recovery",
    title: "Secure Account Recovery",
    subtitle: "We'll send you a time-limited, encrypted link to securely reset your credentials.",
    points: [
      "Time-limited secure reset link sent to your verified email",
      "Bank-grade 256-bit encryption protects your credentials",
      "24/7 support available if you need help recovering access",
    ],
  },
  "/reset-password": {
    image: "/auth/deal-making.jfif",
    eyebrow: "Account Recovery",
    title: "Set Your New Password",
    subtitle: "Ensure your new password is strong and unique to protect your auction transactions.",
    points: [
      "Requires minimum 10 characters with letter and number",
      "Immediately invalidates all previous login sessions",
      "Instant restoration of full auction portal access",
    ],
  },
};

interface Props {
  variant?: "full" | "compact";
}

export function AuthVisualPanel({ variant = "full" }: Props) {
  const pathname = usePathname();
  const panel = PANELS[pathname] ?? DEFAULT_PANEL;
  const isFull = variant === "full";

  if (!isFull) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#001A18]">
        <Image
          key={panel.image}
          src={panel.image}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 0px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" aria-hidden />
        <div className="relative z-10 flex h-full flex-col justify-end p-5 text-white">
          <p className="font-body text-[11px] font-bold uppercase tracking-widest text-[#33BFBC]">{panel.eyebrow}</p>
          <p className="mt-1 font-headline text-base sm:text-lg font-bold leading-snug text-white">{panel.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-bl-[80px] xl:rounded-bl-[100px] bg-[#001A18] shadow-2xl">
      <Image
        key={panel.image}
        src={panel.image}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 58vw, 0px"
        className="object-cover object-center"
      />
      {/* Dark multi-stop gradient overlay with Nordic Pine teal undertone */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30"
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14 text-white">
        {/* Top Lockup */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 focus:outline-none group" aria-label="AutoNexa home">
            <div className="relative w-8 h-[20px] shrink-0">
              <Image src="/logo-mark-tight.png" alt="AutoNexa Emblem" fill sizes="32px" className="object-contain" priority />
            </div>
            <span className="font-headline font-bold text-2xl text-white tracking-tight leading-none">
              Auto<span className="text-[#33BFBC]">Nexa</span>
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-white/90">
            <span className="w-1.5 h-1.5 rounded-full bg-[#33BFBC] animate-pulse" />
            Canadian Wholesale Network
          </span>
        </div>

        {/* Center Editorial / Feature Highlights (Truet reference) */}
        <div className="max-w-lg my-auto py-8">
          <p className="font-body text-xs font-bold uppercase tracking-widest text-[#33BFBC]">
            {panel.eyebrow}
          </p>
          <h2 className="mt-3 font-headline text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-white">
            {panel.title}
          </h2>
          <p className="mt-3 font-body text-sm text-white/75 leading-relaxed">
            {panel.subtitle}
          </p>

          <ul className="mt-6 space-y-3">
            {panel.points.map((point) => (
              <li key={point} className="flex items-start gap-3 font-body text-sm text-white/90">
                <span className="mt-0.5 w-5 h-5 rounded-md bg-[#008C87]/40 border border-[#33BFBC]/50 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#33BFBC]" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="leading-snug">{point}</span>
              </li>
            ))}
          </ul>

          {/* Glassmorphic Callout Box matching Truet reference */}
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-[#33BFBC]">
                  Guaranteed Auction Integrity
                </p>
                <p className="mt-0.5 font-headline text-base font-bold text-white">
                  $0 Fees for Private Sellers
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[11px] text-white/60">Compliance</p>
                <p className="font-body text-xs font-semibold text-white">OMVIC • AMVIC • VSA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer inside panel */}
        <div className="flex items-center justify-between text-xs text-white/60 pt-4 border-t border-white/10">
          <div className="flex items-center gap-5 font-body">
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Use</Link>
            <a href="mailto:support@autonexa.ca" className="hover:text-white transition-colors">Support</a>
          </div>
          <span className="font-mono text-[11px] text-white/50 tracking-wider">PIPEDA & LAW 25 COMPLIANT</span>
        </div>
      </div>
    </div>
  );
}
