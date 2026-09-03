"use client";

import { motion } from "motion/react";
import { MOOD_STYLES } from "@/lib/moodStyles";

// The four Feelz moods, previewed right in the homepage hero — the
// taglines/gradients are the same ones already used on /feelz and the mood
// cards (moodStyleFor), so a mood reads identically wherever it shows up.
const MOODS = [
  { key: "extrovert", label: "Extrovert" },
  { key: "focus", label: "Focus" },
  { key: "joy", label: "Joy" },
  { key: "rest", label: "Rest" },
] as const;

const EASE = [0.22, 0.61, 0.36, 1] as const;

function MoodDot({ gradient, reduced }: { gradient: string; reduced: boolean }) {
  return (
    <motion.span
      className="block h-7 w-7 shrink-0 rounded-full"
      style={{ background: gradient }}
      animate={reduced ? undefined : { scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    />
  );
}

export function JourneyStrip({ reduced, delay = 0 }: { reduced: boolean; delay?: number }) {
  return (
    <motion.ul
      className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4 sm:gap-x-8"
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.77, delay, ease: EASE }}
    >
      {MOODS.map((m, i) => {
        const mood = MOOD_STYLES[m.key];
        return (
          <li
            key={m.key}
            className={`flex items-start gap-3 ${i > 0 ? "sm:border-l sm:border-cream/12 sm:pl-6" : ""}`}
          >
            <span className="mt-0.5">
              <MoodDot gradient={mood.gradient} reduced={reduced} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-cream/90">{m.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-cream/50">{mood.description}</span>
            </span>
          </li>
        );
      })}
    </motion.ul>
  );
}
