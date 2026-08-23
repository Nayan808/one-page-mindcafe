"use client";

import dynamic from "next/dynamic";

import type { NeuralFieldProps } from "@/components/neural/NeuralField";

// Code-split: three.js only downloads on routes that actually mount this.
// No loading placeholder — in ink mode the canvas is transparent over the
// page's own cream, so there is nothing to stand in for. The page simply
// renders as it always did until the field arrives, which also means the
// field can never delay or shift first paint.
const NeuralField = dynamic(() => import("@/components/neural/NeuralField").then((m) => m.NeuralField), {
  ssr: false,
});

export type NeuralPageFieldProps = Omit<NeuralFieldProps, "useDocumentScroll">;

/**
 * One fixed, full-viewport neural field sitting behind an entire page.
 *
 * This is the shape the original brief asked for, and it only becomes
 * possible in ink mode. A glowing additive field needs its own dark ground,
 * which is why it previously had to be boxed into opaque dark bands; drawn
 * as ink on the page's existing cream the canvas can be transparent, so one
 * instance covers every section continuously — the network keeps connecting
 * across the whole scroll instead of restarting per band.
 *
 * z-0 with the page content at z-10 rather than a negative z-index: a
 * negative index would place it behind the body's own opaque cream
 * background and it would never be seen at all.
 */
export function NeuralPageField(props: NeuralPageFieldProps) {
  return (
    <div className="neural-fixed pointer-events-none fixed inset-0 z-0" aria-hidden>
      <NeuralField {...props} useDocumentScroll />

      {/* Cream veil between the field and the page content — the ink-mode
          equivalent of the dark scrim the glow bands use. Body copy sits
          directly on the field with no panel behind it, and at full strength
          the filaments cross letterforms enough to hurt reading. Knocking
          the whole drawing back toward the page colour keeps it clearly
          present as texture while handing contrast back to the type. */}
      <div className="absolute inset-0 bg-cream/22" />
    </div>
  );
}
