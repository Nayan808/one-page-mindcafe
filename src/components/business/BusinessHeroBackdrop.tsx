"use client";

import type { ReactNode } from "react";
import { ArtworkHero } from "@/components/atmosphere/ArtworkHero";

/**
 * The business hero's atmosphere: the quiet blush desk, plus the light that
 * belongs to it.
 *
 * The blend itself — no edges, parallax, the scroll dissolve — lives in
 * ArtworkHero, shared with the Feelz and counselling heroes. What is
 * specific here is the artwork and where its light actually is: morning sun
 * through a window frame, falling across the wall at a shallow angle and
 * catching the desk. So the pool on the wall swells and settles, and the
 * shaft creeps sideways over half a minute. Nothing here draws new window
 * bars; the artwork already has them, and adding more would read as an
 * overlay rather than as light in the room.
 *
 * `landsOn="white"` because nothing below paints a wash of its own — the
 * next section is plain white, so the dissolve runs all the way out here.
 */
export function BusinessHeroBackdrop({ children }: { children: ReactNode }) {
  return (
    <ArtworkHero
      src="/business/hero-artwork.png"
      landsOn="white"
      // Everything that makes this read as a room rather than a gradient —
      // the vase, the books, the pencil cup, the desk edge — lives in the
      // bottom fifth. So the frame comes up (the extra crop is taken off a
      // bare wall) and the dissolve is kept short, taking only the desk
      // surface itself, which is pale enough to hand over to white without
      // anyone seeing it happen.
      frameTop="-18%"
      dissolveHeight="12%"
      // A phone sees roughly a fifth of this artwork's width. Centred, that
      // fifth is bare wall; anchoring left keeps the vase, the sprig and
      // the window bars — the half that carries the light. From `sm` up
      // there is room for the whole desk and the crop returns to centre.
      imageClassName="object-[14%_50%] sm:object-center"
      ground={0.34}
      veilTo={0.3}
      light={
        <>
          {/* The pool of window light on the wall, breathing. Sat over the
              artwork's own brightest area and screen-blended, so it adds
              light rather than painting a shape. */}
          <div
            className="hero-bloom absolute left-[14%] top-[22%] h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(closest-side, rgba(255,247,238,0.82), rgba(255,241,231,0.3) 44%, rgba(255,241,231,0) 72%)",
              mixBlendMode: "screen",
            }}
          />

          {/* The shaft itself, creeping across the wall on this artwork's
              own shallower angle. The rotation lives on the wrapper and the
              drift on the child, because .hero-haze animates `transform` —
              put both on one element and the keyframes overwrite the
              angle. */}
          <div
            className="absolute -left-[10%] top-[4%] h-[30rem] w-[86%] origin-top-left"
            style={{ transform: "rotate(21deg)" }}
          >
            <div
              className="hero-haze h-full w-full"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,250,244,0) 0%, rgba(255,248,240,0.52) 46%, rgba(255,250,244,0) 100%)",
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
