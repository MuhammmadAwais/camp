import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { WhatIsAutoNexa } from "@/components/marketing/WhatIsAutoNexa";
import { DiscoverSection } from "@/components/marketing/DiscoverSection";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { WhyUsSection } from "@/components/marketing/WhyUsSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { FaqSection } from "@/components/marketing/FaqSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface selection:bg-primary selection:text-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <WhatIsAutoNexa />
        <DiscoverSection />
        <HowItWorks />
        <FeaturesSection />
        <WhyUsSection />
        <TestimonialsSection />
        <FaqSection />
      </main>
    </div>
  );
}
