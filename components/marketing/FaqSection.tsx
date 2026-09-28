"use client";

import * as React from "react";
import { CaretDown, ChatCircleDots, ShieldCheck, ArrowRight } from "@phosphor-icons/react";

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
      className="relative w-full bg-surface text-on-surface py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 border-t border-border-card/60"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 xl:gap-20 items-start">
          {/* ========================================================================= */}
          {/* 1. Left Column: Editorial Header & Support Assistance Card (No Person Img) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-[1.12]">
              Frequently Asked <br />
              <span className="text-primary  decoration-primary/40 underline-offset-8">
                Questions.
              </span>
            </h2>

            <p className="mt-5 font-body text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-md">
              Everything you need to know about Canada&apos;s sealed-bid wholesale marketplace,
              regulatory protections, and guaranteed payout timelines.
            </p>

            {/* Unique Editorial Support Card with Maroon Accent */}
            <div className="mt-8 sm:mt-10 p-6 sm:p-7 rounded-2xl bg-white border border-border-card shadow-[0_4px_24px_-2px_rgba(32,27,17,0.06)] relative overflow-hidden">
              {/* Subtle Maroon Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <ChatCircleDots weight="duotone" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-on-surface">
                    Have a specific question?
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                    Our Canadian marketplace specialists are available 7 days a week to assist with appraisals, title transfers, and provincial regulations.
                  </p>
                  <a
                    href="mailto:support@autonexa.ca"
                    className="inline-flex items-center gap-1.5 font-body text-xs font-bold text-primary hover:text-primary-hover mt-3 group"
                  >
                    <span>Talk to an advisor</span>
                    <ArrowRight weight="bold" className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. Right Column: Clean Line-Divided Accordion with Maroon Highlights       */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7">
            <div className="w-full border-t border-border-card">
              {faqs.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`border-b border-border-card transition-colors duration-200 ${
                      isOpen ? "bg-surface-container-low/40 rounded-xl my-1 px-4 sm:px-5 border-transparent" : "px-1"
                    }`}
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
                            ? "text-primary font-bold"
                            : "text-on-surface group-hover:text-primary"
                        }`}
                      >
                        {item.question}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isOpen
                            ? "border-primary/40 bg-primary/10 text-primary rotate-180"
                            : "border-border-card bg-surface-container text-on-surface-variant group-hover:border-primary/40 group-hover:text-primary"
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
                        <p className="font-body text-sm sm:text-base text-on-surface-variant leading-relaxed font-normal pr-4 sm:pr-8">
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
