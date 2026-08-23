"use client";

import dynamic from "next/dynamic";
import type { ScrollFrameHeroProps } from "./ScrollFrameHero";

/** Matches the component's own internal placeholder exactly, so the swap
 *  from "chunk still loading" to "frames still decoding" is seamless. */
function HeroPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative isolate overflow-hidden ${className}`}
      style={{
        background:
          "radial-gradient(120% 90% at 50% 60%, #1a1420 0%, #0b0910 55%, #060509 100%)",
      }}
      aria-hidden
    />
  );
}

// Code-split: the sequence logic and its frame decoding never touch routes
// that don't render a hero.
const Inner = dynamic(() => import("./ScrollFrameHero").then((m) => m.ScrollFrameHero), {
  ssr: false,
  loading: () => <HeroPlaceholder className="min-h-screen" />,
});

export function ScrollFrameHeroLazy(props: ScrollFrameHeroProps) {
  return <Inner {...props} />;
}
