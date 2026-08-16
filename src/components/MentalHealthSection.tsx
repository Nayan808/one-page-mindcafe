"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Homepage-only editorial break between the hero and the Feelz product
// teaser. Deliberately not about Mindcafe's own products or verticals —
// every other homepage section (Feelz teaser, counselling teaser, business
// mentions elsewhere) already sells something; this one exists purely to
// say something true about mental health itself before the page starts
// selling anything. Myth/reality is a standard mental-health-awareness
// format on purpose — general, non-clinical statements, no invented
// statistics.
//
// Strikeout reveal instead of tap-to-flip: the myth text renders normally
// (full-weight ink, not dimmed), and the strike itself is a bar that
// visibly grows across it — an animated `background-size` on the inline
// text span rather than a plain text-decoration-color fade (too subtle
// to read as motion) or an absolutely-positioned "drawn line" overlay
// (breaks on wrapped text). Backgrounds on inline elements paint
// per line-fragment, so when the myth wraps to two lines, each line
// grows its own bar to 100% of that line's own width at the same rate —
// both lines finish together with no JS text-measurement needed. All
// four cards fire together the moment the section scrolls into view, off
// one shared IntersectionObserver on the grid rather than per-card
// observers. Once a card's strike finishes, its reality appears
// underneath. The single "consult an expert" link at the end is the one
// deliberate promotional exception, a soft bridge out of the myths into
// real support.
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

function MythCard({ myth, reality, start }: { myth: string; reality: string; start: boolean }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative flex min-h-[16rem] flex-col items-center gap-3 rounded-3xl border border-ink/10 bg-white p-7 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-label text-ink/35">Myth</span>

      <div className="flex flex-1 items-center justify-center">
        <p className="font-tagline text-xl italic leading-snug text-ink sm:text-2xl">
          <span
            onTransitionEnd={(e) => {
              if (e.propertyName === "background-size") setRevealed(true);
            }}
            className={`bg-gradient-to-r from-ink to-ink bg-center bg-no-repeat transition-[background-size] duration-[900ms] ease-in-out ${
              start ? "bg-[length:100%_2px]" : "bg-[length:0%_2px]"
            }`}
          >
            {myth}
          </span>
        </p>
      </div>

      <div className="min-h-[4.5rem]">
        {revealed && (
          <>
            <span className="text-[10px] font-semibold uppercase tracking-label text-brand">Reality</span>
            <p className="mt-1 text-base font-medium leading-relaxed text-ink sm:text-lg">{reality}</p>
          </>
        )}
      </div>
    </div>
  );
}

export function MentalHealthSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStart(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">Mental Health, Plainly</p>
          <h2 className="font-display mt-2 text-4xl font-bold leading-[1.1] text-ink sm:text-5xl">
            What we get wrong <span className="font-tagline italic text-brand">about mental health.</span>
          </h2>
        </div>

        <div ref={containerRef} className="mt-12 grid gap-5 sm:grid-cols-2">
          {MYTHS.map((item) => (
            <MythCard key={item.myth} myth={item.myth} reality={item.reality} start={start} />
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
