"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CalendarClock, MessageCircle, ListChecks, FlaskConical, Sparkles, Droplet, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";
import { SketchLeaf, SketchFlask, SketchHeart, SketchSun, SketchTarget, SketchSparkle } from "@/components/feelz/SketchIcons";

// A section built to match a reference creative's structure (problem →
// small-strip moment → plant-powered formulation → feel-the-difference,
// plus a "you do a lot" sticky-note beat and two icon-benefit rows) — the
// creative itself isn't a file in this project, so the copy/layout is
// coded from scratch in FEELZ's own voice/tokens rather than dropped in
// as an image, same approach as AncientWisdomSection and MeetFeelzSection.
//
// The showcase photos ARE real — the same raw-material → finished-strip
// sequence already cropped for AncientWisdomSection (public/feelz-
// creative/wisdom/). Shown as a fanned, overlapping photo deck (like a
// hand of cards dealt face-up) rather than a timed cross-fade carousel or
// a scroll-pinned column (both tried and reverted). Starts as a neat
// closed stack and deals open into the fan once, staggered per card, on
// mount — a one-shot entrance animation, not a recurring timed cycle like
// the carousel had, so there's no ongoing timing to follow.
const JOURNEY = [
  { src: "/feelz-creative/wisdom/botanicals.webp", caption: "Real botanicals", rotate: "-rotate-[24deg]", shift: "-translate-x-20 translate-y-4", tagColor: "feelz-berry" as const, tagRotate: "-rotate-6" },
  { src: "/feelz-creative/wisdom/ayurveda.webp", caption: "Ayurvedic preparation", rotate: "-rotate-12", shift: "-translate-x-10 translate-y-1", tagColor: "feelz-orange" as const, tagRotate: "rotate-3" },
  { src: "/feelz-creative/wisdom/formulation.webp", caption: "Modern formulation", rotate: "rotate-0", shift: "translate-y-0", tagColor: "feelz-navy" as const, tagRotate: "-rotate-3" },
  { src: "/feelz-creative/wisdom/melt.webp", caption: "Melts in seconds", rotate: "rotate-12", shift: "translate-x-10 translate-y-1", tagColor: "feelz-rest" as const, tagRotate: "rotate-6" },
  { src: "/feelz-creative/wisdom/moment-v2.webp", caption: "Your moment", rotate: "rotate-[24deg]", shift: "translate-x-20 translate-y-4", tagColor: "feelz-berry" as const, tagRotate: "-rotate-4" },
];

const STEPS = [
  { n: "01", icon: Bell, title: "Life gets loud.", body: "Deadlines, notifications and a never-ending to-do list can throw you off balance.", color: FEELZ_COLOR_CLASSES["feelz-berry"] },
  { n: "02", icon: Droplet, title: "A small strip. A big shift.", body: "Place a FEELZ strip on your tongue — no water needed. It starts dissolving in seconds.", color: FEELZ_COLOR_CLASSES["feelz-orange"] },
  { n: "03", icon: FlaskConical, title: "Plant-powered, formulated with care.", body: "A fast-dissolving strip built around botanical actives chosen for mood, calm and clarity.", color: FEELZ_COLOR_CLASSES["feelz-navy"] },
  { n: "04", icon: Sparkles, title: "Feel the difference.", body: "A calmer, more present you — ready for whatever's next.", color: FEELZ_COLOR_CLASSES["feelz-rest"] },
];

const STICKY_NOTES: { label: string; rotate: string; icon: typeof CalendarClock }[] = [
  { label: "Deadlines", rotate: "-rotate-6", icon: CalendarClock },
  { label: "Calls", rotate: "rotate-3", icon: Bell },
  { label: "To-dos", rotate: "rotate-2", icon: ListChecks },
  { label: "Social plans", rotate: "-rotate-3", icon: MessageCircle },
];

// Paired cause-and-effect — each approach reads straight into the outcome
// it leads to, told as one connected row instead of two separate,
// disconnected groups of three.
const PAIRS = [
  { approach: { icon: SketchLeaf, label: "Ayurveda-inspired botanicals" }, outcome: { icon: SketchSun, label: "A brighter mood" } },
  { approach: { icon: SketchFlask, label: "Modern formulation" }, outcome: { icon: SketchTarget, label: "Sharper focus" } },
  { approach: { icon: SketchHeart, label: "Gentle, everyday support" }, outcome: { icon: SketchSparkle, label: "A calmer you" } },
];

