"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Bell, FlaskConical, Sparkles, Droplet } from "lucide-react";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";

// "A calmer, happier you — in seconds." — a four-beat story (problem →
// small strip → plant-powered formulation → feel the difference) told as
// one synced piece: four expanding panels on the left (the active one
// glides open, the rest fold to slim labelled slivers) and a timeline on
// the right advance together. Replaces the earlier fanned photo deck and
// sticky-note collage, which read as busy.
//
// Every beat uses a real, high-resolution photo (product shots are
// 1254–1400px, moments 900px) so the open panel stays sharp — the small
// wisdom/ crops (~340px) looked soft blown up this large. Beat 1 also
// floats the everyday "noise" words over its photo. The story auto-advances only while the
// section is on screen (and never under reduced-motion), with thin
// "story" bars under the panels showing the dwell time; choosing a step
// jumps to it and pauses the cycle for a while. Styles: .calmer-* in
// globals.css.
const DWELL_MS = 2200;

const STEPS = [
  {
    n: "01",
    icon: Bell,
    title: "Life gets loud.",
    body: "Deadlines, notifications and a never-ending to-do list can throw you off balance.",
    color: FEELZ_COLOR_CLASSES["feelz-berry"],
    image: "/feelz-creative/calmer/daydream.webp",
    focus: "50% 50%",
    // A collage with moments in every corner — shown whole.
    fit: "contain",
    caption: "The everyday noise",
  },
  {
    n: "02",
    icon: Droplet,
    title: "A small strip. A big shift.",
    body: "Place a FEELZ strip on your tongue — no water needed. It starts dissolving in seconds.",
    color: FEELZ_COLOR_CLASSES["feelz-orange"],
    image: "/feelz-creative/calmer/strip-tongue.webp",
    focus: "38% 50%",
    caption: "Melts in seconds",
  },
  {
    n: "03",
    icon: FlaskConical,
    title: "Plant-powered, formulated with care.",
    body: "A fast-dissolving strip built around botanical actives chosen for mood, calm and clarity.",
    color: FEELZ_COLOR_CLASSES["feelz-navy"],
    image: "/feelz-creative/calmer/joy.webp",
    focus: "50% 50%",
    // Four ingredient bowls, one per corner — shown whole.
    fit: "contain",
    caption: "Real botanicals",
  },
  {
    n: "04",
    icon: Sparkles,
    title: "Feel the difference.",
    body: "A calmer, more present you — ready for whatever's next.",
    color: FEELZ_COLOR_CLASSES["feelz-rest"],
    image: "/feelz-creative/moments/extrovert-everyday-v3.webp",
    focus: "73% 30%",
    caption: "Your moment",
  },
];

// Beat 1's "noise": words scattered through the frame, each drifting on
// its own slow loop.
const NOISE = [
  { word: "Deadlines", className: "left-[10%] top-[14%] text-3xl font-display font-bold", r: "-6deg" },
  { word: "Calls", className: "right-[12%] top-[24%] text-2xl font-tagline italic", r: "5deg" },
  { word: "To-dos", className: "left-[18%] top-[44%] text-4xl font-tagline italic", r: "3deg" },
  { word: "Notifications", className: "right-[8%] top-[58%] text-xl font-display font-bold", r: "-4deg" },
  { word: "Social plans", className: "left-[12%] bottom-[14%] text-2xl font-display font-bold", r: "4deg" },
  { word: "Emails", className: "right-[16%] bottom-[22%] text-lg font-tagline italic", r: "-8deg" },
];

