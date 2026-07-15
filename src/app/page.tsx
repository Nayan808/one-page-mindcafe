import { HomeHero } from "@/components/HomeHero";
import { FeelzTeaserSection } from "@/components/FeelzTeaserSection";
import { UseCasesSection } from "@/components/UseCasesSection";
import { CounsellingTeaserSection } from "@/components/CounsellingTeaserSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { StatsBar } from "@/components/StatsBar";
import { PressMentionsSection } from "@/components/PressMentionsSection";

// Homepage — a teaser, not the shop itself (spec 4.1). Header, Footer, and
// the cart drawer are global now (rendered once in layout.tsx), so every
// route gets them without repeating the composition.
//
// StatsBar sits directly under the Feelz product grid (the stats are
// about the Feelz strips themselves) before the rest of the page moves
// on to counselling. PressMentionsSection is last and homepage-only, so
// it lands right before the global <Footer> without needing any
// layout.tsx change.
export default function Home() {
  return (
    <>
      <HomeHero />
      <FeelzTeaserSection />
      <StatsBar />
      <UseCasesSection />
      <CounsellingTeaserSection />
      <TestimonialsSection />
      <PressMentionsSection />
    </>
  );
}
