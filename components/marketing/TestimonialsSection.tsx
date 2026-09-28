"use client";

import * as React from "react";
import Image from "next/image";
import { Star, Quotes, CheckCircle } from "@phosphor-icons/react";

interface Testimonial {
  id: string;
  name: string;
  location: string;
  car: string;
  gain: string;
  quote: string;
  avatar: string;
  rating: number;
}

const column1Testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "David Park",
    location: "Vancouver, BC",
    car: "Sold 2022 Porsche Macan GTS",
    gain: "+$6,400 over trade-in",
    quote:
      "I walked away from the local dealership after they offered $52k. Listed on AutoNexa and watched four certified dealers submit sealed bids. Sold for $58,400 with funds in my account within 36 hours. Seamless from start to finish.",
    avatar: "/avatars/avatar-1.avif",
    rating: 5,
  },
  {
    id: "t2",
    name: "Sarah Johnson",
    location: "Toronto, ON",
    car: "Sold 2021 Audi Q5 45 TFSI",
    gain: "+$4,850 over trade-in",
    quote:
      "The sealed bid process completely eliminates dealer lowball games. Knowing that dealers couldn't see each other's bids forced them to bring their best offer immediately. Best selling experience I've had in Canada.",
    avatar: "/avatars/Girlmage1.png",
    rating: 5,
  },
  {
    id: "t3",
    name: "Michael Tremblay",
    location: "Montreal, QC",
    car: "Sold 2023 Tesla Model Y Long Range",
    gain: "+$5,200 over trade-in",
    quote:
      "Zero fees for private sellers, 100% transparent condition report, and total peace of mind with full Canadian regulatory compliance. The direct bank draft cleared the very next morning without a hitch.",
    avatar: "/avatars/avatar-2.avif",
    rating: 5,
  },
];

const column2Testimonials: Testimonial[] = [
  {
    id: "t4",
    name: "Emma Wilson",
    location: "Calgary, AB",
    car: "Sold 2022 Ford F-150 Lariat 4x4",
    gain: "+$7,100 over trade-in",
    quote:
      "The trade-in offer from my local dealership was insulting. AutoNexa connected my truck to licensed buyers across Alberta and BC. Ended up with an extra $7,100 in my pocket without negotiating once.",
    avatar: "/avatars/Girlmage2.png",
    rating: 5,
  },
  {
    id: "t5",
    name: "James Rodriguez",
    location: "Mississauga, ON",
    car: "Sold 2020 BMW M340i xDrive",
    gain: "+$4,400 over trade-in",
    quote:
      "The digital damage HUD meant every minor stone chip was logged upfront. When the winning dealer picked up the car, there was zero re-negotiation or haggling. Exactly as advertised.",
    avatar: "/avatars/avatar-3.avif",
    rating: 5,
  },
  {
    id: "t6",
    name: "Chloe Bergeron",
    location: "Quebec City, QC",
    car: "Sold 2021 Lexus RX 350 AWD",
    gain: "+$5,750 over trade-in",
    quote:
      "Law 25 privacy protection and verified dealership credentials made me feel completely secure. The appraisal was instant, the auction took 24 hours, and payment was immediate upon handover.",
    avatar: "/avatars/Girlmage3.png",
    rating: 5,
  },
];

