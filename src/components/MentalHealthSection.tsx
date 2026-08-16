"use client";

import { useState } from "react";
import Link from "next/link";
import { Pointer } from "lucide-react";
import { Reveal } from "@/components/Reveal";

// Homepage-only editorial break between the hero and the Feelz product
// teaser. Deliberately not about Mindcafe's own products or verticals —
// every other homepage section (Feelz teaser, counselling teaser, business
// mentions elsewhere) already sells something; this one exists purely to
// say something true about mental health itself before the page starts
// selling anything. Myth/reality is a standard mental-health-awareness
// format on purpose — general, non-clinical statements, no invented
// statistics.
//
// Flip cards (tap to reveal the reality) instead of a static list: every
// other content section on the homepage is either a static grid or a
// plain divided list, so this is the one section that asks for an
// interaction rather than just being read — fits the "Tear it. Place it.
// Feel it." playfulness already established in the hero. The single
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
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((current) => !current)}
      aria-pressed={flipped}
      className="group block w-full text-left [perspective:1400px]"
    >
      <div
        className={`relative min-h-[15rem] w-full transition-transform duration-500 ease-out [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front — the myth */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border border-ink/10 bg-white p-7 text-center [backface-visibility:hidden] group-hover:border-ink/20">
          <span className="text-[10px] font-semibold uppercase tracking-label text-ink/35">Myth</span>
          <p className="font-tagline text-xl italic leading-snug text-ink/55 line-through decoration-ink/30 sm:text-2xl">
            {myth}
          </p>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-label text-ink/30">
            <Pointer className="h-3 w-3" aria-hidden />
            tap to see the truth
          </span>
        </div>

        {/* Back — the reality */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border border-ink/10 bg-cream p-7 text-center text-ink [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="text-[10px] font-semibold uppercase tracking-label text-brand">Reality</span>
          <p className="text-base font-medium leading-relaxed sm:text-lg">{reality}</p>
        </div>
      </div>
    </button>
  );
}

export function MentalHealthSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">Mental Health, Plainly</p>
          <h2 className="font-display mt-2 text-4xl font-bold leading-[1.1] text-ink sm:text-5xl">
            What we get wrong <span className="font-tagline italic text-brand">about mental health.</span>
          </h2>
          <p className="mt-3 text-sm text-ink/50">Tap a card to see the truth.</p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {MYTHS.map((item, index) => (
            <Reveal key={item.myth} delayMs={index * 90}>
              <MythCard myth={item.myth} reality={item.reality} />
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={MYTHS.length * 90} className="mt-12 text-center">
          <Link href="/book-appointment" className="pill-btn">
            Consult an Expert
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
