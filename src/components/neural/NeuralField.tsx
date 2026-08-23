"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import { NeuralScene, type NeuralTheme } from "./NeuralScene";
import { NEURAL_INK, NEURAL_PALETTE } from "./palette";
import { useScrollSignal } from "./useScrollSignal";

export type NeuralFieldProps = {
  /** Target node count. Auto-reduced on low-power devices. */
  density?: number;
  /** Multiplier on pulse travel speed. */
  pulseRate?: number;
  /** Node core tint A. Defaults to --brand-blush. */
  baseColor?: string;
  /** Node core tint B. Defaults to --brand-purple. */
  accentColor?: string;
  /** Overall emissive strength, 0..1+. Tune down behind text. */
  intensity?: number;
  /** Open on the head-profile silhouette. Leave on for a hero band only. */
  signature?: boolean;
  /** "ink" = fine dark filaments drawn on the cream page (default);
   *  "glow" = additive luminous field for a dark band. */
  theme?: NeuralTheme;
  /** Drive progress from whole-document scroll instead of this element’s
   *  own position — used by the fixed full-page field. */
  useDocumentScroll?: boolean;
};

/** Coarse capability probe. Deliberately conservative — a wrong guess
 *  toward "low" costs a little bokeh, a wrong guess toward "high" costs
 *  a phone its frame rate and battery. */
function detectLowPower(): boolean {
  if (typeof window === "undefined") return true;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 820px)").matches;
  return coarse || narrow || cores <= 4;
}

/**
 * The WebGL field itself. Rendered inside a NeuralBand, never mounted at
 * the app root: the site is light-themed (body is opaque --cream), so a
 * fixed z-index:-1 canvas behind the whole document would be painted over
 * and invisible. Bands opt in explicitly instead.
 */
export function NeuralField({
  density = 460,
  pulseRate = 1,
  baseColor,
  accentColor,
  intensity = 1,
  signature = true,
  theme = "ink",
  useDocumentScroll = false,
}: NeuralFieldProps) {
  const ink = theme === "ink";
  const colorA = baseColor ?? (ink ? NEURAL_INK.nodeA : NEURAL_PALETTE.nodeA);
  const colorB = accentColor ?? (ink ? NEURAL_INK.nodeB : NEURAL_PALETTE.nodeB);
  const hostRef = useRef<HTMLDivElement>(null);

  const [lowPower, setLowPower] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  // Capability + preference probes run after mount so nothing here can
  // desync server and client markup.
  useEffect(() => {
    setLowPower(detectLowPower());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Never burn GPU on a field nobody is looking at.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setOnScreen(entries[0]?.isIntersecting ?? false), {
      rootMargin: "120px",
    });
    io.observe(el);

    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const active = onScreen && tabVisible;
  const signal = useScrollSignal(hostRef, active && !reducedMotion, useDocumentScroll);

  const nodeCount = useMemo(
    // Ink mode runs no post-processing passes at all, so it can afford a
    // finer mesh than the glow build could.
    () => Math.round(Math.min(ink ? 520 : 400, Math.max(120, lowPower ? density * 0.5 : density))),
    [density, lowPower, ink],
  );

  // "demand" renders exactly one frame for the reduced-motion still;
  // "never" fully parks the loop while offscreen or backgrounded.
  const frameloop = reducedMotion ? "demand" : active ? "always" : "never";

  return (
    <div ref={hostRef} className="absolute inset-0" aria-hidden>
      <Canvas
        dpr={[1, 2]}
        frameloop={frameloop}
        gl={{ antialias: ink, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 52, near: 0.1, far: 60, position: [0, 0, 7.2] }}
        style={{ background: ink ? "transparent" : NEURAL_PALETTE.background }}
      >
        <NeuralScene
          density={nodeCount}
          pulseRate={pulseRate}
          baseColor={colorA}
          accentColor={colorB}
          intensity={intensity}
          signal={signal}
          still={reducedMotion}
          enableDof={!lowPower && !reducedMotion}
          signature={signature}
          theme={theme}
        />
      </Canvas>
    </div>
  );
}
