"use client";

import type { ReactNode } from "react";
import { ArtworkHero } from "@/components/atmosphere/ArtworkHero";

/**
 * The counselling hero's atmosphere: the quiet blush room, plus the light
 * that belongs to it.
 *
 * The blend itself — no edges, parallax, the scroll dissolve — lives in
 * ArtworkHero, shared with the Feelz hero. What is specific here is only
 * the artwork and where its light actually is, and the light in this one is
 * a different animal entirely: not a sun on a horizon but late-morning sun
 * through a blind, falling across a wall. So it moves the way that light
 * moves — the pool on the wall swells and settles, and the shaft creeps
 * sideways over half a minute, the way a room actually changes while you
 * are sitting in it. Nothing here draws new blind stripes; the artwork
 * already has them, and adding more would read as an overlay.
 *
 * `landsOn="white"` because nothing below paints a wash of its own — the
 * counselling page's next section is plain white, so the dissolve runs all
 * the way out here, inside the hero's own generous bottom padding.
 */
export function CounsellingHeroBackdrop({ children }: { children: ReactNode }) {
  return (
    <ArtworkHero
      src="/counselling/hero-artwork.png"
      landsOn="white"
      // This artwork has a subject in its lower half — the armchair, the
      // cushion, the plant — and those are what make the section read as
      // counselling rather than as a nice gradient. So the dissolve starts
      // well below them and only takes the floor, and the reading ground
      // and scroll veil are both pulled back hard. The Feelz artwork's
      // bottom is empty haze and can afford the full defaults; this one
      // cannot.
      // The chair sits ON the artwork's own bottom edge, so there is no
      // image below it to fade — the frame has to come up instead. The
      // extra crop comes off the top, which here is a bare wall.
      frameTop="-22%"
      // A phone sees roughly a fifth of this artwork's width. Centred, that
      // fifth is bare wall — the chair falls off the right edge and the
      // section stops reading as a room at all. So narrow viewports anchor
      // the crop on the chair and give up the plant on the left; from `sm`
      // up there is room for both and the crop returns to centre.
      imageClassName="object-[66%_50%] sm:object-center"
      dissolveHeight="18%"
      ground={0.34}
      veilTo={0.3}
      light={
        <>
          {/* The pool of window light on the wall, breathing. Sat over the
              artwork's own brightest area and screen-blended, so it adds
              light rather than painting a shape. */}
          <div
            className="hero-bloom absolute left-[17%] top-[26%] h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(closest-side, rgba(255,246,236,0.8), rgba(255,240,228,0.3) 44%, rgba(255,240,228,0) 72%)",
              mixBlendMode: "screen",
            }}
          />

          {/* The shaft itself, creeping across the wall. The rotation lives
              on the wrapper and the drift on the child, because .hero-haze
              animates `transform` — put both on one element and the
              keyframes overwrite the angle. */}
          <div
            className="absolute -left-[12%] top-[2%] h-[34rem] w-[78%] origin-top-left"
            style={{ transform: "rotate(26deg)" }}
          >
            <div
              className="hero-haze h-full w-full"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,249,242,0) 0%, rgba(255,247,238,0.55) 46%, rgba(255,249,242,0) 100%)",
                mixBlendMode: "screen",
                filter: "blur(26px)",
              }}
            />
          </div>
        </>
      }
    >
      {children}
    </ArtworkHero>
  );
}
