"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Bell, CalendarClock, MessageCircle, ListChecks, Leaf, FlaskConical, HeartHandshake, Sun, Target, Sparkles, Droplet } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";

// A section built to match a reference creative's structure (problem →
// small-strip moment → plant-powered formulation → feel-the-difference,
// plus a "you do a lot" sticky-note beat and two icon-benefit rows) — the
// creative itself isn't a file in this project, so the copy/layout is
// coded from scratch in FEELZ's own voice/tokens rather than dropped in
// as an image, same approach as AncientWisdomSection and MeetFeelzSection.
//
// The showcase photos ARE real though — the same raw-material → finished
// -strip sequence already cropped for AncientWisdomSection (public/feelz-
// creative/wisdom/), reused here as a genuine "journey" carousel rather
// than duplicated stock imagery.
const JOURNEY = [
  { src: "/feelz-creative/wisdom/botanicals.webp", caption: "Real botanicals" },
  { src: "/feelz-creative/wisdom/ayurveda.webp", caption: "Ayurvedic preparation" },
  { src: "/feelz-creative/wisdom/formulation.webp", caption: "Modern formulation" },
  { src: "/feelz-creative/wisdom/melt.webp", caption: "Melts in seconds" },
  { src: "/feelz-creative/wisdom/moment.webp", caption: "Your moment" },
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

const APPROACH = [
  { icon: Leaf, label: "Ayurveda-inspired botanicals" },
  { icon: FlaskConical, label: "Modern formulation" },
  { icon: HeartHandshake, label: "Gentle, everyday support" },
];

const OUTCOMES = [
  { icon: Sun, label: "A brighter mood" },
  { icon: Target, label: "Sharper focus" },
  { icon: Sparkles, label: "A calmer you" },
];

export function CalmerYouSection() {
  const [activeJourney, setActiveJourney] = useState(0);
  const [journeyHovered, setJourneyHovered] = useState(false);

  useEffect(() => {
    if (journeyHovered) return;
    const id = window.setInterval(() => setActiveJourney((i) => (i + 1) % JOURNEY.length), 2200);
    return () => window.clearInterval(id);
  }, [journeyHovered]);

  return (
    <section className="relative overflow-hidden border-y border-feelz-ink/10 bg-feelz-cream py-16 sm:py-20">
      {/* Soft decorative color blooms — pure CSS, matching the reference's
          blurred pink/peach corner glow without needing a background photo. */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-feelz-orange/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-feelz-berry/15 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-berry">Feel better. Think better. Live better.</p>
          <h2 className="font-display mt-3 text-3xl font-bold leading-[1.1] text-feelz-ink sm:text-4xl">
            A calmer, happier you <span className="font-tagline italic">— in seconds.</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-center lg:gap-14">
          {/* Journey showcase — real photos crossfading from raw botanicals
              through Ayurvedic prep, formulation and the melt-in-seconds
              strip, to the real "your moment" hand shot. Same fade+interval
              pattern already used for the product-page gallery. */}
          <Reveal delayMs={80} className="relative mx-auto w-full max-w-sm">
            <div
              className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-feelz-ink/10 bg-feelz-paper shadow-lg"
              onMouseEnter={() => setJourneyHovered(true)}
              onMouseLeave={() => setJourneyHovered(false)}
            >
              <Image
                key={activeJourney}
                src={JOURNEY[activeJourney].src}
                alt={JOURNEY[activeJourney].caption}
                fill
                sizes="(min-width: 1024px) 26rem, 80vw"
                className="animate-[fade-in_0.5s_ease-out] object-contain p-8"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-feelz-ink/80 to-transparent px-5 pb-4 pt-10">
                <p className="text-xs font-semibold uppercase tracking-label text-feelz-cream">{JOURNEY[activeJourney].caption}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5">
              {JOURNEY.map((item, index) => (
                <button
                  key={item.src}
                  type="button"
                  onClick={() => setActiveJourney(index)}
                  aria-label={`Show ${item.caption}`}
                  className={`h-1.5 rounded-full transition-all ${index === activeJourney ? "w-6 bg-feelz-berry" : "w-1.5 bg-feelz-ink/15"}`}
                />
              ))}
            </div>

            {/* "You do a lot" sticky notes — a small decorative collage
                accent overlapping the showcase corner, hidden on mobile so
                it doesn't crowd the narrower card. */}
            <div className="absolute -right-6 -top-6 hidden sm:block">
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

        {/* Approach + outcomes — modern icon-chip cards instead of a plain
            list, mirroring the reference's two benefit rows. A fixed card
            min-height + centered label keeps every chip the same height
            regardless of whether its label wraps to one line or two, and
            a divider between the two groups (desktop only) keeps them
            reading as two distinct lists rather than one blurred row. */}
        <div className="mt-16 grid gap-10 border-t border-feelz-ink/10 pt-10 sm:grid-cols-2 sm:gap-8 lg:gap-16">
          <Reveal delayMs={200} className="sm:border-r sm:border-feelz-ink/10 sm:pr-8 lg:pr-12">
            <p className="text-center text-[11px] font-semibold uppercase tracking-label text-feelz-ink/40 sm:text-left">The approach</p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {APPROACH.map((item) => (
                <div
                  key={item.label}
                  className="flex min-h-[7.5rem] flex-col items-center gap-2 rounded-2xl border border-feelz-ink/10 bg-feelz-paper p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-feelz-berry/15 bg-feelz-berry/10">
                    <item.icon className="h-4 w-4 text-feelz-berry" aria-hidden />
                  </span>
                  <span className="flex flex-1 items-center text-[11px] font-medium leading-tight text-feelz-ink/75">{item.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delayMs={260}>
            <p className="text-center text-[11px] font-semibold uppercase tracking-label text-feelz-ink/40 sm:text-left">The outcome</p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {OUTCOMES.map((item) => (
                <div
                  key={item.label}
                  className="flex min-h-[7.5rem] flex-col items-center gap-2 rounded-2xl border border-feelz-ink/10 bg-feelz-paper p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-feelz-navy/15 bg-feelz-navy/10">
                    <item.icon className="h-4 w-4 text-feelz-navy" aria-hidden />
                  </span>
                  <span className="flex flex-1 items-center text-[11px] font-medium leading-tight text-feelz-ink/75">{item.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Safety note — same register as the existing "Is FEELZ a medicine?"
            FAQ copy elsewhere on the site, not a new claim invented for
            this section. */}
        <p className="mx-auto mt-10 max-w-2xl rounded-xl border border-feelz-ink/10 bg-feelz-paper px-5 py-3 text-center text-xs leading-relaxed text-feelz-ink/55">
          FEELZ is a wellness supplement, not a medicine. Consult a healthcare professional before use if you&apos;re pregnant, nursing, on medication or managing a medical condition.
        </p>
      </div>
    </section>
  );
}
