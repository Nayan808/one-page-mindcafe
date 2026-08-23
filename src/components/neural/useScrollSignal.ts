"use client";

import { useEffect, useRef, type RefObject } from "react";
import { NEURAL_MOTION } from "./palette";

export type ScrollSignal = {
  /** 0 when the band's top reaches the viewport bottom, 1 when its bottom
   *  clears the viewport top. Band-local, not page-global, so each band
   *  runs its own choreography wherever it sits. */
  progress: number;
  /** Idle baseline plus a damped scroll-velocity term, 0..1. */
  energy: number;
};

/**
 * Native-scroll driver, no Lenis.
 *
 * The original reason for excluding it was a conflict with the old
 * ScrollExpandMedia hero, which hijacked wheel/touch and pinned scroll.
 * That hero is gone, so the conflict is gone with it — but the damping
 * below already does the only thing Lenis was wanted for here: the raw
 * scroll position is sampled passively, then eased on a rAF loop, so the
 * field glides regardless of how coarsely the page itself scrolls. Adding
 * an inertia library now would change how the whole document scrolls for
 * every user in order to smooth one background effect, which is a much
 * bigger intervention than this needs.
 *
 * Writes into a ref rather than state on purpose — this updates every
 * frame and must never trigger a React re-render.
 */
export function useScrollSignal(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  /** Measure against the whole document rather than the container. The
   *  fixed full-page field needs this: its own element never moves (it is
   *  position:fixed), so element-relative measurement would report a
   *  constant 0 forever. */
  useDocumentScroll = false,
): RefObject<ScrollSignal> {
  const signal = useRef<ScrollSignal>({ progress: 0, energy: NEURAL_MOTION.idleEnergy });

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    let lastScrollY = window.scrollY;
    let targetProgress = 0;
    let velocity = 0;

    // Passive listener that only records position. All layout reading is
    // batched into the rAF tick below so scrolling never forces a reflow
    // from inside the event handler itself.
    let dirty = true;
    const onScroll = () => {
      const y = window.scrollY;
      velocity += Math.abs(y - lastScrollY);
      lastScrollY = y;
      dirty = true;
    };

    const tick = () => {
      const el = containerRef.current;
      if (useDocumentScroll && dirty) {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        targetProgress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
        dirty = false;
      } else if (el && dirty && !useDocumentScroll) {
        const rect = el.getBoundingClientRect();
        // Measured from the band's TOP edge crossing the viewport top, not
        // from the band entering view. A hero band therefore sits at
        // exactly 0 while the page is unscrolled, which is what holds the
        // head silhouette together at first paint — an "enters from below"
        // mapping puts a full-height hero at ~0.46 before the user has
        // touched anything, and the signature is gone before it is seen.
        targetProgress = rect.height > 0 ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0;
        dirty = false;
      }

      const s = signal.current;
      s.progress += (targetProgress - s.progress) * NEURAL_MOTION.progressDamping;

      // Velocity in px/frame -> normalised energy, then eased back down to
      // the idle floor. The clamp is what keeps a violent flick from ever
      // looking frantic; this is a mental-health brand.
      const boost = Math.min(NEURAL_MOTION.maxEnergy, velocity / 220);
      const target = Math.max(NEURAL_MOTION.idleEnergy, NEURAL_MOTION.idleEnergy + boost);
      s.energy += (target - s.energy) * NEURAL_MOTION.energyDamping;
      velocity *= 0.86;

      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [containerRef, enabled, useDocumentScroll]);

  return signal;
}
