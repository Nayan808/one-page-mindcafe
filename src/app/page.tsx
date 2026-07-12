import { HomeHero } from "@/components/HomeHero";
import { FeelzTeaserSection } from "@/components/FeelzTeaserSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { StatsBar } from "@/components/StatsBar";

// Homepage — a teaser, not the shop itself (spec 4.1). Header, Footer, and
// the cart drawer are global now (rendered once in layout.tsx), so every
// route gets them without repeating the composition.
export default function Home() {
  return (
    <>
      <HomeHero />
      <FeelzTeaserSection />
      <StatsBar />
      <TestimonialsSection />
    </>
  );
}
