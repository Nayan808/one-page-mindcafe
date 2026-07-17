"use client";

import { Hero } from "@/components/Hero";
import { ZostelLocationsSection } from "@/components/ZostelLocationsSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { WhoItsForSection } from "@/components/WhoItsForSection";
import { StatsBar } from "@/components/StatsBar";
import { FaqSection } from "@/components/FaqSection";
import { HeadsUpSection } from "@/components/HeadsUpSection";

// The full Feelz storefront — product catalog + add-to-cart (Hero), pickup
// locations, how-it-works, personas, and FAQ. This is everything that used
// to live directly on "/" before the site grew a real homepage; moved here
// unchanged so the shopping experience itself isn't disrupted by the
// routing restructure.
export default function FeelzPage() {
  return (
    <>
      <Hero />
      <ZostelLocationsSection />
      <HowItWorksSection />
      <WhoItsForSection />
      <StatsBar />
      <div className="bg-white">
        <FaqSection />
        <HeadsUpSection />
      </div>
    </>
  );
}
