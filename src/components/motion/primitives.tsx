"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

/**
 * Shared motion vocabulary for the homepage below the hero.
 *
 * The point of centralising these is rhythm: every section uses the same
 * easing curve and the same timing family, so the page reads as one
 * continuous journey rather than eight components that each animate in
 * their own dialect. Sections differ in WHICH primitive they use and in
 * what order — not in how motion feels.
 *
 * Everything animated here is transform, opacity or filter, and every
 * primitive collapses to its finished state under prefers-reduced-motion.
 */

/** One curve for the whole page. Slow out, no overshoot, never springy. */
export const EASE = [0.22, 0.61, 0.36, 1] as const;

export function useCalmMotion() {
  return !!useReducedMotion();
}

/**
 * A line of type revealed from behind a clipping mask.
 *
 * The mask is the parent's `overflow-hidden` — the child slides up from
 * fully below its own box. This is what separates an editorial reveal from
 * a plain fade: the letters arrive from somewhere rather than materialising
 * in place.
 */
export function MaskLine({
  children,
  delay = 0,
  className = "",
  duration = 1,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
}) {
  const calm = useCalmMotion();
  return (
    // The viewport trigger MUST live on the outer (clipping) element, not on
    // the inner one that moves.
    //
    // IntersectionObserver clips against ancestor `overflow: hidden`. The
    // inner span starts translated fully below this box, so it is clipped to
    // zero visible area — meaning an observer watching IT can never fire, and
    // it stays hidden forever. A deadlock, not a timing issue.
    //
    // Watching the outer element (which is never clipped by its own
    // overflow) and driving the inner one through variants breaks that
    // cycle.
    <motion.span
      className={`block overflow-hidden pb-[0.08em] ${className}`}
      initial={calm ? undefined : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={{ hidden: {}, show: {} }}
    >
      <motion.span
        className="block"
        variants={{
          hidden: { y: "112%" },
          show: { y: "0%", transition: { duration, delay, ease: EASE } },
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

/** Opacity + a short rise + blur-to-focus. The page's default entrance. */
export function RiseIn({
  children,
  delay = 0,
  y = 16,
  blur = 5,
  className = "",
  amount = 0.3,
  duration = 0.95,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: number;
  className?: string;
  amount?: number;
  duration?: number;
}) {
  const calm = useCalmMotion();
  return (
    <motion.div
      className={className}
      initial={calm ? false : { opacity: 0, y, filter: `blur(${blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggers whatever children it is given, without needing each child to be
 * a motion element itself.
 *
 * Each child is wrapped in a motion div that inherits the parent's variant
 * state, so plain markup (like the footer's column divs) can be sequenced
 * without rewriting it. The wrapper takes the grid/flex slot and the
 * original child fills it, so layout is unchanged.
 */
export function StaggerGroup({
  children,
  className = "",
  gap = 0.12,
  delay = 0,
  y = 18,
  amount = 0.2,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
  y?: number;
  amount?: number;
}) {
  const calm = useCalmMotion();
  return (
    <motion.div
      className={className}
      initial={calm ? undefined : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
    >
      {Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y, filter: "blur(4px)" },
            show: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.85, ease: EASE },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/** A hairline that draws itself outward from its origin. Used as the first
 *  beat of a section, before any type moves — structure, then content. */
export function DrawLine({
  className = "",
  delay = 0,
  origin = "left",
  vertical = false,
}: {
  className?: string;
  delay?: number;
  origin?: "left" | "center" | "top";
  vertical?: boolean;
}) {
  const calm = useCalmMotion();
  const axis = vertical ? "scaleY" : "scaleX";
  return (
    <motion.span
      className={className}
      aria-hidden
      style={{ transformOrigin: origin, display: "block" }}
      initial={calm ? false : { [axis]: 0, opacity: 0 }}
      whileInView={{ [axis]: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 1.1, delay, ease: EASE }}
    />
  );
}

/**
 * Count-up that runs exactly once, when the figure enters view.
 *
 * Accepts the display strings these sections already produce ("200+",
 * "10", "…") and animates only the numeric part, preserving any suffix. A
 * non-numeric value (the loading ellipsis, or any future copy that does not
 * start with a digit) renders untouched rather than breaking.
 *
 * Deliberately eased and short: a long linear count reads as a dashboard
 * widget, which is the opposite of what this page wants.
 */
export function CountUp({
  value,
  className = "",
  duration = 1.5,
  delay = 0,
}: {
  value: string;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const calm = useCalmMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  const match = value.match(/^(\d[\d.,]*)(.*)$/);
  const target = match ? Number(match[1].replace(/[.,]/g, "")) : null;
  const suffix = match ? match[2] : "";

  const [shown, setShown] = useState<number | null>(target === null ? null : 0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (target === null) return;
    if (calm) {
      setShown(target);
      setSettled(true);
      return;
    }
    if (!inView) return;

    let raf = 0;
    const started = performance.now();
    const startDelay = delay * 1000;

    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - started - startDelay) / (duration * 1000)));
      // easeOutQuart — covers most of the distance early then decelerates
      // hard, so the figure *arrives* and settles rather than ticking up at
      // a constant rate like a counter widget.
      const eased = 1 - Math.pow(1 - t, 4);
      setShown(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setSettled(true);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, delay, calm]);

  // Non-numeric values pass through untouched.
  if (target === null || shown === null) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {/* tabular-nums stops the figure jittering in width as digits change,
          which would otherwise nudge the label under it on every frame.
          The digits also resolve from soft to sharp as they land. */}
      <motion.span
        className="tabular-nums"
        initial={calm ? false : { filter: "blur(6px)", opacity: 0.55 }}
        animate={
          settled
            ? { filter: "blur(0px)", opacity: 1 }
            : { filter: "blur(1.5px)", opacity: 0.92 }
        }
        transition={{ duration: 0.5, ease: EASE }}
        style={{ display: "inline-block" }}
      >
        {shown}
      </motion.span>
      {/* The suffix lands only once the number has arrived — a small beat
          that makes the figure feel finished rather than merely stopped. */}
      {suffix && (
        <motion.span
          initial={calm ? false : { opacity: 0, x: -4 }}
          animate={settled ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
          transition={{ duration: 0.55, ease: EASE }}
          style={{ display: "inline-block" }}
        >
          {suffix}
        </motion.span>
      )}
    </span>
  );
}
