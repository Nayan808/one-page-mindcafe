"use client";

import Link from "next/link";
import { MilestonesSection } from "@/components/MilestonesSection";
import { FounderSection } from "@/components/FounderSection";
import { StorySection } from "@/components/StorySection";
import { HeroBackdrop } from "@/components/hero/HeroBackdrop";

// Mission/vision/founding story/milestones sourced from mindcafe.app's own
// real /about page (same company) rather than invented.
export default function AboutPage() {
  return (
    <div>
      <section className="relative -mt-16 overflow-hidden bg-cream sm:-mt-[76px]">
        <HeroBackdrop src="/about-hero-v2.png" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-40 sm:px-6 sm:pb-28 sm:pt-[188px]">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/60">About Mindcafe</p>
            <h1 className="font-display mt-4 text-4xl font-bold leading-[1.15] text-ink sm:text-5xl">
              A world where seeking support is as natural as offering a hand.
            </h1>
            <div className="mt-6 h-px w-12 bg-ink/15" aria-hidden />
            <p className="mt-6 text-sm text-ink/70 sm:text-base">
              Our mission: make mental wellness practical, accessible, and relevant, part of everyday life, not just
              something for crisis moments.
            </p>
          </div>
        </div>
      </section>

      <StorySection />

      <MilestonesSection />

      <FounderSection />

      <section className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-surface text-ink sm:-mt-12 sm:rounded-t-[3rem]">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-4xl font-bold leading-[1.1] sm:text-5xl">
            Ready to be part of the <span className="font-tagline italic text-brand">Mindcafe story?</span>
          </h2>
          <p className="mt-4 text-sm text-ink/70 sm:text-base">
            Whether you need personal support or want to bring wellness to your organisation, Mindcafe is here for
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
