"use client";

import { motion } from "motion/react";

// The four journey stages from the reference, previewing the homepage's
// eventual CHAOS -> ... -> CLARITY arc. Icons are inline SVG (not an icon
// font or images) so each one can carry its own slow, stage-appropriate
// motion rather than looking like four unrelated animated glyphs.
const STAGES = [
  {
    key: "thoughts",
    label: "Thoughts",
    copy: ["It's okay to feel", "overwhelmed."],
  },
  {
    key: "understanding",
    label: "Understanding",
    copy: ["Talk it out. Make", "sense of it."],
  },
  {
    key: "healing",
    label: "Healing",
    copy: ["Find support.", "Feel lighter."],
  },
  {
    key: "clarity",
    label: "Clarity",
    copy: ["Move forward", "with strength."],
  },
] as const;

const EASE = [0.22, 0.61, 0.36, 1] as const;

function Icon({ stage, reduced }: { stage: string; reduced: boolean }) {
  const common = { fill: "none", strokeWidth: 1.1, strokeLinecap: "round" as const };

  if (stage === "thoughts") {
    // Tangled loops, drifting irregularly — emotional noise.
    return (
      <svg viewBox="0 0 32 32" className="h-7 w-7 text-[#a66c98]">
        <motion.g
          {...common}
          stroke="currentColor"
          animate={reduced ? undefined : { rotate: [0, 2.5, -1.5, 0], x: [0, 0.6, -0.4, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "16px", originY: "16px" }}
        >
          <circle cx="13" cy="14" r="6.5" />
          <circle cx="19" cy="17" r="5.5" />
          <path d="M9 20c2 3 6 4 9 2" />
        </motion.g>
      </svg>
    );
  }

  if (stage === "understanding") {
    // A broken ring slowly completing itself.
    return (
      <svg viewBox="0 0 32 32" className="h-7 w-7 text-[#cf96af]">
        <motion.circle
          {...common}
          stroke="currentColor"
          cx="16"
          cy="16"
          r="9"
          strokeDasharray="57"
          animate={reduced ? { strokeDashoffset: 6 } : { strokeDashoffset: [26, 2, 26] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <path {...common} stroke="currentColor" d="M16 11v5l3 2" opacity={0.75} />
      </svg>
    );
  }

  if (stage === "healing") {
    // Leaves opening — organic growth, never a bounce.
    return (
      <svg viewBox="0 0 32 32" className="h-7 w-7 text-[#b9c6a8]">
        <motion.g
          {...common}
          stroke="currentColor"
          animate={reduced ? undefined : { scaleY: [1, 1.06, 1], scaleX: [1, 1.03, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "16px", originY: "26px" }}
        >
          <path d="M16 26V13" />
          <path d="M16 17c-4 0-6-3-6-6 3 0 6 2 6 6z" />
          <path d="M16 20c4 0 6-3 6-6-3 0-6 2-6 6z" />
        </motion.g>
      </svg>
    );
  }

  // clarity — warm light radiating outward on a long, calm loop.
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 text-[#e3c39b]">
      <circle {...common} stroke="currentColor" cx="16" cy="16" r="5" />
      <motion.g
        {...common}
        stroke="currentColor"
        animate={reduced ? undefined : { opacity: [0.45, 0.9, 0.45], scale: [0.97, 1.05, 0.97] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "16px", originY: "16px" }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1="16"
            y1="7.5"
            x2="16"
            y2="4.5"
            transform={`rotate(${deg} 16 16)`}
          />
        ))}
      </motion.g>
    </svg>
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
      {STAGES.map((s, i) => (
        <li
          key={s.key}
          className={`flex items-start gap-3 ${i > 0 ? "sm:border-l sm:border-cream/12 sm:pl-6" : ""}`}
        >
          <span className="mt-0.5 shrink-0">
            <Icon stage={s.key} reduced={reduced} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-cream/90">{s.label}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-cream/50">
              {s.copy[0]}
              <br />
              {s.copy[1]}
            </span>
          </span>
        </li>
      ))}
    </motion.ul>
  );
}
