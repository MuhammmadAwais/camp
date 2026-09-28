"use client";

import * as React from "react";
import Image from "next/image";
import { CaretDown } from "@phosphor-icons/react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    id: "faq-1",
    question: "Is listing and selling my car truly 100% free for private sellers?",
    answer:
      "Yes, completely free. AutoNexa charges zero listing fees, zero appraisal fees, and zero commissions to private vehicle sellers. The platform is funded entirely through licensed dealer buyer fees upon successful vehicle transactions. You retain 100% of the winning bid amount.",
  },
  {
    id: "faq-2",
    question: "How does the 24-hour sealed-bid auction beat traditional trade-ins?",
    answer:
      "In a traditional trade-in, a single dealer holds exclusive pricing power and maximizes their profit margin. AutoNexa broadcasts your vehicle's verified condition report to hundreds of certified dealerships across Canada in a 24-hour sealed-bid auction. Because dealers cannot see competing bids, they must submit their highest and best offer immediately, delivering an average of $2,800+ over dealership trade-in quotes.",
  },
  {
    id: "faq-3",
    question: "Are all participating dealerships licensed and regulated in Canada?",
    answer:
      "Every single buyer on AutoNexa is a vetted, provincially licensed motor vehicle dealer registered with OMVIC (Ontario), AMVIC (Alberta), or the VSA (British Columbia). Private marketplace curbstoners, unregistered resellers, and retail flippers are strictly barred from the auction terminal.",
  },
  {
    id: "faq-4",
    question: "How does vehicle condition inspection and handover work?",
    answer:
      "You complete a guided 5-minute digital check from your phone, uploading key photos and logging condition items with our digital damage HUD (all photos are automatically stripped of EXIF GPS coordinates for privacy). Once you accept an unsealed offer, you schedule an appointment at the winning dealer's showroom or arrange verified pickup. The dealer performs a rapid physical verification against the digital report.",
  },
  {
    id: "faq-5",
    question: "When and how do I receive payment once an offer is accepted?",
    answer:
      "Payment is disbursed immediately upon physical vehicle handover and title transfer at the verified dealership. You receive guaranteed funds via certified bank draft, direct wire, or Interac e-Transfer within 24 to 48 hours. No personal checks, no escrow delays, and zero chargeback risks.",
  },
];

export function FaqSection() {
  // First item open by default matching reference design
  const [openId, setOpenId] = React.useState<string | null>("faq-1");

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="relative w-full bg-[#120F0D] text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Tactile Dark Marble Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-15 mix-blend-luminosity bg-[url('/textures/dark-marble.webp')] bg-repeat bg-[length:400px_400px]" />

      {/* Subtle Warm Amber Vignette Glows */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 xl:gap-20 items-center">
          {/* ========================================================================= */}
          {/* 1. Left Visual: Person Thinking (Clean cutout, no border / box / badge)    */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 relative flex items-end justify-center">
            <div className="relative w-full max-w-[420px] h-[440px] sm:h-[520px] lg:h-[580px]">
              <Image
                src="/illustrations/person-thinking.png"
                alt="Frequently asked questions about AutoNexa"
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
                priority={false}
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. Right Column: Heading & Line-Divided Accordion                          */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7">
            <div className="mb-8 sm:mb-10">
              <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 font-body text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
                Everything you need to know about Canada&apos;s sealed-bid wholesale marketplace, seller guarantees, and instant payout timelines.
              </p>
            </div>

            {/* Accordion Divider List (Image 2 geometry) */}
            <div className="w-full border-t border-white/15">
              {faqs.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div
                    key={item.id}
                    className="border-b border-white/15 transition-colors duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(item.id)}
                      className="w-full py-5 sm:py-6 flex items-center justify-between text-left gap-4 group focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <span
                        className={`font-headline font-semibold text-base sm:text-lg transition-colors duration-200 ${
                          isOpen
                            ? "text-secondary"
                            : "text-white group-hover:text-secondary"
                        }`}
                      >
                        {item.question}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isOpen
                            ? "border-secondary/40 bg-secondary/15 text-secondary rotate-180"
                            : "border-white/15 bg-white/5 text-white/70 group-hover:border-white/30 group-hover:text-white"
                        }`}
                      >
                        <CaretDown weight="bold" className="w-4 h-4" />
                      </div>
                    </button>

                    {/* Expandable Answer Content */}
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen
                          ? "grid-rows-[1fr] opacity-100 mb-6"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="font-body text-sm sm:text-base text-white/80 leading-relaxed font-normal pr-4 sm:pr-8">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