const column3Testimonials: Testimonial[] = [
  {
    id: "t7",
    name: "Liam O'Connor",
    location: "Edmonton, AB",
    car: "Sold 2022 Toyota RAV4 Prime",
    gain: "+$4,900 over trade-in",
    quote:
      "Selling privately used to mean endless marketplace messages, flakes, and lowballers. AutoNexa gave me the speed of a trade-in with genuine wholesale auction competition. Highly recommend.",
    avatar: "/avatars/Girlmage4.png",
    rating: 5,
  },
  {
    id: "t8",
    name: "Sophia Martinez",
    location: "Ottawa, ON",
    car: "Sold 2021 Mercedes-Benz GLC 300",
    gain: "+$5,300 over trade-in",
    quote:
      "The 24-hour countdown clock created real urgency among certified dealers. Watching the blind bid count climb throughout the day was exciting, and the final payout was higher than any quote in Ottawa.",
    avatar: "/avatars/Girlmage5.png",
    rating: 5,
  },
  {
    id: "t9",
    name: "Marcus Chen",
    location: "Richmond, BC",
    car: "Sold 2023 Genesis GV70 3.5T",
    gain: "+$6,150 over trade-in",
    quote:
      "Incredible platform. The mobile condition check was fast, dealers competed aggressively, and I was paid with a certified bank draft upon handover. 10 out of 10 experience.",
    avatar: "/avatars/Girlmage6.png",
    rating: 5,
  },
];

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-[22px] p-6 sm:p-7 border border-border-card/60 shadow-[0_4px_20px_-2px_rgba(32,27,17,0.06)] hover:shadow-[0_12px_32px_-4px_rgba(32,27,17,0.12)] transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Rating and Quotation Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {[...Array(item.rating)].map((_, i) => (
              <Star key={i} weight="fill" className="w-4 h-4 text-secondary" />
            ))}
          </div>
          <Quotes weight="fill" className="w-6 h-6 text-primary/15 group-hover:text-primary/30 transition-colors" />
        </div>

        {/* Testimonial Quote */}
        <p className="font-body text-sm sm:text-[15px] text-on-surface/90 leading-relaxed font-normal mb-5">
          &ldquo;{item.quote}&rdquo;
        </p>
      </div>

      <div>
        {/* Horizontal Divider Line */}
        <div className="w-full h-px bg-border-card/60 mb-4" />

        {/* Reviewer Profile Row */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border border-border-card/80 shrink-0 bg-surface-container">
            <Image
              src={item.avatar}
              alt={item.name}
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-bold text-sm text-on-surface truncate block leading-tight">
                {item.name}
              </span>
              <span title="Verified Canadian Seller" className="inline-flex items-center">
                <CheckCircle weight="fill" className="w-4 h-4 text-success shrink-0" />
              </span>
            </div>
            <span className="font-body text-xs text-on-surface-variant truncate block mt-0.5">
              {item.location} • {item.car}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  // Duplicate arrays for seamless infinite looping
  const col1 = [...column1Testimonials, ...column1Testimonials];
  const col2 = [...column2Testimonials, ...column2Testimonials];
  const col3 = [...column3Testimonials, ...column3Testimonials];

  return (
    <section
      id="testimonials"
      className="relative w-full bg-surface text-on-surface py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* ========================================================================= */}
        {/* 1. Section Header: Clean, Simple Typography (No Badges)                   */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-tight">
            Great Reviews from Real Canadian Sellers
          </h2>

          <p className="mt-4 font-body text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            See how drivers across Canada bypassed dealership trade-in lowballing, unlocked
            sealed-bid wholesale competition, and received guaranteed payouts in 48 hours.
          </p>

          <div className="w-16 h-1 bg-secondary mx-auto mt-6 rounded-full" />
        </div>

        {/* ========================================================================= */}
        {/* 2. Three-Column Vertical Marquee Tracks with Fade Masks                   */}
        {/* ========================================================================= */}
        <div className="relative h-[680px] sm:h-[740px] lg:h-[800px] overflow-hidden">
          {/* Top Gradient Fade Mask */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 sm:h-40 bg-gradient-to-b from-surface via-surface/90 to-transparent z-20" />

          {/* Bottom Gradient Fade Mask */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 sm:h-40 bg-gradient-to-t from-surface via-surface/90 to-transparent z-20" />

          {/* Scrolling Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 h-full [mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_88%,transparent_100%)]">
            {/* Column 1: Scrolls UP (Visible on Mobile, Tablet, Desktop) */}
            <div className="overflow-hidden relative h-full">
              <div className="animate-marquee-vertical-up flex flex-col gap-6 sm:gap-7">
                {col1.map((item, index) => (
                  <TestimonialCard key={`col1-${item.id}-${index}`} item={item} />
                ))}
              </div>
            </div>

            {/* Column 2: Scrolls DOWN (Visible on Tablet and Desktop) */}
            <div className="hidden md:block overflow-hidden relative h-full">
              <div className="animate-marquee-vertical-down flex flex-col gap-6 sm:gap-7">
                {col2.map((item, index) => (
                  <TestimonialCard key={`col2-${item.id}-${index}`} item={item} />
                ))}
              </div>
            </div>

            {/* Column 3: Scrolls UP (Visible on Desktop) */}
            <div className="hidden lg:block overflow-hidden relative h-full">
              <div className="animate-marquee-vertical-up flex flex-col gap-6 sm:gap-7">
                {col3.map((item, index) => (
                  <TestimonialCard key={`col3-${item.id}-${index}`} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Reassurance Trust Counter Below Grid                                   */}
        {/* ========================================================================= */}
        <div className="mt-12 text-center text-xs font-mono text-on-surface-variant/80 flex items-center justify-center gap-2">
         
        </div>
      </div>
    </section>
  );
}
