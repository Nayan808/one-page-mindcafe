"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { MOOD_GRID, MOOD_STYLES } from "@/lib/moodStyles";

// The four Feelz moods, previewed right below the homepage hero carousel —
// reads MOOD_GRID, the same list the hero carousel, the /feelz product
// grid, and the footer's Feelz links all use.
const EASE = [0.22, 0.61, 0.36, 1] as const;

function MoodThumb({ src, reduced }: { src: string; reduced: boolean }) {
  return (
    <motion.span
      className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-ink/10"
      animate={reduced ? undefined : { scale: [1, 1.05, 1] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <Image src={src} alt="" fill sizes="40px" className="object-cover" />
    </motion.span>
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
      {MOOD_GRID.map((m, i) => {
        const mood = MOOD_STYLES[m.key];
        return (
          <li
            key={m.key}
            className={`flex items-start gap-3 ${i > 0 ? "sm:border-l sm:border-ink/10 sm:pl-6" : ""}`}
          >
            <MoodThumb src={m.src} reduced={reduced} />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">{m.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink/50">{mood.description}</span>
            </span>
          </li>
        );
      })}
    </motion.ul>
  );
}
