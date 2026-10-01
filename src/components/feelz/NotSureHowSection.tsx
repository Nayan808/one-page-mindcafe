"use client";

import { HelpCircle } from "lucide-react";

// Real coded content, not the static creative image this used to be — but
// deliberately its OWN structure rather than reusing FinalCtaSection's
// dark-navy band: a light bordered card with an icon badge, so the two
// sections read as distinct moments rather than duplicates of each other.
export function NotSureHowSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-6 pt-16 sm:px-6 sm:pb-8">
      <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-feelz-ink/10 bg-feelz-paper p-10 text-center sm:flex-row sm:gap-8 sm:p-12 sm:text-left">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-feelz-berry/10">
          <HelpCircle className="h-7 w-7 text-feelz-berry" aria-hidden />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-feelz-ink sm:text-3xl">Not sure how FEELZ works?</h2>
          <p className="mt-2 text-sm text-feelz-ink/60">
            No water. No complicated routine. Just a tiny strip designed to fit into your moment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-feelz-berry px-6 py-3 text-sm font-semibold text-feelz-cream transition hover:opacity-90"
        >
          Show me how →
        </button>
      </div>
    </section>
  );
}
