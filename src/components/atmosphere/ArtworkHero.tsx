"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useCalmMotion } from "@/components/motion/primitives";

/**
 * A full-bleed artwork hero that never reads as a photograph.
 *
 * THE PROBLEM THIS SOLVES: an image dropped into a page announces itself
 * as an image — it has four edges, it slides past as a rigid rectangle,
 * and the page below it is a different colour. Everything here exists to
 * stop that from happening.
 *
 * Four mechanisms, in order of importance:
 *
 *   1. NO EDGES. The artwork runs up behind the sticky glass navbar (the
 *      consumer supplies the negative margin) and, at the bottom, dissolves
 *      through its own warm cream into the colour the page below is made
 *      of. There is no line to find in either direction.
 *   2. IT DISSOLVES AS YOU SCROLL, rather than scrolling away. A white veil
 *      thickens across the artwork as the hero leaves, so by the time the
 *      next section arrives the image has already become the page. That is
 *      the difference between "an image at the top" and "the page opening
 *      in light".
 *   3. IT MOVES AT ITS OWN PACE. A slow parallax drift plus a very small
 *      scale means the artwork and the copy are never locked together the
 *      way a flat background plate would be.
 *   4. ITS OWN LIGHT IS ALIVE. Each artwork passes in a `light` layer
 *      positioned over the real light source in that particular image — a
 *      sun, a window — breathing on long, slow loops. That is left to the
 *      caller precisely because it cannot be generic: light that is not
 *      registered to the artwork underneath it looks like an overlay.
 *
 * All motion is off under `prefers-reduced-motion`; the artwork then simply
 * sits still, still edgeless.
 */

/** Warm cream sampled from the artworks' lower halves — the colour they are
 *  already turning into by the time they reach their own bottom edge. It is
 *  what every dissolve passes THROUGH, so the transition reads as the light
 *  continuing rather than as a fade being applied. */
export const ARTWORK_CREAM = "247, 242, 240";

