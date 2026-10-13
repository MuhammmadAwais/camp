"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AutoNexaPhysicsCanvas } from "@/components/marketing/AutoNexaPhysicsCanvas";

type PanelContent = {
  image: string;
  eyebrow: string;
  title: string;
  tagline: string;
};

const DEFAULT_PANEL: PanelContent = {
  image: "/auth/deal-making.jfif",
  eyebrow: "Wholesale Auction Floor",
  title: "Your car, Canada's top dealers, one sealed-bid auction.",
  tagline: "BID • WIN • DRIVE",
};

const PANELS: Record<string, PanelContent> = {
  "/login": {
    image: "/auth/deal-making.jfif",
    eyebrow: "Wholesale Auction Floor",
    title: "Canada's Premier Wholesale Vehicle Marketplace",
    tagline: "BID • WIN • DRIVE",
  },
  "/register": {
    image: "/auth/keys-giving.jpg",
    eyebrow: "Canadian Marketplace",
    title: "Verified Sellers Get Serious Dealer Competition",
    tagline: "BID • WIN • DRIVE",
  },
  "/sell": {
    image: "/auth/keys-giving.jpg",
    eyebrow: "Instant Valuation",
    title: "Skip Lowball Trade-Ins. Let Canadian Dealers Compete.",
    tagline: "BID • WIN • DRIVE",
  },
  "/verify": {
    image: "/auth/keys-giving.jpg",
    eyebrow: "Account Security",
    title: "Two Quick Codes Keep Your Account Protected",
    tagline: "BID • WIN • DRIVE",
  },
  "/verify-kyc": {
    image: "/auth/keys-giving.jpg",
    eyebrow: "Identity Verification",
    title: "Confirming Ownership Protects Every Transaction",
    tagline: "BID • WIN • DRIVE",
  },
  "/forgot-password": {
    image: "/auth/deal-making.jfif",
    eyebrow: "Account Recovery",
    title: "Secure Account Recovery",
    tagline: "BID • WIN • DRIVE",
  },
  "/reset-password": {
    image: "/auth/deal-making.jfif",
    eyebrow: "Account Recovery",
    title: "Set Your New Password",
    tagline: "BID • WIN • DRIVE",
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
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#33BFBC]">{panel.tagline}</p>
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
      {/* Dark multi-stop gradient overlay with subtle Nordic Pine teal undertone */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/35"
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14 text-white">
        {/* Top Right: Prominent AutoNexa Brand Lockup */}
        <div className="flex items-center justify-end">
          <Link href="/" className="inline-flex items-center gap-3 focus:outline-none group" aria-label="AutoNexa home">
            <div className="relative w-10 h-[24px] xl:w-11 xl:h-[26px] shrink-0 transition-transform duration-200 group-hover:scale-105">
              <Image src="/logo-mark-tight.png" alt="AutoNexa Emblem" fill sizes="44px" className="object-contain" priority />
            </div>
            <span className="font-headline font-bold text-2xl xl:text-3xl text-white tracking-tight leading-none">
              Auto<span className="text-[#33BFBC]">Nexa</span>
            </span>
          </Link>
        </div>

        {/* Center: Open photography space */}
        <div className="flex-1" />

        {/* Bottom Tagline: Interactive Physics Dot-Matrix Headline Canvas */}
        <div className="pt-4 select-none">
          <div className="w-full overflow-hidden">
            <AutoNexaPhysicsCanvas
              text={panel.tagline || "BID • WIN • DRIVE"}
              theme="dark"
              showBorder={false}
              className="py-1"
            />
          </div>

          <p className="mt-2 font-body text-xs sm:text-sm text-white/70 max-w-md leading-relaxed">
            Canada&apos;s premier 24-hour sealed-bid wholesale automotive marketplace.
          </p>
        </div>
      </div>
    </div>
  );
}
