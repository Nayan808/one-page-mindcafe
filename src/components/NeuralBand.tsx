"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Value import — palette.ts is plain constants with no three.js dependency,
// so this stays out of the WebGL chunk. The props import is type-only and
// erases at compile time, keeping three out of the shared bundle.
import { NEURAL_PALETTE } from "@/components/neural/palette";
import type { NeuralFieldProps } from "@/components/neural/NeuralField";

// Code-split so three.js never lands in the shared bundle — a route with
// no band pays nothing. ssr:false because WebGL has no server render, and
// the placeholder below is what first paint actually shows.
const NeuralField = dynamic(() => import("@/components/neural/NeuralField").then((m) => m.NeuralField), {
  ssr: false,
  loading: () => <NeuralPlaceholder />,
});

/** Static dark gradient standing in for the canvas until it loads. Shares
 *  the field's background colour so the handover is invisible. */
function NeuralPlaceholder() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(120% 90% at 50% 35%, #131a2c 0%, ${NEURAL_PALETTE.background} 62%, #05070d 100%)`,
      }}
      aria-hidden
    />
  );
}

export type NeuralBandProps = NeuralFieldProps & {
  children: ReactNode;
  /** Extra classes on the section (padding, min-height). */
  className?: string;
  /** Strength of the readability scrim over the field, 0..1. Raise it
   *  behind long copy, drop it toward 0 for a near-bare hero. */
  scrim?: number;
  /** Fade the band bottom into the page cream, for a dark hero that hands
   *  over to light sections below. */
  fadeToPage?: boolean;
};

/**
 * A full-bleed dark section with the neural field behind its content.
 *
 * This is the integration point, replacing the brief's original
 * app-root fixed canvas: this site's body is opaque --cream and every
 * section paints its own background, so a z-index:-1 canvas behind the
 * document would be covered and never seen. Bands invert that — content
 * opts into the dark treatment where it suits the page, and the rest of
 * the site is untouched.
 *
 * The canvas is pointer-events-none and sits below the content layer, so
 * it can never intercept a click.
 */
export function NeuralBand({
  children,
  className = "",
  scrim = 0.55,
  fadeToPage = false,
  density,
  pulseRate,
  baseColor,
  accentColor,
  intensity,
  signature,
}: NeuralBandProps) {
  return (
    <section
      className={`relative isolate overflow-hidden ${className}`}
      style={{ backgroundColor: NEURAL_PALETTE.background }}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <NeuralField
          density={density}
          pulseRate={pulseRate}
          baseColor={baseColor}
          accentColor={accentColor}
          intensity={intensity}
          signature={signature}
          // Bands supply their own near-black ground, so they always want the
          // additive glow treatment. NeuralField itself defaults to "ink"
          // (the homepage case, drawn on cream) — leaving that default here
          // would paint dark ink filaments onto a dark band and render the
          // whole field invisible.
          theme="glow"
        />
      </div>

      {/* Readability scrim between field and copy. Darkest top and bottom,
          lightest through the middle, so the field stays visible where the
          composition is strongest while text keeps AA contrast. */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `linear-gradient(to bottom,
            rgba(8,10,18,${Math.min(1, scrim + 0.2)}) 0%,
            rgba(8,10,18,${Math.max(0, scrim - 0.22)}) 38%,
            rgba(8,10,18,${Math.max(0, scrim - 0.22)}) 62%,
            rgba(8,10,18,${Math.min(1, scrim + 0.2)}) 100%)`,
        }}
        aria-hidden
      />

      {/* Hand-off to the cream page below. Must live HERE, as a sibling of
          the scrim in the band's own stacking context — putting it inside the
          content wrapper positions it against the centred copy column
          instead of the band, which renders it as a grey rectangle floating
          mid-section. */}
      {fadeToPage && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28"
          style={{
            // Fades transparent-CREAM into cream, not transparent-black: starting
            // from black makes the ramp pass through muddy grey on its way to the
            // page colour.
            background: `linear-gradient(to bottom, rgba(246,241,230,0) 0%, rgba(246,241,230,0.35) 62%, var(--cream) 100%)`,
          }}
          aria-hidden
        />
      )}

      <div className="relative z-20">{children}</div>
    </section>
  );
}
