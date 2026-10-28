"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { MoodAmbience } from "@/components/feelz/MoodAmbience";

// "Open. Place. Dissolve." on each mood's product page. Sits on that
// mood's colour (bgClass), layered with the shared MoodAmbience
// background so it never reads as a flat slab.
//
// The steps are arch-shaped photo frames in a staggered rhythm, with
// outlined numerals and a hairline that draws across behind them. They
// reveal once, left → right, when the row scrolls into view
// (data-inview). Also used on /feelz (HowItWorksSection) with its own
// five-step list via `steps`.
// `frame: "rect"` swaps the arch for a rounded rectangle — for photos that
// fill the whole frame edge to edge (e.g. the four packs), which an arch's
// round top would crop.
// `aspect` overrides the default 3:4 frame (CSS aspect-ratio, e.g. "928 / 1382")
// so a photo can fill its frame exactly, with no crop and no gap.
export type HowToStep = { title: string; body: string; image: string; frame?: "arch" | "rect"; aspect?: string };

const COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six"];

export function HowToUseSection({
  label = "",
  bgClass,
  steps: customSteps,
  id,
  eyebrow = "How it works",
  headline = ["Open. Place.", "Dissolve."],
}: {
  label?: string;
  bgClass: string;
  steps?: HowToStep[];
  id?: string;
  eyebrow?: string;
  /** Two lines: the second is set in italics. */
  headline?: [string, string];
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = rowRef.current;
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

  const steps: HowToStep[] = customSteps ?? [
    // Square photos in rounded-square frames with no shading over them, so
    // every corner of each photo stays visible and true to colour.
    { title: "Open", body: "Tear open the sachet", image: "/feelz-creative/steps/open-v4.webp", aspect: "1 / 1", frame: "rect" },
    { title: "Place", body: "Place one strip on your tongue", image: "/feelz-creative/steps/place-v4.webp", aspect: "1 / 1", frame: "rect" },
    { title: "Dissolve", body: "Let it melt in seconds", image: "/feelz-creative/steps/dissolve-v4.webp", aspect: "1 / 1", frame: "rect" },
  ];
  const countWord = COUNT_WORDS[steps.length] ?? String(steps.length);

  return (
    <section id={id} className={`relative isolate scroll-mt-24 overflow-hidden ${bgClass} py-20 text-feelz-cream sm:py-28`}>
      <MoodAmbience
        phrase={
          <>
            Open · Place · <span className="font-tagline italic font-normal">Dissolve</span> ·
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-feelz-cream/70">{eyebrow}</p>
            <h2 className="font-display mt-3 text-4xl font-bold leading-[1.05] sm:text-6xl">
              {headline[0]}
              <br />
              <span className="font-tagline italic font-normal">{headline[1]}</span>
            </h2>
          </div>

          {/* Rotating seal — circular type around a tilted strip. */}
          <div className="relative hidden h-40 w-40 lg:block" aria-hidden>
            <svg viewBox="0 0 200 200" className="howto-seal absolute inset-0 h-full w-full">
              <defs>
                <path id="howto-seal-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
              </defs>
              <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              <text className="fill-white/80 text-[12px] font-semibold uppercase">
                {/* textLength spreads the phrase exactly once around the ring (2π·78 ≈ 490). */}
                <textPath href="#howto-seal-path" textLength="484" lengthAdjust="spacing">
                  No water • No waiting • Melts in seconds •
                </textPath>
              </text>
            </svg>
            <span className="absolute left-1/2 top-1/2 h-14 w-10 -translate-x-1/2 -translate-y-1/2 rotate-[14deg] rounded-md border border-white/40 bg-white/20 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5)] backdrop-blur-sm" />
          </div>

          <div className="lg:justify-self-end lg:text-right">
            <p className="max-w-xs text-sm leading-relaxed text-feelz-cream/80 lg:ml-auto">
              A simple, no-fuss routine — {countWord} steps, anywhere your day takes you.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 lg:justify-end">
              {["No water", "No waiting", "Melts in seconds"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-feelz-cream backdrop-blur-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div ref={rowRef} data-inview={inView ? "" : undefined} className="howto relative mt-12 sm:mt-16">
          {/* Hairline through the row, drawn left → right on entrance. */}
          <span className="howto-hairline absolute left-0 right-0 top-[38%] hidden h-px bg-white/30 lg:block" aria-hidden />

          <div
            className={`grid grid-cols-2 gap-x-5 gap-y-12 lg:gap-x-8 ${
              steps.length === 5
                ? "lg:grid-cols-5 lg:gap-x-6"
                : steps.length === 3
                  ? "lg:mx-auto lg:max-w-5xl lg:grid-cols-3 lg:gap-x-12"
                  : "lg:grid-cols-4"
            }`}
          >
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`howto-step group relative ${index % 2 === 1 ? "lg:translate-y-12" : ""} ${
                  steps.length % 2 === 1 && index === steps.length - 1 ? "col-span-2 mx-auto w-1/2 lg:col-span-1 lg:mx-0 lg:w-auto" : ""
                }`}
                style={{ "--i": index } as CSSProperties}
              >
                <div
                  style={step.aspect ? { aspectRatio: step.aspect } : undefined}
                  className={`howto-arch relative aspect-[3/4] w-full overflow-hidden ${step.frame === "rect" ? "howto-arch-rect rounded-[28px]" : "rounded-b-[28px] rounded-t-[999px]"} bg-white/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55)] ring-1 ring-white/25`}>
                  <Image
                    src={step.image}
                    alt={step.body}
                    fill
                    sizes={steps.length === 3 ? "(min-width: 1024px) 340px, 45vw" : "(min-width: 1024px) 300px, 45vw"}
                    className="howto-photo object-cover"
                  />
                  {/* Soft vignette so the frame edge reads on light photos. */}
                  {step.frame !== "rect" && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden />
                  )}
                </div>

                <div className="howto-caption mt-5 flex items-start gap-3">
                  <span
                    className="font-display text-4xl font-bold leading-none text-transparent sm:text-5xl"
                    style={{ WebkitTextStroke: "1px rgba(255,255,255,0.7)" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="pt-0.5">
                    <p className="font-display text-lg font-bold leading-tight sm:text-xl">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-feelz-cream/75 sm:text-sm">{step.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
