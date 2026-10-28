"use client";

import Link from "next/link";
import { MilestonesSection } from "@/components/MilestonesSection";
import { FounderSection } from "@/components/FounderSection";
import { StorySection } from "@/components/StorySection";
import { ImageHero } from "@/components/hero/ImageHero";

// Mission/vision/founding story/milestones sourced from mindcafe.app's own
// real /about page (same company) rather than invented.
export default function AboutPage() {
  return (
    <div>
      {/* Client's finished hero artwork ("MINDCAFE - HERO SECTIONS/4.png"),
          shown exactly; see ImageHero. */}
      <ImageHero
        src="/heroes/about.webp"
        alt="Two people working through wellbeing tools together on a tablet."
        eyebrow="About mindcafe"
        title="Mental wellbeing, made"
        accent="easier to reach."
        body="mindcafe brings online counselling, self-assessments and everyday wellbeing tools together for individuals and workplaces."
        cta={{ left: 3.2, top: 74 }}
        mobileFocus="45%"
      />

      <StorySection />

      <MilestonesSection />

      <FounderSection />

      <section className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-surface text-ink sm:-mt-12 sm:rounded-t-[3rem]">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-4xl font-bold leading-[1.1] sm:text-5xl">
            Ready to be part of the <span className="font-tagline italic text-brand">mindcafe story?</span>
          </h2>
          <p className="mt-4 text-sm text-ink/70 sm:text-base">
            Whether you need personal support or want to bring wellness to your organisation, mindcafe is here for
            you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/book-appointment" className="pill-btn">
              Book a Session
            </Link>
            <Link href="/feelz" className="pill-btn-outline">
              Explore Feelz
            </Link>
            <Link href="/business" className="pill-btn-outline">
              For Business
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