export function CalmerYouSection() {
  // The deck starts closed (stacked, no rotation/offset) and opens into
  // the fan shortly after mount — a single requestAnimationFrame delay so
  // the browser paints the closed state first, letting the CSS transition
  // to the open state actually animate instead of snapping straight to
  // the fanned layout.
  const [dealt, setDealt] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDealt(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // One card is always "active" — pulled fully clear of the overlap, in
  // front of every other card, with its caption shown. By default this
  // cycles on its own (one by one, a few seconds apart) so every photo
  // gets its own unblocked moment without anyone touching the deck.
  // Tapping/clicking any card (needed on touch, where hover never fires)
  // jumps straight to it instead and pauses the auto-cycle for a bit so
  // the choice sticks, then lets it resume.
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    autoplayRef.current = setInterval(() => {
      setActiveIndex((current) => (current + 1) % JOURNEY.length);
    }, 2600);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  function handleSelectCard(index: number) {
    setActiveIndex(index);
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      autoplayRef.current = setInterval(() => {
        setActiveIndex((current) => (current + 1) % JOURNEY.length);
      }, 2600);
    }, 6000);
  }

  return (
    <section className="relative overflow-hidden border-y border-feelz-ink/10 bg-feelz-cream py-16 sm:py-20">
      {/* Soft decorative color blooms — pure CSS, matching the reference's
          blurred pink/peach corner glow without needing a background photo. */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-feelz-orange/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-feelz-berry/15 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-berry">Feel better. Think better. Live better.</p>
          <h2 className="font-display mt-3 text-3xl font-bold leading-[1.1] text-feelz-ink sm:text-4xl">
            A calmer, happier you <span className="font-tagline italic">— in seconds.</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-center lg:gap-14">
          {/* Journey showcase — a fanned deck of all 5 real photos (raw
              botanicals through Ayurvedic prep, formulation, the melt-in-
              seconds strip, to the real "your moment" hand shot). Starts
              as a closed stack and deals open into the fan once, staggered
              card by card (see the `dealt` state above), then stays fully
              open — every photo visible at once with no further timing.
              Hovering any card still brings it to the front and
              straightens it. */}
          <Reveal delayMs={80} className="relative mx-auto w-full max-w-sm pb-6 pt-4">
            <div className="relative aspect-[4/5] w-full">
              {JOURNEY.map((item, index) => {
                const isActive = dealt && activeIndex === index;
                const tagColor = FEELZ_COLOR_CLASSES[item.tagColor];
                return (
                  <button
                    key={item.src}
                    type="button"
                    onClick={() => handleSelectCard(index)}
                    aria-label={`Show ${item.caption}`}
                    style={{ zIndex: isActive ? 40 : index, transitionDelay: dealt ? "0ms" : `${index * 90}ms` }}
                    className={`absolute inset-0 overflow-hidden rounded-3xl border-4 border-feelz-cream bg-feelz-paper text-left shadow-lg transition-all duration-700 ease-out ${
                      dealt
                        ? isActive
                          ? "-translate-y-10 rotate-0 scale-110 shadow-2xl"
                          : `${item.rotate} ${item.shift} scale-[0.82] opacity-60 hover:opacity-100`
                        : ""
                    }`}
                  >
                    <Image src={item.src} alt={item.caption} fill sizes="(min-width: 1024px) 26rem, 80vw" className="object-contain p-8" />

                    {/* Name tag — a bold, hand-drawn-sticker badge (one
                        color per card) that pops in with a springy
                        overshoot bounce on whichever card is active,
                        instead of a flat bottom caption strip. */}
                    <span
                      className={`absolute left-4 top-4 origin-top-left rounded-xl ${tagColor.bg} px-3.5 py-1.5 shadow-lg transition-all duration-500 ${
                        isActive ? `scale-100 opacity-100 ${item.tagRotate}` : "scale-50 rotate-0 opacity-0"
                      }`}
                      style={{ transitionTimingFunction: isActive ? "cubic-bezier(.34,1.56,.64,1)" : "ease" }}
                      aria-hidden={!isActive}
                    >
                      <span className="font-tagline text-sm italic text-feelz-cream sm:text-base">{item.caption}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* "You do a lot" sticky notes — a small decorative collage
                accent overlapping the showcase corner, hidden on mobile so
                it doesn't crowd the narrower card. */}
            <div className="absolute -right-6 -top-2 z-30 hidden sm:block">
              <div className="grid grid-cols-2 gap-2">
                {STICKY_NOTES.map((note) => (
                  <div
                    key={note.label}
                    className={`flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg bg-feelz-paper p-1.5 text-center shadow-md ${note.rotate}`}
                  >
                    <note.icon className="h-3.5 w-3.5 text-feelz-ink/40" aria-hidden />
                    <span className="text-[9px] font-semibold leading-tight text-feelz-ink/70">{note.label}</span>
                  </div>
                ))}
              </div>
              <p className="font-tagline mt-2 text-center text-xs italic text-feelz-ink/50">You do a lot.</p>
            </div>
          </Reveal>

          {/* Numbered narrative, now a connected timeline with a colored
              icon per step instead of a plain number. */}
          <Reveal delayMs={160} className="relative">
            <div className="absolute bottom-6 left-5 top-6 hidden w-px bg-feelz-ink/10 sm:block" aria-hidden />
            <div className="space-y-7">
              {STEPS.map((step) => (
                <div key={step.n} className="relative flex gap-4">
                  <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-feelz-cream ${step.color.bgTint}`}>
                    <step.icon className={`h-4 w-4 ${step.color.text}`} aria-hidden />
                  </span>
                  <div className="pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-label text-feelz-ink/35">Step {step.n}</p>
                    <p className="font-display mt-0.5 text-lg font-bold text-feelz-ink">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-feelz-ink/60">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Paired cause-and-effect rows — each approach flows straight
            into the outcome it leads to, read left-to-right as one
            connected narrative instead of two separate, disconnected
            groups of three (the earlier version). */}
        <Reveal delayMs={200} className="mt-16">
          {/* Raised panel — a light tint of the site's own brand pink
              (brand-blush) lifts this block off the page's plain cream
              background instead of just a thin top divider. */}
          <div className="rounded-[2rem] border border-brand-blush/30 bg-brand-blush/20 p-6 shadow-[0_16px_40px_-20px_rgba(207,150,175,0.4)] sm:p-10">
            <div className="flex items-center justify-center gap-6 text-xs font-semibold uppercase tracking-label text-feelz-ink/40 sm:text-sm">
              <span>The approach</span>
              <ArrowRight className="h-4 w-4 text-feelz-ink/25" aria-hidden />
              <span>The outcome</span>
            </div>
            <div className="mx-auto mt-8 max-w-3xl space-y-4">
              {PAIRS.map((pair) => (
                <div
                  key={pair.approach.label}
                  className="flex items-center gap-4 rounded-[1.75rem] border border-feelz-ink/10 bg-feelz-paper p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:gap-6 sm:p-6"
                >
                  <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-feelz-berry/20 ${FEELZ_COLOR_CLASSES["feelz-berry"].bgTint} sm:h-[4.5rem] sm:w-[4.5rem]`}>
                    <pair.approach.icon className="h-7 w-7 text-feelz-berry sm:h-8 sm:w-8" aria-hidden />
                  </span>
                  <span className="flex-1 text-base font-semibold leading-snug text-feelz-ink/80 sm:text-lg">{pair.approach.label}</span>

                  <ArrowRight className="h-6 w-6 shrink-0 text-feelz-ink/25" aria-hidden />

                  <span className="flex-1 text-right text-base font-bold leading-snug text-feelz-navy sm:text-lg">{pair.outcome.label}</span>
                  <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-feelz-navy/20 ${FEELZ_COLOR_CLASSES["feelz-navy"].bgTint} sm:h-[4.5rem] sm:w-[4.5rem]`}>
                    <pair.outcome.icon className="h-7 w-7 text-feelz-navy sm:h-8 sm:w-8" aria-hidden />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
