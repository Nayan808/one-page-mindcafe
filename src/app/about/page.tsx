"use client";

import Link from "next/link";
import Image from "next/image";
import { MilestonesSection } from "@/components/MilestonesSection";
import { FounderSection } from "@/components/FounderSection";
import { StorySection } from "@/components/StorySection";

// Mission/vision/founding story/milestones sourced from mindcafe.app's own
// real /about page (same company) rather than invented.
export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden text-[#f6efe4]" style={{ backgroundColor: "#150c1c" }}>
        <Image src="/about-hero.png" alt="" fill priority sizes="100vw" className="object-cover opacity-70" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(21,12,28,0.55) 0%, rgba(21,12,28,0.72) 55%, rgba(21,12,28,0.92) 100%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 sm:py-28">
          <p className="text-[11px] font-semibold uppercase tracking-label text-[#f4ead9]/70">About Mindcafe</p>
          <h1 className="font-display mx-auto mt-4 max-w-xl text-4xl font-bold leading-[1.15] text-[#f6efe4] sm:text-5xl">
            A world where seeking support is as natural as offering a hand.
          </h1>
          <p className="mt-4 text-sm text-[#f4ead9]/70 sm:text-base">
            Our mission: make mental wellness practical, accessible, and relevant, part of everyday life, not just
            something for crisis moments.
          </p>
        </div>
      </section>

      <StorySection />

      <MilestonesSection />

      <FounderSection />

      <section className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-cream text-ink sm:-mt-12 sm:rounded-t-[3rem]">
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
