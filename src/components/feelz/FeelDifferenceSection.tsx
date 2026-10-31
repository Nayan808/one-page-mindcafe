"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { MoodAmbience } from "@/components/feelz/MoodAmbience";

// "Feel the difference." on each mood's product page — the mood's three
// benefit moments (FEELZ_PRODUCT_PAGES[mood].benefits). Same visual
// language as HowToUseSection (shared MoodAmbience background, mirrored so
// the two don't look stamped from one mould) but its own shape: landscape
// "leaf" frames (fit the 3:2 photos), the middle one larger and lifted,
// each with a hairline outline set slightly askew behind it and a glass
// caption card overlapping its bottom edge. Entrance (once, when the row
// scrolls into view — data-inview): each frame opens vertically from its
// centre, left → right, then its caption rises. Styles: .feeldiff-* in
// globals.css.
type Benefit = { label: string; sub: string; image: string };

// One-shot "has scrolled into view" flag for an element.
function useInViewOnce<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

export function FeelDifferenceSection({ label, bgClass, benefits }: { label: string; bgClass: string; benefits: Benefit[] }) {
  const [headRef, headInView] = useInViewOnce<HTMLDivElement>(0.3);
  const [rowRef, inView] = useInViewOnce<HTMLDivElement>(0.2);
  // Which benefit the typographic index (and its matching card) is
  // highlighting. Cycles slowly once the header is in view; hovering a
  // line picks it and pauses the cycle. No cycling under reduced-motion.
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!headInView || paused || benefits.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % benefits.length), 3200);
    return () => window.clearInterval(id);
  }, [headInView, paused, benefits.length]);

  const mood = label.toLowerCase();

  return (
    <section className={`relative isolate overflow-hidden ${bgClass} py-20 text-feelz-cream sm:py-28`}>
      <MoodAmbience
        mirror
        typeRows="bottom"
        phrase={
          <>
            Feel · More · <span className="font-tagline italic font-normal">{label}</span> ·
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header: headline left, a typographic "index" of the three
            benefits right — deliberately unlike HowToUseSection's
            left/seal/right split. Each benefit is set large in outlined
            type; the active one fills with white (an ink sweep via
            background-clip:text) and shows its italic sub-line, cycling
            slowly; the matching card below is highlighted in sync. Styles:
            .feeldiff-head*, .feeldiff-word, .feeldiff-index-* in
            globals.css. */}
        <div
          ref={headRef}
          data-inview={headInView ? "" : undefined}
          className="feeldiff-head grid items-end gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-feelz-cream/70">The FEELZ effect</p>
            <h2 className="font-display mt-4 text-5xl font-bold leading-[1.02] sm:text-7xl">
              {[
                { text: "Feel the", italic: false },
                { text: "difference.", italic: true },
              ].map((line, index) => (
                <span key={line.text} className="block overflow-hidden pb-[0.12em] pr-[0.1em]">
                  <span
                    className={`feeldiff-word inline-block ${line.italic ? "font-tagline italic font-normal" : ""}`}
                    style={{ "--w": index } as CSSProperties}
                  >
                    {line.text}
                  </span>
                </span>
              ))}
            </h2>
            <p className="feeldiff-headcopy mt-5 max-w-sm text-sm leading-relaxed text-feelz-cream/80">
              A thoughtfully crafted blend to support your {mood}, for the moments that matter.
            </p>
          </div>

          <ul className="border-b border-white/20" onMouseLeave={() => setPaused(false)}>
            {benefits.map((benefit, index) => (
              <li
                key={benefit.label}
                data-active={index === active ? "" : undefined}
                onMouseEnter={() => {
                  setActive(index);
                  setPaused(true);
                }}
                className="feeldiff-index-row flex cursor-default items-baseline gap-4 border-t border-white/20 py-3 sm:gap-6 sm:py-4"
                style={{ "--w": index + 1 } as CSSProperties}
              >
                <span className="w-6 shrink-0 text-[10px] font-semibold tracking-[0.3em] text-feelz-cream/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="feeldiff-index-word font-display text-3xl font-bold leading-none sm:text-5xl">{benefit.label}</span>
                <span className="feeldiff-index-sub font-tagline ml-auto hidden shrink-0 text-base italic text-feelz-cream/85 sm:block">
                  {benefit.sub}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Phones: a swipeable row; desktop: three across, middle lifted.
            The benefit photos are landscape (≈3:2), so the frame is a 4:3
            "leaf" — two large opposite corners, alternating direction per
            card — which keeps nearly the whole photo. --leaf (tl tr br bl)
            drives both the CSS radius and the entrance clip-path. The
            caption is a glass card overlapping the bottom edge, outside
            the clipped frame, so nothing is cut by the curve. */}
        <div
          ref={rowRef}
          data-inview={inView ? "" : undefined}
          className="feeldiff scrollbar-hide -mx-4 mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-14 pt-4 sm:mt-16 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-10 lg:overflow-visible lg:px-0 lg:pt-12"
        >
          {benefits.map((benefit, index) => {
            const isCenter = index === 1;
            const leaf = index % 2 === 0 ? "96px 20px 96px 20px" : "20px 96px 20px 96px";
            return (
              <div
                key={benefit.label}
                className={`feeldiff-item group relative w-[78vw] max-w-[22rem] shrink-0 snap-center sm:w-[20rem] lg:w-full lg:max-w-none ${
                  isCenter ? "lg:-translate-y-10 lg:scale-[1.06]" : ""
                }`}
                data-active={index === active ? "" : undefined}
                style={{ "--i": index, "--leaf": leaf } as CSSProperties}
              >
                {/* Askew hairline outline of the same shape — straightens on hover. */}
                <span
                  className="feeldiff-outline absolute inset-x-0 top-0 aspect-[4/3] border border-white/35"
                  style={{ borderRadius: leaf }}
                  aria-hidden
                />
                <div
                  className="feeldiff-capsule relative aspect-[4/3] w-full overflow-hidden bg-white/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55)] ring-1 ring-white/25"
                  style={{ borderRadius: leaf }}
                >
                  <Image
                    src={benefit.image}
                    alt={benefit.label}
                    fill
                    sizes="(min-width: 1024px) 400px, 78vw"
                    className="feeldiff-photo object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden />
                </div>

                <div className="feeldiff-chip relative z-10 mx-5 -mt-10 rounded-2xl border border-white/35 bg-white/15 px-5 py-3.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[10px] font-semibold tracking-[0.3em] text-feelz-cream/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-display text-lg font-bold leading-tight">{benefit.label}</p>
                      <p className="font-tagline mt-0.5 text-sm italic text-feelz-cream/85">{benefit.sub}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