export function CalmerYouSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const isPlaying = inView && !reducedMotion && Date.now() >= pausedUntil;

  // One timeout per beat (rather than an interval) so the story bar's CSS
  // fill and the actual advance always start together.
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % STEPS.length), DWELL_MS);
    return () => window.clearTimeout(id);
  }, [isPlaying, active]);

  // Resume after a manual pick's pause runs out.
  useEffect(() => {
    if (!pausedUntil) return;
    const id = window.setTimeout(() => setPausedUntil(0), Math.max(0, pausedUntil - Date.now()));
    return () => window.clearTimeout(id);
  }, [pausedUntil]);

  function choose(index: number) {
    setActive(index);
    setPausedUntil(Date.now() + 8000);
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-y border-feelz-ink/10 bg-feelz-cream py-20 sm:py-28">
      {/* Soft colour blooms in the section's own palette. */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-feelz-orange/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-feelz-berry/15 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-feelz-berry">Feel better. Think better. Live better.</p>
          <h2 className="font-display mt-4 text-3xl font-bold leading-[1.1] text-feelz-ink sm:text-5xl">
            A calmer, happier you <span className="font-tagline italic font-normal">— in seconds.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-[32rem_minmax(0,1fr)] lg:items-center lg:gap-20">
          {/* --- The frame --- */}
          <Reveal delayMs={80} className="mx-auto w-full max-w-md lg:max-w-none">
            {/* Expanding panels — all four beats side by side; the active
                one glides open (flex-grow) to show its picture, the rest
                fold to slim slivers with a vertical label. Click a sliver
                to open it. */}
            <div className="flex h-[28rem] w-full gap-2 sm:h-[32rem]">
              {STEPS.map((step, index) => {
                const isActive = index === active;
                return (
                  <button
                    key={step.n}
                    type="button"
                    onClick={() => choose(index)}
                    aria-label={`Step ${step.n}: ${step.caption}`}
                    aria-current={isActive ? "step" : undefined}
                    data-active={isActive ? "" : undefined}
                    className="calmer-panel group relative min-w-0 overflow-hidden rounded-[1.75rem] bg-feelz-paper text-left shadow-[0_30px_60px_-36px_rgba(16,35,63,0.5)] ring-1 ring-feelz-ink/10"
                  >
                    {"fit" in step && step.fit === "contain" ? (
                      <>
                        {/* Whole image, centred, over a soft blurred copy of
                            itself — a wide/square shot in this tall panel
                            would otherwise lose its corners. */}
                        <Image src={step.image} alt="" fill sizes="10rem" quality={40} className="scale-125 object-cover blur-2xl" aria-hidden />
                        <Image
                          src={step.image}
                          alt={step.caption}
                          fill
                          sizes="(min-width: 1024px) 32rem, 90vw"
                          quality={90}
                          className="calmer-panel-img object-contain drop-shadow-[0_18px_30px_rgba(16,35,63,0.25)]"
                        />
                      </>
                    ) : (
                      <Image
                        src={step.image}
                        alt={step.caption}
                        fill
                        sizes="(min-width: 1024px) 32rem, 90vw"
                        quality={90}
                        className="calmer-panel-img object-cover"
                        // Landscape shots in a tall panel: keep each subject in frame.
                        style={{ objectPosition: step.focus }}
                      />
                    )}
                    {index === 0 && (
                      <span className="calmer-panel-noise absolute inset-0 bg-feelz-ink/25" aria-hidden>
                        {NOISE.map((item, n) => (
                          <span
                            key={item.word}
                            className={`howto-strip absolute whitespace-nowrap text-white/90 [text-shadow:0_2px_12px_rgba(0,0,0,0.45)] ${item.className}`}
                            style={{ "--r": item.r, animationDelay: `${n * -1.7}s` } as CSSProperties}
                          >
                            {item.word}
                          </span>
                        ))}
                      </span>
                    )}

                    {/* Folded state: tint + vertical label. */}
                    <span className="calmer-panel-veil absolute inset-0 bg-gradient-to-t from-feelz-ink/55 via-feelz-ink/25 to-feelz-ink/10" aria-hidden />
                    <span className="calmer-panel-label absolute inset-x-0 bottom-5 flex flex-col items-center gap-3 text-feelz-cream" aria-hidden>
                      <span className="text-[10px] font-semibold tracking-[0.3em]">{step.n}</span>
                      <span className="font-tagline whitespace-nowrap text-sm italic [writing-mode:vertical-rl] rotate-180">{step.caption}</span>
                    </span>

                    {/* Open state: caption chip. */}
                    <span className="calmer-panel-chip absolute inset-x-4 bottom-4 flex items-baseline gap-3 rounded-2xl border border-white/60 bg-white/75 px-4 py-3 backdrop-blur-md">
                      <span className={`text-[10px] font-semibold tracking-[0.3em] ${step.color.text}`}>{step.n}</span>
                      <span className="font-tagline truncate text-base italic text-feelz-ink">{step.caption}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Story bars — the active one fills over the dwell time. */}
            <div className="mt-5 flex gap-2" aria-hidden>
              {STEPS.map((step, index) => (
                <span key={step.n} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-feelz-ink/10">
                  <span
                    key={index === active ? `run-${active}-${isPlaying}` : "idle"}
                    className={`absolute inset-y-0 left-0 rounded-full ${step.color.bg} ${
                      index < active ? "w-full" : index === active ? (isPlaying ? "calmer-bar-run" : "w-full") : "w-0"
                    }`}
                    style={{ "--dwell": `${DWELL_MS}ms` } as CSSProperties}
                  />
                </span>
              ))}
            </div>
          </Reveal>

          {/* --- The timeline --- */}
          <Reveal delayMs={160} className="relative">
            {/* Track + fill: grows to the active step. */}
            <div className="absolute bottom-8 left-5 top-8 w-px bg-feelz-ink/10" aria-hidden>
              <div
                className="calmer-track-fill absolute inset-x-0 top-0 bg-gradient-to-b from-feelz-berry via-feelz-orange via-60% to-feelz-rest"
                style={{ height: `${(active / (STEPS.length - 1)) * 100}%` }}
              />
            </div>

            <ol className="space-y-3">
              {STEPS.map((step, index) => {
                const isActive = index === active;
                return (
                  <li key={step.n}>
                    <button
                      type="button"
                      onClick={() => choose(index)}
                      aria-current={isActive ? "step" : undefined}
                      className={`calmer-step group relative flex w-full gap-5 rounded-2xl py-4 pr-4 text-left transition-[opacity,background-color] duration-700 ${
                        isActive ? "opacity-100" : "opacity-45 hover:opacity-80"
                      }`}
                    >
                      <span
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-feelz-cream transition-all duration-700 ${
                          isActive ? `${step.color.bg} scale-110 shadow-[0_10px_24px_-10px_rgba(16,35,63,0.5)]` : step.color.bgTint
                        }`}
                      >
                        <step.icon className={`h-4 w-4 transition-colors duration-700 ${isActive ? "text-feelz-cream" : step.color.text}`} aria-hidden />
                      </span>
                      <span className="block pt-0.5">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-feelz-ink/40">Step {step.n}</span>
                        <span
                          className={`font-display mt-1 block font-bold text-feelz-ink transition-all duration-700 ${
                            isActive ? "text-xl sm:text-2xl" : "text-lg"
                          }`}
                        >
                          {step.title}
                        </span>
                        <span
                          className={`grid transition-[grid-template-rows,opacity] duration-700 ${
                            isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <span className="overflow-hidden">
                            <span className="mt-2 block max-w-md text-sm leading-relaxed text-feelz-ink/60">{step.body}</span>
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
