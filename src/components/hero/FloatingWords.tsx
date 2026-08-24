"use client";

import { motion } from "motion/react";

/**
 * The hero's floating words.
 *
 * TYPOGRAPHY CARRIES THE STORY. Both groups are set in the brand's Bodoni
 * Moda — the same face as the headline — but in opposite postures:
 *
 *   UNSETTLED  .font-tagline — Bodoni ITALIC. Leaning, unresolved, the
 *              posture of a passing thought.
 *   SETTLED    .font-hero — Bodoni UPRIGHT. Standing straight, resolved.
 *
 * That is a far stronger portrayal than the previous generic sans at two
 * different weights: it ties the words into the brand's editorial voice and
 * makes chaos-versus-clarity legible in the letterforms themselves.
 *
 * WHAT THIS LAYER DELIBERATELY DOES NOT DO:
 *   - no hover of any kind (the layer is pointer-events-none, aria-hidden)
 *   - no pointer parallax; a word that moves with the cursor reads as a
 *     hover effect even when no :hover rule exists
 *   - no opacity breathing, which read as flicker rather than life
 *   - no per-letter motion, which read as broken type
 *
 * What remains is an ordered arrival, and — for the unsettled group only —
 * a very slow, very small positional drift that is time-based and therefore
 * can never be mistaken for a reaction to the user.
 */

const DARK_HALO = "0 1px 12px rgba(8,5,14,0.94), 0 0 30px rgba(8,5,14,0.72)";
const WARM_HALO = "0 1px 10px rgba(255,241,214,0.92), 0 0 26px rgba(255,236,198,0.7)";
const EASE = [0.22, 0.61, 0.36, 1] as const;

/** How long a word takes to arrive. The drift waits this out. */
const ARRIVE = 0.9;

export function UnsettledWord({
  word,
  top,
  left,
  drift,
  duration,
  delay,
  reduced,
}: {
  word: string;
  top: string;
  left: string;
  drift: number;
  duration: number;
  delay: number;
  reduced: boolean;
}) {
  // Halved from the previous values and slowed down: enough that the group
  // is never perfectly static, little enough that you cannot catch it
  // moving if you look straight at it.
  const travel = drift * 0.5;

  return (
    <motion.span
      className="font-tagline absolute whitespace-nowrap text-[16px] italic text-[#f4ecff]"
      style={{ top, left, textShadow: DARK_HALO }}
      initial={
        reduced ? false : { opacity: 0, y: 14, filter: "blur(10px)", letterSpacing: "-0.01em" }
      }
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", letterSpacing: "0.045em" }}
      transition={{ duration: ARRIVE, delay, ease: EASE }}
      aria-hidden
    >
      <motion.span
        className="inline-block"
        animate={reduced ? undefined : { x: [0, travel, 0], y: [0, -travel * 0.55, 0] }}
        transition={
          reduced
            ? undefined
            : {
                x: {
                  duration: duration * 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: delay + ARRIVE,
                },
                y: {
                  duration: duration * 1.25,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: delay + ARRIVE,
                },
              }
        }
      >
        {word}
      </motion.span>
    </motion.span>
  );
}

export function SettledWord({
  word,
  top,
  left,
  index,
  delay,
  reduced,
}: {
  word: string;
  top: string;
  left: string;
  index: number;
  delay: number;
  reduced: boolean;
}) {
  return (
    <motion.span
      // Upright Bodoni, and a touch more tracking than the italic group —
      // resolved words are allowed to take up space.
      className="font-hero absolute whitespace-nowrap text-[16px] font-semibold text-white"
      style={{ top, left }}
      initial={
        reduced ? false : { opacity: 0, y: 12, filter: "blur(9px)", letterSpacing: "-0.01em" }
      }
      animate={
        reduced
          ? { opacity: 1, y: 0, filter: "blur(0px)", letterSpacing: "0.07em", textShadow: WARM_HALO }
          : {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              letterSpacing: "0.07em",
              // Completely still once arrived. Only the halo breathes, and
              // only slowly — the counterpoint to the drifting group.
              textShadow: [
                "0 1px 8px rgba(255,241,214,0.68), 0 0 18px rgba(255,236,198,0.46)",
                "0 1px 13px rgba(255,245,224,1), 0 0 32px rgba(255,238,204,0.9)",
                "0 1px 8px rgba(255,241,214,0.68), 0 0 18px rgba(255,236,198,0.46)",
              ],
            }
      }
      transition={
        reduced
          ? { duration: 0.6 }
          : {
              opacity: { duration: ARRIVE, delay, ease: EASE },
              y: { duration: ARRIVE, delay, ease: EASE },
              filter: { duration: ARRIVE, delay, ease: EASE },
              letterSpacing: { duration: ARRIVE, delay, ease: EASE },
              textShadow: {
                duration: 10 + index * 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay + ARRIVE,
              },
            }
      }
      aria-hidden
    >
      {word}
    </motion.span>
  );
}
