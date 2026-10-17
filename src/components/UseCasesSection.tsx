"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { MaskLine, RiseIn } from "@/components/motion/primitives";

// "Built for modern India" — pure typography, no imagery or boxes. Each
// moment is set as a large serif line across the row: outlined while
// inactive, filling in to solid ink when it becomes active (the row nearest
// the middle of the screen, or the one hovered), with its short italic
// phrase sliding in after it in berry and its description brightening.
// Styles: .usetype-* in globals.css (reduced-motion: no slide/fill motion).
type Mood = "focus" | "joy" | "extrovert" | "rest";

const USE_CASES: { title: string; phrase: string; body: string; mood: Mood }[] = [
  {
    title: "Travelling India",
    phrase: "life on the move.",
    body: "Stay fresh, focused, and balanced through long journeys, changing schedules, and life on the move.",
    mood: "focus",
  },
  {
    title: "Remote work",
    phrase: "focus, anywhere.",
    body: "Stay clear and productive when your workspace changes every day.",
    mood: "focus",
  },
  {
    title: "Digital overload",
    phrase: "a quiet reset.",
    body: "Reset when screens, notifications, and constant input drain your energy.",
    mood: "joy",
  },
  {
    title: "Social ease",
    phrase: "show up as you.",
    body: "Feel more comfortable meeting new people, speaking up, and entering new spaces.",
    mood: "extrovert",
  },
  {
    title: "Better sleep",
    phrase: "switch off, ease in.",
    body: "Unwind after long days, calm the mind, and wake up feeling restored.",
    mood: "rest",
  },
];

const label = (mood: Mood) => mood.charAt(0).toUpperCase() + mood.slice(1);

export function UseCasesSection() {
  const [active, setActive] = useState(0);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    rowRefs.current.forEach((row) => row && observer.observe(row));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-[#fcf9f7]">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <div className="text-center">
          <RiseIn y={8} blur={3} amount={0.6}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-feelz-berry">Built for modern India</p>
          </RiseIn>
          <h2 className="font-serif-display mt-4 text-4xl leading-[1.08] text-feelz-ink sm:text-6xl">
            <MaskLine delay={0.15}>For every moment</MaskLine>
            <MaskLine delay={0.3}>
              your brain <span className="font-tagline italic text-feelz-berry">needs support.</span>
            </MaskLine>
          </h2>
        </div>

        <ol className="mt-16 border-t border-feelz-ink/10 sm:mt-24">
          {USE_CASES.map((item, index) => {
            const isActive = index === active;
            return (
              <li
                key={item.title}
                ref={(node) => {
                  rowRefs.current[index] = node;
                }}
                data-index={index}
                data-active={isActive ? "" : undefined}
                onMouseEnter={() => setActive(index)}
                className="usetype-row grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-3 border-b border-feelz-ink/10 py-8 sm:py-10 lg:grid-cols-[4rem_1fr_19rem] lg:items-center lg:gap-x-10"
                style={{ "--i": index } as CSSProperties}
              >
                <span className="usetype-num pt-2 text-xs font-semibold tracking-[0.3em] lg:pt-0">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3 className="font-serif-display text-4xl leading-[1.05] sm:text-6xl xl:text-7xl">
                  <span className="usetype-title">{item.title}</span>
                  <span className="usetype-phrase font-tagline block italic text-feelz-berry lg:ml-5 lg:inline">{item.phrase}</span>
                </h3>

                <div className="usetype-body col-start-2 lg:col-start-3">
                  <p className="text-sm leading-relaxed text-feelz-ink/70 sm:text-base">{item.body}</p>
                  <Link
                    href={`/feelz/${item.mood}`}
                    className="mt-3 inline-block border-b border-current pb-0.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-feelz-ink transition-colors hover:text-feelz-berry"
                  >
                    FEELZ {label(item.mood)} →
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
