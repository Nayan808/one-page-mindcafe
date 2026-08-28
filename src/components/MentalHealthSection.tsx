"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { EASE, useCalmMotion } from "@/components/motion/primitives";

// Homepage-only editorial break between the hero and the Feelz product
// teaser. Deliberately not about Mindcafe's own products or verticals —
// every other homepage section (Feelz teaser, counselling teaser, business
// mentions elsewhere) already sells something; this one exists purely to
// say something true about mental health itself before the page starts
// selling anything. Myth/reality is a standard mental-health-awareness
// format on purpose — general, non-clinical statements, no invented
// statistics.
//
// The interaction is built around a metaphor that's actually about mental
// health, not a generic UI trick: a myth is something UNCLEAR — so it
// renders soft-focus and muted — and tapping it is the act of bringing it
// into clarity. The strike-through still grows across it (an animated
// `background-size` on the inline text span, since a plain text-decoration
// fade reads as too subtle, and an absolutely-positioned "drawn line"
// overlay breaks on wrapped text), but now alongside the blur lifting and
// the ink darkening to full weight — the text visibly comes into focus as
// it's corrected. The reality that follows rises in with the same
// blur-clear motion (same EASE curve, same shape) as the homepage hero's
// "Understanding / Healing / Clarity" words settling into place — the same
// idea, reused, rather than a one-off animation invented for this card.
// Each card is independent, so reading one doesn't spoil the others. The
// single "consult an expert" link at the end is the one deliberate
// promotional exception, a soft bridge out of the myths into real support.
const MYTHS = [
  {
    myth: "Only “serious” problems count as mental health issues.",
    reality: "Stress, burnout, and feeling low count too. You don't need a diagnosis to deserve support.",
  },
  {
    myth: "Needing help means you're weak.",
    reality: "Asking for support takes more self-awareness than pushing through alone.",
  },
  {
    myth: "You should be able to just snap out of it.",
    reality: "Minds need real care and time to heal, the same way bodies do.",
  },
  {
    myth: "Talking about it makes it worse.",
    reality: "Naming what you feel is often the first step to feeling lighter.",
  },
];

function MythCard({ myth, reality }: { myth: string; reality: string }) {
  const calm = useCalmMotion();
  const [struck, setStruck] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setStruck(true)}
      disabled={struck}
      aria-label={struck ? undefined : `Bring into focus: ${myth}`}
      className="relative flex w-full min-h-[16rem] flex-col items-center gap-3 rounded-3xl border border-ink/10 bg-white p-7 text-center transition-shadow enabled:cursor-pointer enabled:hover:shadow-[0_10px_28px_-18px_rgba(17,17,16,0.35)] disabled:cursor-default"
    >
      <span className="text-[10px] font-semibold uppercase tracking-label text-ink/35">Myth</span>

      <div className="flex flex-1 items-center justify-center">
        <p className="font-tagline text-xl italic leading-snug sm:text-2xl">
          {/* Two nested spans, not one — Framer Motion takes over this
              element's own `transition` CSS property to run the `filter`
              animation, which silently breaks a plain CSS transition
              declared on the same element. Splitting the blur (outer,
              Framer-driven) from the strike/color (inner, plain CSS)
              keeps both animations — and the onTransitionEnd this relies
              on to reveal the reality — working independently. */}
          <motion.span
            animate={calm ? undefined : { filter: struck ? "blur(0px)" : "blur(3px)" }}
            transition={{ duration: 0.9, ease: EASE }}
            className="inline-block"
          >
            <span
              onTransitionEnd={(e) => {
                if (e.propertyName === "background-size") setRevealed(true);
              }}
              className={`bg-gradient-to-r from-ink to-ink bg-center bg-no-repeat transition-[background-size,color] duration-[900ms] ease-in-out ${
                struck ? "bg-[length:100%_2px] text-ink" : "bg-[length:0%_2px] text-ink/45"
              }`}
            >
              {myth}
            </span>
          </motion.span>
        </p>
      </div>

      <div className="min-h-[4.5rem]">
        {revealed ? (
          <motion.div
            initial={calm ? false : { opacity: 0, y: 10, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.75, ease: EASE }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-label text-brand">Reality</span>
            <p className="mt-1 text-base font-medium leading-relaxed text-ink sm:text-lg">{reality}</p>
          </motion.div>
        ) : (
          !struck && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/40">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand/50" aria-hidden />
              Tap to bring this into focus
            </span>
          )
        )}
      </div>
    </button>
  );
}

export function MentalHealthSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">Mental Health, Plainly</p>
          <h2 className="font-display mt-2 text-4xl font-bold leading-[1.1] text-ink sm:text-5xl">
            What we get wrong <span className="font-tagline italic text-brand">about mental health.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {MYTHS.map((item) => (
            <MythCard key={item.myth} myth={item.myth} reality={item.reality} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/book-appointment" className="pill-btn">
            Consult an Expert
          </Link>
        </div>
      </div>
    </section>
  );
}
