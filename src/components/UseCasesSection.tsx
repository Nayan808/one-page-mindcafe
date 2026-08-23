"use client";

import { motion } from "motion/react";
import { DrawLine, EASE, MaskLine, RiseIn, useCalmMotion } from "@/components/motion/primitives";

// "Built for modern India" use-case list — sits right after the Feelz
// product teaser. Deliberately NOT another icon-in-a-circle card grid:
// that reads as generic template filler, and the Feelz teaser plus the
// counselling experts section right after this one already cover the
// "photo card grid" pattern. This is a numbered editorial list instead —
// large faint index numerals, a divider between rows, no icons — a
// different visual language while staying in the same cream/ink theme
// (font-display, border-ink/10, Reveal scroll-in).
const USE_CASES = [
  {
    title: "Travelling India",
    body: "Stay fresh, focused, and balanced through long journeys, changing schedules, and life on the move.",
  },
  {
    title: "Remote work",
    body: "Stay clear and productive when your workspace changes every day.",
  },
  {
    title: "Digital overload",
    body: "Reset when screens, notifications, and constant input drain your energy.",
  },
  {
    title: "Social ease",
    body: "Feel more comfortable meeting new people, speaking up, and entering new spaces.",
  },
  {
    title: "Better sleep",
    body: "Unwind after long days, calm the mind, and wake up feeling restored.",
  },
];

export function UseCasesSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <RiseIn y={8} blur={3} amount={0.6}>
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">
              Built for Modern India
            </p>
          </RiseIn>

          {/* Two masked lines rather than one fade: the heading arrives as a
              statement in two beats, which is what makes it read editorial. */}
          <h2 className="font-display mt-2 text-5xl font-bold tracking-tight text-ink sm:text-6xl">
            <MaskLine delay={0.15}>For every moment</MaskLine>
            <MaskLine delay={0.32}>your brain needs support</MaskLine>
          </h2>
        </div>

        <DrawLine className="mt-14 h-px w-full bg-ink/10" origin="center" />

        <div className="divide-y divide-ink/10">
          {USE_CASES.map((item, index) => (
            <UseCaseRow key={item.title} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * One row of the editorial list.
 *
 * Two separate things happen here, and keeping them separate is the point:
 *
 *  ENTRANCE (once)   number, then title, then body — a left-to-right
 *                    sequence, so the eye reads the row the way it would
 *                    read a printed index.
 *  ACTIVE STATE      whileInView with once:false and a tall amount, so the
 *                    row the reader is actually level with lifts slightly
 *                    out of the list and the others stay understated. This
 *                    is what gives the list a sense of progression instead
 *                    of being five identical entries.
 */
function UseCaseRow({ item, index }: { item: (typeof USE_CASES)[number]; index: number }) {
  const calm = useCalmMotion();
  const base = index * 0.06;

  return (
    <motion.div
      className="group flex flex-col items-center gap-y-1.5 py-7 text-center transition-colors duration-500 hover:bg-ink/[0.02] sm:grid sm:grid-cols-[4.5rem_16rem_1fr] sm:flex-row sm:items-center sm:gap-x-10 sm:gap-y-0 sm:px-4 sm:text-left"
      initial={calm ? false : { opacity: 0.45 }}
      whileInView={{ opacity: 1 }}
      viewport={{ amount: 0.75 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <RiseIn delay={base} y={0} blur={3} duration={0.7} amount={0.5}>
        <span className="font-display block text-3xl font-bold text-ink/15 transition-colors duration-500 group-hover:text-ink/30 sm:text-4xl">
          {String(index + 1).padStart(2, "0")}
        </span>
      </RiseIn>

      <RiseIn delay={base + 0.1} y={10} blur={4} duration={0.75} amount={0.5}>
        <h3 className="font-display text-lg font-bold text-ink sm:text-xl">{item.title}</h3>
      </RiseIn>

      <RiseIn delay={base + 0.2} y={10} blur={4} duration={0.8} amount={0.5}>
        <p className="max-w-xs text-sm leading-relaxed text-ink/60 sm:max-w-none">{item.body}</p>
      </RiseIn>
    </motion.div>
  );
}
