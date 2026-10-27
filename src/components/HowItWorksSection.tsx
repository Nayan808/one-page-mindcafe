"use client";

import { HowToUseSection, type HowToStep } from "@/components/feelz/HowToUseSection";

// /feelz "how it works" — the same design as each product page's
// "Open. Place. Dissolve. Go." section (HowToUseSection: arch photo
// frames, ambient background, rotating seal, left → right reveal), here
// on the brand berry with the three core steps shown large.
const STEPS: HowToStep[] = [
  { title: "Open", body: "Open the pack", image: "/feelz-creative/steps/open.webp" },
  { title: "Place", body: "Place the strip on your tongue", image: "/feelz-creative/steps/place.webp" },
  { title: "Dissolve", body: "Let it dissolve", image: "/feelz-creative/steps/dissolve.webp" },
];

export function HowItWorksSection() {
  return (
    <HowToUseSection
      id="how-it-works"
      bgClass="bg-feelz-berry"
      steps={STEPS}
      eyebrow="Wellness, without the routine"
      headline={["Open. Place.", "Dissolve."]}
    />
  );
}
