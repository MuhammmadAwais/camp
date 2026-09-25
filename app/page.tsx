import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { WhatIsAutoNexa } from "@/components/marketing/WhatIsAutoNexa";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface selection:bg-primary selection:text-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <WhatIsAutoNexa />
      </main>
    </div>
  );
}
