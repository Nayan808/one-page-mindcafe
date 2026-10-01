"use client";

import { Hero } from "@/components/Hero";
import { ZostelLocationsSection } from "@/components/ZostelLocationsSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { WhoItsForSection } from "@/components/WhoItsForSection";
import { StatsBar } from "@/components/StatsBar";
import { FaqSection } from "@/components/FaqSection";
import { HeadsUpSection } from "@/components/HeadsUpSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CredibilityStrip } from "@/components/feelz/CredibilityStrip";
import { NotSureHowSection } from "@/components/feelz/NotSureHowSection";
import { AncientWisdomSection } from "@/components/feelz/AncientWisdomSection";
import { CalmerYouSection } from "@/components/feelz/CalmerYouSection";
import { IngredientsTeaserSection } from "@/components/feelz/IngredientsTeaserSection";

// The full Feelz storefront — product catalog + add-to-cart (Hero), pickup
// locations, how-it-works, personas, and FAQ. This is everything that used
// to live directly on "/" before the site grew a real homepage; moved here
// unchanged so the shopping experience itself isn't disrupted by the
// routing restructure. Order follows the section map in the Feelz content
// brief: hero → "meet feelz" → product catalogue (both inside Hero, "meet
// feelz" sits between the carousel and the strip grid) → credibility →
// locations/stats → formulation story → ingredients → how-it-works →
// personas → reviews → FAQ → "not sure how" → good-to-know. "Not sure how"
// sits last (just before the good-to-know disclaimer) rather than near the
// top, on request. The dark mood-picker CTA section was removed on request.
export default function FeelzPage() {
  return (
    <>
      <Hero />
      <CredibilityStrip />
      <StatsBar />
      <ZostelLocationsSection />
      <AncientWisdomSection />
      <CalmerYouSection />
      <IngredientsTeaserSection />
      <HowItWorksSection />
      <WhoItsForSection />
      <TestimonialsSection />
      <FaqSection />
      <NotSureHowSection />
      <HeadsUpSection />
    </>
  );
}
