import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { HowToUseSection } from "@/components/sections/HowToUseSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <HowToUseSection />

      <footer className="py-12 border-t border-white/10 text-center text-muted-foreground glass">
        <p>
          &copy; {new Date().getFullYear()} Privacy Protocol. All rights
          reserved.
        </p>
      </footer>
    </main>
  );
}
