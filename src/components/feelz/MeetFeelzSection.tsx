"use client";

import { useEffect, useRef, useState } from "react";
import { MOOD_STYLES, FEELZ_COLOR_CLASSES, type MoodStyle } from "@/lib/moodStyles";

// "Your brain needs: FOCUS" — a static sentence with one word that swaps
// per tab, so the interaction is the copy changing rather than a new
// paragraph appearing. Reuses the same stateLine copy already on each mood
// (MOOD_STYLES) instead of hand-duplicating a second word list. Exported so
// Hero.tsx can map a hovered product card's mood key to the matching word.
export const MEET_FEELZ_NEEDS: { key: keyof typeof MOOD_STYLES; word: string }[] = [
  { key: "focus", word: "Focus" },
  { key: "extrovert", word: "Social Confidence" },
  { key: "joy", word: "Calmness" },
  { key: "rest", word: "Quality Sleep" },
];
const NEEDS = MEET_FEELZ_NEEDS;

const TYPE_MS_PER_CHAR = 28;
const HOLD_MS = 1800;

export function MeetFeelzSection({ hoveredKey }: { hoveredKey?: string | null }) {
  // Starts on index 0 (matches server-rendered HTML) and randomizes right
  // after mount — doing the random pick during render would make the
  // client's first paint disagree with the server-rendered HTML and throw
  // a hydration error, same lesson learned earlier with HeroLightFlow's
  // jitter() values.
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedWord, setDisplayedWord] = useState(NEEDS[0].word);
  const typeTimer = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(Math.floor(Math.random() * NEEDS.length));
  }, []);

  // Hovering a product card in the grid below (Hero.tsx passes its mood key
  // down as `hoveredKey`) jumps straight to that word and pauses the
  // auto-cycle; moving the mouse away (hoveredKey back to null) resumes
  // cycling from wherever it left off, rather than restarting from scratch.
  useEffect(() => {
    if (!hoveredKey) return;
    const index = NEEDS.findIndex((n) => n.key === hoveredKey);
    if (index !== -1) setActiveIndex(index);
  }, [hoveredKey]);

  // No buttons — otherwise the word cycles on its own (matches the brief:
  // "FOCUS ... then dynamically: SOCIAL CONFIDENCE, CALMNESS, QUALITY
  // SLEEP"). A recursive setTimeout rather than a fixed setInterval,
  // because the four words are different lengths — "Social Confidence"
  // takes noticeably longer to type than "Focus", and a constant interval
  // would advance to the next word before a longer one finished typing.
  // Paused entirely while a product card is actively hovered.
  useEffect(() => {
    if (hoveredKey) return;
    const id = window.setTimeout(
      () => setActiveIndex((i) => (i + 1) % NEEDS.length),
      HOLD_MS + NEEDS[activeIndex].word.length * TYPE_MS_PER_CHAR,
    );
    return () => window.clearTimeout(id);
  }, [activeIndex, hoveredKey]);

  // Fast typewriter reveal every time the active word changes — types the
  // new word in instead of just swapping it in instantly.
  useEffect(() => {
    const target = NEEDS[activeIndex].word;
    if (typeTimer.current) window.clearInterval(typeTimer.current);
    setDisplayedWord("");
    let i = 0;
    typeTimer.current = window.setInterval(() => {
      i += 1;
      setDisplayedWord(target.slice(0, i));
      if (i >= target.length && typeTimer.current) {
        window.clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
    }, TYPE_MS_PER_CHAR);
    return () => {
      if (typeTimer.current) window.clearInterval(typeTimer.current);
    };
  }, [activeIndex]);

  const active = NEEDS[activeIndex];
  const style: MoodStyle = MOOD_STYLES[active.key];
  const colors = FEELZ_COLOR_CLASSES[style.feelzColor];

  return (
    <section id="discover" className="mx-auto max-w-4xl px-4 pb-3 pt-6 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-label text-feelz-berry">Meet FEELZ</p>

      <div className="relative mx-auto mt-3 flex min-h-[7rem] flex-col items-center justify-center rounded-[2rem] bg-feelz-paper p-5">
        <p className="text-xs font-semibold uppercase tracking-label text-feelz-ink/40">Your brain wants:</p>
        <p className={`font-display mt-2 min-h-[1.2em] text-4xl font-bold sm:text-5xl ${colors.text}`}>
          {displayedWord}
          <span className="animate-pulse">|</span>
        </p>
      </div>
    </section>
  );
}
