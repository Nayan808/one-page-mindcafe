"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { ArrowRight, Check, Gift, Loader2 } from "lucide-react";
import { MoodAmbience } from "@/components/feelz/MoodAmbience";
import { formatInr } from "@/lib/utils";

// Closing call-to-action on each mood's product page. Same family as the
// other mood-coloured sections (shared MoodAmbience background, a single
// slow type row along the bottom) but its own idea: the headline sits at
// the centre of a fine dashed "orbit" that slowly flows, with the mood's
// ingredients resting on it in white coins that gently float. The coins
// are white because the ingredient shots have a baked-in white
// background — a white coin hides that edge cleanly instead of showing a
// pale square. Entrance (once, data-inview): headline lines rise from
// behind a mask, the orbit fades in, coins settle in one by one, then
// the buttons. Styles: .closing-* in globals.css.
//
// Coin positions are fixed points on the orbit's ellipse (rx 28rem, ry
// 13rem), on its left and right flanks so they never sit over the
// headline; desktop only, where there's room for the ring.
const COIN_SPOTS = [
  { x: -388, y: -104 },
  { x: -400, y: 96 },
  { x: 388, y: -104 },
  { x: 400, y: 96 },
];

type Props = {
  label: string;
  bgClass: string;
  headline: string;
  sub: string;
  ingredientImages: { name: string; image: string }[];
  price: number | null;
  onAdd: () => void;
  addDisabled: boolean;
  addPending: boolean;
  addDone: boolean;
  bundlePrice: number;
  onAddBundle: () => void;
  bundleDisabled: boolean;
  bundlePending: boolean;
  bundleDone: boolean;
};

export function ClosingCtaSection({
  label,
  bgClass,
  headline,
  sub,
  ingredientImages,
  price,
  onAdd,
  addDisabled,
  addPending,
  addDone,
  bundlePrice,
  onAddBundle,
  bundleDisabled,
  bundlePending,
  bundleDone,
}: Props) {
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
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // "More moments that feel like you. Get in the zone." → a solid first
  // line and an italic second line.
  const splitAt = headline.indexOf(". ");
  const lines =
    splitAt > 0
      ? [
          { text: headline.slice(0, splitAt + 1), italic: false },
          { text: headline.slice(splitAt + 2), italic: true },
        ]
      : [{ text: headline, italic: false }];

  const phrase = sub.replace(/\.$/, "").split(". ").join(" · ");

  return (
    <section className={`relative isolate overflow-hidden ${bgClass} py-24 text-center text-feelz-cream sm:py-32`}>
      <MoodAmbience typeRows="bottom" phrase={<>{phrase} ·</>} />

      <div ref={ref} data-inview={inView ? "" : undefined} className="closing relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Orbit + ingredient coins (desktop). */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden lg:block" aria-hidden>
          <svg className="closing-orbit absolute left-1/2 top-1/2 h-[26rem] w-[56rem] -translate-x-1/2 -translate-y-1/2 overflow-visible" viewBox="0 0 896 416">
            <ellipse cx="448" cy="208" rx="447" ry="207" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <ellipse
              cx="448"
              cy="208"
              rx="447"
              ry="207"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1"
              strokeDasharray="2 14"
              strokeLinecap="round"
              className="closing-orbit-flow"
            />
          </svg>
          {ingredientImages.slice(0, COIN_SPOTS.length).map((ingredient, index) => (
            <div
              key={ingredient.name}
              className="absolute"
              style={{ transform: `translate(calc(-50% + ${COIN_SPOTS[index].x}px), calc(-50% + ${COIN_SPOTS[index].y}px))` }}
            >
              <div className="closing-coin" style={{ "--i": index } as CSSProperties}>
                <div className="howto-strip [--r:0deg]" style={{ animationDelay: `${index * -2.4}s` }}>
                  <div className="relative h-24 w-24 overflow-hidden rounded-full bg-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] ring-4 ring-white/25">
                    <Image src={ingredient.image} alt="" fill sizes="96px" className="scale-[1.4] object-contain" />
                  </div>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-feelz-cream/75">{ingredient.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative mx-auto max-w-2xl">
          <p className="closing-fade text-[11px] font-semibold uppercase tracking-[0.3em] text-feelz-cream/70">
            Ready when you are
          </p>
          <h2 className="font-display mt-4 text-4xl font-bold leading-[1.08] sm:text-6xl">
            {lines.map((line, index) => (
              <span key={line.text} className="block overflow-hidden pb-[0.12em]">
                <span
                  className={`closing-line inline-block ${line.italic ? "font-tagline italic font-normal" : ""}`}
                  style={{ "--w": index } as CSSProperties}
                >
                  {line.text}
                </span>
              </span>
            ))}
          </h2>
          <p className="closing-fade mt-4 text-sm text-feelz-cream/80 sm:text-base">{sub}</p>

          <div className="closing-actions mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onAdd}
              disabled={addDisabled}
              className="group inline-flex items-center gap-3 rounded-full bg-feelz-cream py-3.5 pl-7 pr-3 text-sm font-semibold text-feelz-ink shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] transition hover:shadow-[0_24px_48px_-20px_rgba(0,0,0,0.7)] disabled:opacity-50"
            >
              {addDone ? "Added to cart" : "Add to cart"}
              {price !== null && <span className="text-feelz-ink/50">· {formatInr(price)}</span>}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-feelz-ink text-feelz-cream transition-transform duration-500 group-hover:translate-x-1">
                {addPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : addDone ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <ArrowRight className="h-4 w-4" aria-hidden />
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={onAddBundle}
              disabled={bundleDisabled}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-semibold text-feelz-cream backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
            >
              {bundlePending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : bundleDone ? <Check className="h-4 w-4" aria-hidden /> : <Gift className="h-4 w-4" aria-hidden />}
              {bundleDone ? "Bundle added" : `Get the bundle · ${formatInr(bundlePrice)}`}
            </button>
          </div>
          <p className="sr-only">FEELZ {label}</p>
        </div>
      </div>
    </section>
  );
}
