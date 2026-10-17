import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Mindcafe Assessments — Coming soon",
  description:
    "Our mental health self-assessments are coming soon. Take a moment to check in with yourself and think about what support may help.",
};

const INSTAGRAM_URL = "https://www.instagram.com/feelzbymindcafe/";

// "Mindcafe Assessments — coming soon". Desktop shows the client's finished
// design exactly ("Mindcafe Assessments.png" → public/heroes/assessments.webp)
// with a real link laid over its drawn "Follow us on Instagram" button
// (positioned in % of the artwork). Below lg the artwork's small type would
// be unreadable, so phones/tablets get the same layout as live text.
export default function AssessmentsPage() {
  return (
    <section className="relative -mt-16 overflow-hidden bg-[#fcf6f5] sm:-mt-[76px]">
      {/* Desktop: the design at full width, sized to fit the screen on load
          (same approach as ImageHero): the stage is the screen height under
          the announcement bar, capped at the design's own height; any excess
          is trimmed, 45% from the top (empty) and the rest from the bottom. */}
      <div
        className="relative hidden w-full overflow-hidden lg:block"
        style={{ containerType: "size", height: "min(calc(100svh - var(--announce-h, 0px)), calc(100vw * 992 / 1586))" }}
      >
        <div className="absolute inset-x-0 aspect-[1586/992]" style={{ top: "calc((100cqh - 100cqw * 992 / 1586) * 0.45)" }}>
          <Image src="/heroes/assessments.webp" alt="" fill priority sizes="100vw" quality={92} className="imghero-art object-cover" />
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Follow us on Instagram"
            className="absolute rounded-full transition duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_18px_36px_-14px_rgba(143,66,102,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-feelz-berry"
            style={{ left: "36.76%", top: "74.5%", width: "26.55%", height: "7.06%" }}
          />
        </div>
      </div>

      {/* Phones / tablets: same design as live text. */}
      <div className="relative px-6 pb-20 pt-32 text-center lg:hidden">
        <div className="pointer-events-none absolute inset-x-[-20%] top-24 bottom-6 rounded-[50%] bg-[#f6e8ec]/80 blur-2xl" aria-hidden />
        <div className="relative">
          <p className="text-3xl font-bold tracking-tight text-[#a8567c] sm:text-4xl">MINDCAFE ASSESSMENTS</p>
          <p className="mt-2 text-xs font-bold tracking-[0.5em] text-feelz-ink">COMING SOON...</p>
          <h1 className="mt-10 text-4xl font-semibold leading-[1.1] tracking-tight text-feelz-ink sm:text-5xl">
            Not sure how you&apos;ve been feeling <span className="italic text-[#a8567c]">lately?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-feelz-ink/80">
            Our mental health self-assessments are coming soon. Take a moment to check in with yourself and think
            about what support may help.
          </p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#a8567c] px-8 py-4 text-base font-medium text-white shadow-[0_18px_36px_-16px_rgba(143,66,102,0.7)]"
          >
            Follow us on Instagram
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <p className="mx-auto mt-8 max-w-sm text-sm font-semibold text-feelz-ink/50">
            Understand what&apos;s been on your mind, and FIND A PLACE TO START
          </p>
        </div>
      </div>

      {/* The design's words, for screen readers / search on desktop. */}
      <div className="sr-only hidden lg:block">
        <p>Mindcafe Assessments</p>
        <p>Coming soon...</p>
        <h1>Not sure how you&apos;ve been feeling lately?</h1>
        <p>
          Our mental health self-assessments are coming soon. Take a moment to check in with yourself and think about
          what support may help.
        </p>
        <p>Understand what&apos;s been on your mind, and find a place to start.</p>
      </div>
    </section>
  );
}
