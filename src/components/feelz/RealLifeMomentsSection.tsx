"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";

type Moment = { label: string; note: string; image: string };

// "Real life moments" on each mood's product page — an editorial bento:
// the first moment large on the left, the other four in a 2×2 beside it,
// captions set on the photo over a soft gradient with a number and a
// hairline in the mood's colour. Phones get a swipeable row of tall cards.
//
// Motion (.moments-* in globals.css): once in view each card reveals
// upward in turn while its photo settles from a slight zoom, then its
// caption rises. Hover: slow photo zoom, caption lifts, hairline extends.
// Reduced-motion shows the finished grid.
export function RealLifeMomentsSection({
  moments,
  accentText,
  layout = "bento",
}: {
  moments: Moment[];
  /** "portrait": a row of tall cards for tall full-scene photos. */
  layout?: "bento" | "portrait";
  /** Mood colour classes (FEELZ_COLOR_CLASSES[...].text / .bg). */
  accentText: string;
  accentBg?: string;
}) {
  const portrait = layout === "portrait";
  const ref = useRef<HTMLDivElement>(null);
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
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={`mx-auto px-4 py-20 sm:px-6 ${portrait ? "max-w-[88rem]" : "max-w-7xl"}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${accentText}`}>Everyday, with FEELZ</p>
          <h2 className="font-display mt-3 text-3xl font-bold leading-tight text-feelz-ink sm:text-5xl">
            Real life <span className="font-tagline italic font-normal">moments.</span>
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-feelz-ink/60 sm:text-right">For the moments that need a little more you.</p>
      </div>

      <div
        ref={ref}
        data-inview={inView ? "" : undefined}
        className={`moments scrollbar-hide -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:gap-5 lg:overflow-visible lg:px-0 ${
          portrait ? "lg:grid-cols-5 lg:items-start lg:pb-10" : "lg:grid-cols-4 lg:grid-rows-[15rem_15rem]"
        }`}
      >
        {moments.map((moment, index) => {
          const isFeature = !portrait && index === 0;
          return (
            <article
              key={moment.label}
              className={`moments-card group relative w-[72vw] max-w-[20rem] shrink-0 snap-center overflow-hidden rounded-[1.75rem] bg-feelz-ink/5 shadow-[0_24px_48px_-28px_rgba(16,35,63,0.55)] ring-1 ring-feelz-ink/10 aspect-[4/5] lg:w-auto lg:max-w-none ${
                portrait ? `lg:aspect-[3/4] ${index % 2 === 1 ? "lg:translate-y-10" : ""}` : "lg:aspect-auto"
              } ${isFeature ? "lg:col-span-2 lg:row-span-2" : ""}`}
              style={{ "--i": index } as CSSProperties}
            >
              <Image
                src={moment.image}
                alt={moment.label}
                fill
                sizes={isFeature ? "(min-width: 1024px) 640px, 72vw" : "(min-width: 1024px) 340px, 72vw"}
                className="moments-photo object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" aria-hidden />

              <div className="moments-caption absolute inset-x-0 bottom-0 p-5 text-white transition-transform duration-500 ease-out group-hover:-translate-y-1 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold tracking-[0.3em] text-white/75">{String(index + 1).padStart(2, "0")}</span>
                  <span className="h-px w-6 bg-white/60 transition-all duration-500 group-hover:w-10" aria-hidden />
                </div>
                <h3 className={`font-display mt-2 font-bold leading-tight ${isFeature ? "text-2xl sm:text-3xl" : "text-lg"}`}>{moment.label}</h3>
                <p className={`font-tagline mt-1 italic text-white/85 ${isFeature ? "text-lg" : "text-sm"}`}>{moment.note}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
