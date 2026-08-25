"use client";

import type { ReactNode } from "react";
import { ArtworkHero } from "@/components/atmosphere/ArtworkHero";

/**
 * The Feelz hero's atmosphere: the sunrise-over-the-valley artwork, plus
 * the two pieces of light that belong to it.
 *
 * The blend itself — no edges, parallax, the scroll dissolve — lives in
 * ArtworkHero, shared with the counselling hero. What is specific here is
 * only the artwork and where its light actually is.
 *
 * `landsOn="cream"` because the block below this one (the product grid)
 * paints its own cream wash at the top and carries the colour further down
 * the page from there.
 */
export function FeelzHeroBackdrop({ children }: { children: ReactNode }) {
  return (
    <ArtworkHero
      src="/feelz/hero-artwork.png"
      landsOn="cream"
      light={
        <>
          {/* The sun, breathing. Positioned over the artwork's own sun, and
              screen-blended so it adds light rather than painting a shape. */}
          <div
            className="hero-bloom absolute left-[11%] top-[46%] h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(closest-side, rgba(255,238,214,0.85), rgba(255,229,200,0.34) 42%, rgba(255,229,200,0) 72%)",
              mixBlendMode: "screen",
            }}
          />
          {/* Haze over the valley, drifting sideways slowly enough that you
              only catch it if you stare — the air moving, not a shape. */}
          <div
            className="hero-haze absolute left-[-10%] top-[52%] h-[26rem] w-[130%]"
            style={{
              background:
                "radial-gradient(60% 50% at 40% 50%, rgba(255,244,232,0.6), rgba(246,238,246,0) 70%)",
              mixBlendMode: "screen",
            }}
          />
        </>
      }
    >
      {children}
    </ArtworkHero>
  );
}
