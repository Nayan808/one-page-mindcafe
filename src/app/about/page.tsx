"use client";

import Link from "next/link";
import { MilestonesSection } from "@/components/MilestonesSection";
import { FounderSection } from "@/components/FounderSection";
import { StorySection } from "@/components/StorySection";

// Mission/vision/founding story/milestones sourced from mindcafe.app's own
// real /about page (same company) rather than invented.
export default function AboutPage() {
  return (
    <div>
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-label text-cream/60">about mindcafé</p>
          <h1 className="font-display mx-auto mt-4 max-w-xl text-3xl font-bold lowercase leading-[1.15] sm:text-4xl">
            a world where seeking support is as natural as offering a hand.
          </h1>
          <p className="mt-4 text-sm text-cream/70 sm:text-base">
            Our mission: make mental wellness practical, accessible, and relevant — part of everyday life, not just
            something for crisis moments.
          </p>
        </div>
      </section>

      <StorySection />

      <MilestonesSection />

      <FounderSection />

      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold lowercase leading-[1.1] sm:text-4xl">
            ready to be part of the <span className="font-tagline italic">mindcafé story?</span>
          </h2>
          <p className="mt-4 text-sm text-cream/70 sm:text-base">
            Whether you need personal support or want to bring wellness to your organisation, Mindcafé is here for
            you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/book-appointment" className="pill-btn-white">
              book a session →
            </Link>
            <Link href="/feelz" className="pill-btn-outline !border-cream/30 !text-cream hover:!bg-cream/10">
              explore feelz
            </Link>
            <Link href="/business" className="pill-btn-outline !border-cream/30 !text-cream hover:!bg-cream/10">
              for business
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
