import { HomeHero } from "@/components/HomeHero";
import { MentalHealthSection } from "@/components/MentalHealthSection";
import { FeelzTeaserSection } from "@/components/FeelzTeaserSection";
import { UseCasesSection } from "@/components/UseCasesSection";
import { CounsellingTeaserSection } from "@/components/CounsellingTeaserSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { StatsBar } from "@/components/StatsBar";
import { TrustStatsSection } from "@/components/TrustStatsSection";
import { PressMentionsSection } from "@/components/PressMentionsSection";

// Homepage — a teaser, not the shop itself (spec 4.1). Header, Footer, and
// the cart drawer are global now (rendered once in layout.tsx), so every
// route gets them without repeating the composition.
//
// MentalHealthSection sits right after the hero — an editorial beat about
// mental health itself, not a Mindcafe pitch, before the page starts
// selling anything.
//
// StatsBar sits directly under the Feelz product grid (the stats are
// about the Feelz strips themselves) before the rest of the page moves
// on to counselling. TrustStatsSection is a second, different stats row
// (sessions/experts/locations, business-wide rather than product-wide) —
// placed right before TestimonialsSection so the real numbers back up the
// reviews right after them. PressMentionsSection is last and
// homepage-only, so it lands right before the global <Footer> without
// needing any layout.tsx change.
export default function Home() {
  return (
    <>
      <HomeHero />
      <MentalHealthSection />
      <FeelzTeaserSection />
      <StatsBar />
      <UseCasesSection />
      <CounsellingTeaserSection />
      <TrustStatsSection />
      <TestimonialsSection />
      <PressMentionsSection />
    </>
  );
}