export function ArtworkHero({
  src,
  landsOn,
  light,
  dissolveHeight = "60%",
  frameTop = "-10%",
  imageClassName = "object-center",
  ground = 0.5,
  veilTo = 0.52,
  className = "",
  children,
}: {
  src: string;
  /**
   * The colour the bottom of the dissolve arrives at, which MUST be the
   * colour whatever comes next opens on:
   *
   *   "cream" — the next block paints its own cream wash and carries the
   *             colour further down the page itself.
   *   "white" — the dissolve runs all the way out here, landing on the
   *             page's plain white.
   *
   * Getting this wrong is the one thing that puts a visible horizontal
   * line back into the design, so it is required rather than defaulted.
   */
  landsOn: "cream" | "white";
  /** Artwork-specific light, positioned over the real light source in this
   *  particular image. Faded out by scroll along with the artwork, so no
   *  glow ever outlives the thing it belongs to. */
  light?: ReactNode;
  /**
   * How far up from the bottom the dissolve reaches. This is the dial that
   * decides how much of the artwork survives, and the right value depends
   * entirely on what is IN the lower half of a given image. An artwork
   * whose bottom is empty haze can afford a tall, luxurious dissolve; one
   * with a subject down there — a chair, a plant — needs a short one that
   * starts below the subject, or the dissolve eats the very thing the
   * image was chosen for.
   */
  dissolveHeight?: string;
  /**
   * Where the overscanned frame sits. Pushing it further up lifts the whole
   * artwork within the hero, which is the only way to get a subject that
   * sits ON the image's own bottom edge clear of the dissolve — shortening
   * the dissolve alone cannot do it, because there is no image left below
   * the subject to fade. The extra crop is taken off the top, so this is
   * only safe for artworks whose top is empty (sky, a bare wall).
   */
  frameTop?: string;
  /**
   * Where the crop is anchored horizontally. A narrow viewport throws away
   * most of a 16:9 artwork's width, and "centre" is rarely where the
   * subject is — the counselling chair sits far enough right that a phone
   * loses it completely. Pass responsive object-position classes to keep
   * whatever identifies the image in frame at every width.
   */
  imageClassName?: string;
  /** Opacity of the soft pool of light behind the copy. Lower it when the
   *  artwork is already pale enough to read against unaided — every point
   *  of this is a point of the artwork you are giving up. */
  ground?: number;
  /** How far the scroll dissolve goes. Lower it for artworks with real
   *  subject matter, which should still be recognisable on the way out. */
  veilTo?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Hydration-safe: see useCalmMotion. Branching on the raw hook here made
  // the whole hero mismatch for reduced-motion visitors.
  const reduced = useCalmMotion();

  // Measured across the hero's own travel: 0 at rest, 1 when the hero's
  // bottom edge reaches the top of the viewport.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Parallax. The overscanned frame below (-top-[10%] h-[120%]) is what
  // gives this room to move without ever exposing an edge.
  const artY = useTransform(scrollYProgress, [0, 1], ["0%", "9%"]);
  const artScale = useTransform(scrollYProgress, [0, 1], [1.03, 1.1]);

  // The dissolve. Deliberately does nothing for the first quarter of the
  // scroll — the artwork should be fully itself while you are still reading
  // the headline, and only start becoming the page once you have moved on.
  const veil = useTransform(scrollYProgress, [0.22, 1], [0, veilTo]);
  const lightFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Landing on cream is a single hue all the way down, so the stops can be
  // pure alpha. Landing on white is a real colour change, and it has to be
  // spread over roughly the bottom half of the dissolve — crushed into the
  // last stretch it shows up as a soft horizontal band right where the
  // section ends, which is the exact artefact this whole component exists
  // to avoid.
  const dissolve =
    landsOn === "cream"
      ? `linear-gradient(to bottom, rgba(${ARTWORK_CREAM},0) 0%, rgba(${ARTWORK_CREAM},0.42) 30%, rgba(${ARTWORK_CREAM},0.82) 58%, rgba(${ARTWORK_CREAM},0.97) 80%, rgb(${ARTWORK_CREAM}) 100%)`
      : `linear-gradient(to bottom, rgba(${ARTWORK_CREAM},0) 0%, rgba(${ARTWORK_CREAM},0.4) 26%, rgba(${ARTWORK_CREAM},0.78) 46%, rgba(250,247,246,0.93) 66%, rgba(253,252,251,0.99) 84%, rgb(255,255,255) 100%)`;

  return (
    <div ref={ref} className={`grain-fine relative isolate ${className}`}>
      {/* ---- The artwork ------------------------------------------------ */}
      <div className="pointer-events-none absolute inset-0 -z-30 overflow-hidden" aria-hidden>
        <motion.div
          className="absolute inset-x-0 h-[120%]"
          style={
            reduced ? { top: frameTop } : { top: frameTop, y: artY, scale: artScale }
          }
        >
          <Image
            src={src}
            alt=""
            fill
            priority
            quality={90}
            sizes="100vw"
            className={`object-cover ${imageClassName}`}
          />
        </motion.div>
      </div>

      {/* ---- Light native to this artwork -------------------------------- */}
      {light && (
        <motion.div
          className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
          style={reduced ? undefined : { opacity: lightFade }}
          aria-hidden
        >
          {light}
        </motion.div>
      )}

      {/* ---- Seating the navbar ------------------------------------------
          The artwork runs up behind the sticky glass navbar (that is why it
          has no top edge either). This very soft top wash keeps whatever is
          brightest up there from fighting the navbar's ink type. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.42), rgba(255,255,255,0))",
        }}
        aria-hidden
      />

      {/* ---- Reading ground ---------------------------------------------
          A wide, soft pool of light behind the copy. Big enough and faint
          enough that it never reads as a panel — it just guarantees the
          headline has something to sit on wherever the crop lands. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            `radial-gradient(62% 52% at 50% 44%, rgba(255,255,255,${ground}), rgba(255,255,255,${ground * 0.32}) 58%, rgba(255,255,255,0) 78%)`,
        }}
        aria-hidden
      />

      {/* ---- The dissolve ------------------------------------------------
          THE important layer. The artwork's bottom passes through its own
          warm cream and arrives at whatever comes next with nothing that
          could be called an edge. Held at -z-10 so it sits above the
          artwork and its light, and below the copy. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10"
        style={{ height: dissolveHeight, background: dissolve }}
        aria-hidden
      />

      {/* ---- The scroll dissolve ----------------------------------------
          What stops this being a picture that scrolls past. As the hero
          leaves, white rises through the whole frame and the artwork
          becomes the page instead of exiting it. */}
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0 -z-10 bg-white"
          style={{ opacity: veil }}
          aria-hidden
        />
      )}

      {children}
    </div>
  );
}
