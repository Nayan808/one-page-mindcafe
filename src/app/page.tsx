import { HomeHero } from "@/components/HomeHero";
import { FeelzTeaserSection } from "@/components/FeelzTeaserSection";
import { CounsellingTeaserSection } from "@/components/CounsellingTeaserSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { StatsBar } from "@/components/StatsBar";

// Homepage — a teaser, not the shop itself (spec 4.1). Header, Footer, and
// the cart drawer are global now (rendered once in layout.tsx), so every
// route gets them without repeating the composition.
//
// Feelz and counselling get equal billing here (CounsellingTeaserSection
// right after the Feelz teaser) since this is a two-vertical site, not a
// Feelz storefront with counselling bolted on — StatsBar/Testimonials
// after both stay shared trust-building content for the whole site.
export default function Home() {
  return (
    <>
      <HomeHero />
      <FeelzTeaserSection />
      <CounsellingTeaserSection />
      <StatsBar />
      <TestimonialsSection />
    </>
  );
}
