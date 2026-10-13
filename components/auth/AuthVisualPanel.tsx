"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PanelContent = {
  image: string;
  imagePosition: string;
  eyebrow: string;
  title: string;
  points: string[];
};

const DEFAULT_PANEL: PanelContent = {
  image: "/hero-bg.webp",
  imagePosition: "object-[50%_60%]",
  eyebrow: "Seller portal",
  title: "Your car, Canada's dealers, one sealed-bid auction.",
  points: ["Track your auction and bid count live", "Review every offer when bidding closes", "Free for private sellers"],
};

// Step-specific imagery and reassurance copy, keyed by the auth route.
const PANELS: Record<string, PanelContent> = {
  "/sell": {
    image: "/hero-bg.webp",
    imagePosition: "object-[50%_60%]",
    eyebrow: "Step 1 · Your vehicle",
    title: "Let licensed dealers compete for your car.",
    points: ["24-hour sealed-bid auction", "OMVIC, AMVIC & VSA licensed dealers", "No fees for private sellers"],
  },
  "/register": {
    image: "/illustrations/sell-your-car.webp",
    imagePosition: "object-[45%_center]",
    eyebrow: "Step 2 · Your account",
    title: "Verified sellers get serious offers.",
    points: ["Dealers only bid on verified listings", "Your contact details stay private until you pick a dealer", "Unsubscribe from marketing any time"],
  },
  "/verify": {
    image: "/illustrations/why-us.webp",
    imagePosition: "object-[30%_center]",
    eyebrow: "Step 3 · Verify",
    title: "Two quick codes keep your account yours.",
    points: ["One code by email, one by text", "Takes less than a minute", "We never share your number with dealers"],
  },
  "/verify-kyc": {
    image: "/illustrations/features/condition-inspection.jpg",
    imagePosition: "object-[60%_center]",
    eyebrow: "Step 4 · Identity",
    title: "Confirming who you are protects every sale.",
    points: ["Required once, before your first listing", "Handled by a specialist identity-verification partner", "We keep the result, never your ID images"],
  },
};

interface Props {
  variant?: "full" | "compact";
}

export function AuthVisualPanel({ variant = "full" }: Props) {
  const pathname = usePathname();
  const panel = PANELS[pathname] ?? DEFAULT_PANEL;
  const isFull = variant === "full";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-on-surface">
      <Image
        key={panel.image}
        src={panel.image}
        alt=""
        fill
        priority={isFull}
        sizes={isFull ? "(min-width: 1024px) 42vw, 0px" : "100vw"}
        className={cn("object-cover", isFull ? panel.imagePosition : "object-[50%_70%]")}
      />
      <div
        className={cn(
          "absolute inset-0",
          isFull
            ? "bg-gradient-to-t from-on-surface via-on-surface/55 to-on-surface/10"
            : "bg-gradient-to-r from-on-surface/90 via-on-surface/50 to-on-surface/0"
        )}
        aria-hidden
      />

      {isFull ? (
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
          <Link href="/" className="flex items-center gap-3 self-start rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary" aria-label="AutoNexa home">
            <span className="w-11 h-11 rounded-full bg-surface flex items-center justify-center">
              <span className="relative w-7 h-4">
                <Image src="/logo-mark.webp" alt="" fill sizes="28px" className="object-contain" />
              </span>
            </span>
            <span className="font-headline text-xl font-bold tracking-tight text-white">AutoNexa</span>
          </Link>

          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-secondary">{panel.eyebrow}</p>
            <h2 className="mt-3 max-w-md font-headline text-3xl xl:text-[40px] font-bold leading-[1.1] tracking-tight text-white">{panel.title}</h2>
            <ul className="mt-7 space-y-3">
              {panel.points.map((point) => (
                <li key={point} className="flex items-start gap-3 font-body text-[15px] text-white/85">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-secondary/20 ring-1 ring-secondary/50 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-secondary" strokeWidth={3} aria-hidden />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex h-full max-w-[75%] flex-col justify-end p-5">
          <p className="font-body text-[11px] font-bold uppercase tracking-widest text-secondary">{panel.eyebrow}</p>
          <p className="mt-1 font-headline text-lg font-bold leading-snug text-white">{panel.title}</p>
        </div>
      )}
    </div>
  );
}
