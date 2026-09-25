import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface selection:bg-primary selection:text-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
      </main>
    </div>
  );
}
