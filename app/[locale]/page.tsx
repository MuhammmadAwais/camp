import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { WhatIsAutoNexa } from "@/components/marketing/WhatIsAutoNexa";
import { DiscoverSection } from "@/components/marketing/DiscoverSection";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ComparisonCards } from "@/components/marketing/ComparisonCards";
import { ComparisonMatrix } from "@/components/marketing/ComparisonMatrix";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { CtaBanner } from "@/components/marketing/CtaBanner";
import { Footer } from "@/components/marketing/Footer";
import { LandingAnimationProvider } from "@/components/marketing/LandingAnimationProvider";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <div
      className="min-h-screen flex flex-col bg-surface text-on-surface selection:bg-primary selection:text-white"
      suppressHydrationWarning
    >
      <Navbar />
      <LandingAnimationProvider>
        <main className="flex-1">
          <HeroSection />
          <WhatIsAutoNexa />
          <DiscoverSection />
          <HowItWorks />
          <ComparisonCards />
          <ComparisonMatrix />
          <TestimonialsSection />
          <FaqSection />
          <CtaBanner />
        </main>
      </LandingAnimationProvider>
      <Footer />
    </div>
  );
}
