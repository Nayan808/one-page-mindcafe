"use client";

import { useState } from "react";
import Image from "next/image";
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
// The myth itself is always fully legible — no blur, no dimming — since
// the point isn't to obscure it, it's to correct it. The mindcafe logo is
// the one idle affordance (sitting by the "tap to reveal" hint, gently
// pulsing) and, on tap, becomes the thing that DOES the correcting: it
// slides left-to-right across the myth's own line, drawing the strike
// underneath it as it travels — the logo is the pen, not just a static
// icon. `left: 0% -> 100%` on an absolutely-positioned span works
// per-line because it's positioned against the myth's own <p>, and the
// underlying `background-size` bar grows on the exact same duration/
// easing so the line reads as something the logo is actively drawing
// rather than a coincidence. Once the logo finishes its pass
// (onAnimationComplete — a real Framer Motion callback, not a CSS
// transitionend that can silently not fire), the reality rises in with
// the same blur-clear motion as the homepage hero's "Understanding /
// Healing / Clarity" words settling into place. Each card is
// independent, so reading one doesn't spoil the others. The single
// "consult an expert" link at the end is the one deliberate promotional
// exception, a soft bridge out of the myths into real support.
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
        <p className="relative font-tagline text-xl italic leading-snug text-ink sm:text-2xl">
          {struck && (
            <motion.span
              className="pointer-events-none absolute -top-1.5 left-0 h-4 w-4 -translate-x-1/2"
              initial={{ left: "0%" }}
              animate={{ left: "100%" }}
              transition={{ duration: 0.9, ease: EASE }}
              onAnimationComplete={() => setRevealed(true)}
              aria-hidden
            >
              <Image src="/mindcafe-icon.png" alt="" fill className="object-contain drop-shadow" />
            </motion.span>
          )}
          <span
            className={`bg-gradient-to-r from-ink to-ink bg-center bg-no-repeat transition-[background-size] duration-[900ms] ease-in-out ${
              struck ? "bg-[length:100%_2px]" : "bg-[length:0%_2px]"
            }`}
          >
            {myth}
          </span>
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
              <span className="relative h-4 w-4 shrink-0 animate-pulse">
                <Image src="/mindcafe-icon.png" alt="" fill className="object-contain" />
              </span>
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
