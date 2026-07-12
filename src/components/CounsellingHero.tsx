import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Static hero (spec 4.4) — no DB call needed. Book/assessment are both
// real routes now (Phase 3) — booking is the primary path since it's the
// most direct; the assessment is offered as the "not sure yet" option,
// same framing spec 4.5 uses ("choose a category or take the assessment
// quiz first").
export function CounsellingHero() {
  return (
    <section className="bg-ink text-cream">
      <div className="mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <span className="rounded-full border border-cream/25 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-label text-cream/70">
          1:1 counselling
        </span>

        <h1 className="font-display mx-auto mt-6 max-w-2xl text-4xl leading-[1.05] font-bold lowercase tracking-tight sm:text-5xl">
          someone to talk to, when you need more than a mood strip.
        </h1>

        <p className="font-tagline mx-auto mt-6 max-w-lg text-lg italic text-cream/70 sm:text-xl">
          certified counsellors, private sessions, at your pace.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/book-appointment" className="pill-btn-white">
            book a session
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link href="/assessment" className="pill-btn-outline !border-cream/30 !text-cream hover:!bg-cream/10">
            not sure yet? take the assessment
          </Link>
        </div>
      </div>
    </section>
  );
}
