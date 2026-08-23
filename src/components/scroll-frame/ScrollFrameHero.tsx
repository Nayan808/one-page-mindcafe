"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useScrollSignal } from "@/components/neural/useScrollSignal";

export type ColorGrade = {
  /** Degrees, e.g. -8 nudges the blush nodes toward mauve. */
  hue: number;
  /** 1 = untouched. */
  saturation: number;
  /** 1 = untouched. */
  brightness: number;
  /** 1 = untouched. */
  contrast: number;
  /** Colour laid over the frame in `overlay` blend. */
  tint: string;
  /** 0 disables the tint entirely. */
  tintAmount: number;
};

// The raw render already lands close to the brand — warm blush/mauve nodes
// on near-black. So the default grade is deliberately near-neutral: it
// exists as a correction hook, not as a look. Every value here is live-
// adjustable from the preview page.
export const DEFAULT_GRADE: ColorGrade = {
  hue: 0,
  saturation: 1,
  brightness: 1,
  contrast: 1,
  tint: "#cf96af",
  tintAmount: 0,
};

export type ScrollFrameHeroProps = {
  /** Directory holding frame-%04d.webp + manifest.json. */
  basePath?: string;
  grade?: Partial<ColorGrade>;
  /** Gentle loop over the opening frames while the page is unscrolled. */
  idle?: boolean;
  /** Seconds of the source clip to use for that idle loop. */
  idleSeconds?: number;
  /** Height of the scroll runway the sequence scrubs across, as a CSS
   *  length. The stage pins for this distance, so bigger = slower scrub.
   *  300vh means the user scrolls two extra viewports to play the clip. */
  scrollLength?: string;
  className?: string;
  children?: ReactNode;
};

type Manifest = {
  frameCount: number;
  width: number;
  height: number;
  pattern: string;
  sourceDuration: number;
};

function frameUrl(basePath: string, pattern: string, index1: number) {
  // Supports the manifest's printf-style pattern without pulling in a
  // formatting dependency for one substitution.
  return `${basePath}/${pattern.replace(/%(\d*)d/, (_, width) =>
    String(index1).padStart(Number(width) || 1, "0"),
  )}`;
}

/**
 * Scroll-scrubbed frame sequence, Apple-product-page style.
 *
 * Scroll position comes from the site's existing useScrollSignal rather than
 * a scroll library, so this shares one damped, passive, rAF-batched scroll
 * source with the neural field — no second scroll authority, and the
 * native-scroll-only decision holds.
 *
 * Frames are decoded once into an array of HTMLImageElement and then only
 * blitted, so the per-frame cost while scrubbing is a single drawImage.
 */
export function ScrollFrameHero({
  basePath = "/sequence/neural-hero",
  grade,
  idle = true,
  idleSeconds = 2,
  scrollLength = "320vh",
  className = "",
  children,
}: ScrollFrameHeroProps) {
  /** Tall runway; scroll progress is measured against this. */
  const hostRef = useRef<HTMLDivElement>(null);
  /** Sticky, one-viewport stage; the canvas is sized to THIS, not the
   *  runway, or it would be stretched to the full 320vh. */
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);

  // Frames live in a ref, not state: this array is written 96 times during
  // load and read every frame while scrubbing, and none of that should
  // trigger a React render.
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);

  const g = useMemo(() => ({ ...DEFAULT_GRADE, ...grade }), [grade]);

  const active = onScreen && tabVisible;
  const signal = useScrollSignal(hostRef, active && !reducedMotion);

  // --- Preferences + visibility ---------------------------------------
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => setOnScreen(e[0]?.isIntersecting ?? false), {
      rootMargin: "120px",
    });
    io.observe(el);
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // --- Manifest + progressive preload ---------------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      const res = await fetch(`${basePath}/manifest.json`);
      if (!res.ok) return;
      const m: Manifest = await res.json();
      if (!alive) return;
      setManifest(m);
      framesRef.current = new Array(m.frameCount).fill(null);

      const load = (i: number) =>
        new Promise<void>((done) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = () => {
            if (!alive) return done();
            framesRef.current[i] = img;
            setLoadedCount((c) => c + 1);
            done();
          };
          img.onerror = () => done();
          img.src = frameUrl(basePath, m.pattern, i + 1);
        });

      // Frame 1 first and on its own — it is the resting hero state, so it
      // has to be paintable before anything else competes for bandwidth.
      await load(0);

      // Remainder in a small concurrency window. Sequential would take too
      // long to become scrubable; unbounded would stall the first paint of
      // everything else on the page.
      const CONCURRENCY = 6;
      let next = 1;
      await Promise.all(
        Array.from({ length: CONCURRENCY }, async () => {
          while (alive && next < m.frameCount) {
            const i = next++;
            await load(i);
          }
        }),
      );
    })();

    return () => {
      alive = false;
    };
  }, [basePath]);

  // --- Draw loop -------------------------------------------------------
  useEffect(() => {
    if (!manifest) return;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let lastDrawn = -1;
    const started = performance.now();

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      lastDrawn = -1; // force a repaint at the new size
    };

    /** Nearest already-decoded frame at or before `i`, so scrubbing during
     *  load degrades to "slightly stale" rather than flashing empty. */
    const resolveFrame = (i: number) => {
      const frames = framesRef.current;
      for (let k = i; k >= 0; k--) if (frames[k]) return frames[k];
      for (let k = i + 1; k < frames.length; k++) if (frames[k]) return frames[k];
      return null;
    };

    const draw = (index: number) => {
      if (index === lastDrawn) return;
      const img = resolveFrame(index);
      if (!img) return;
      lastDrawn = index;

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);

      // Cover-fit, so the hero fills any aspect ratio without letterboxing.
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;

      ctx.filter = `saturate(${g.saturation}) hue-rotate(${g.hue}deg) brightness(${g.brightness}) contrast(${g.contrast})`;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      ctx.filter = "none";

      if (g.tintAmount > 0) {
        // `overlay` keeps the blacks black and the highlights bright while
        // pulling midtones toward the brand hue — a flat `source-over` fill
        // would just fog the whole frame.
        ctx.globalCompositeOperation = "overlay";
        ctx.globalAlpha = g.tintAmount;
        ctx.fillStyle = g.tint;
        ctx.fillRect(0, 0, cw, ch);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
    };

    resize();
    window.addEventListener("resize", resize);

    // Reduced motion: one frame, no loop, ever.
    if (reducedMotion) {
      const paint = () => draw(0);
      paint();
      const t = window.setTimeout(paint, 400); // in case frame 1 lands late
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("resize", resize);
      };
    }

    const idleFrames = Math.max(
      2,
      Math.round((idleSeconds / manifest.sourceDuration) * manifest.frameCount),
    );

    const tick = () => {
      const progress = signal.current.progress;
      const last = manifest.frameCount - 1;

      if (idle && progress < 0.004) {
        // Resting state: drift through the opening frames at the clip's own
        // rate. Hands straight over to scrubbing as soon as the user moves,
        // because the branch below takes over the moment progress rises.
        const fps = manifest.frameCount / manifest.sourceDuration;
        const elapsed = (performance.now() - started) / 1000;
        draw(Math.floor(elapsed * fps) % idleFrames);
      } else {
        draw(Math.min(last, Math.max(0, Math.round(progress * last))));
      }

      frame = requestAnimationFrame(tick);
    };

    if (active) frame = requestAnimationFrame(tick);
    else draw(0); // parked offscreen: leave a correct still behind

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [manifest, active, reducedMotion, idle, idleSeconds, signal, g]);

  const ready = loadedCount > 0;

  return (
    // Two elements, and the split matters. The OUTER one is tall — it is the
    // scroll runway, and useScrollSignal measures progress against its
    // height. The INNER one is sticky and exactly one viewport tall, so the
    // stage pins in place while that runway scrolls past underneath.
    //
    // Without this the sequence finishes as soon as the hero's own height has
    // scrolled by, and the hero then simply leaves the viewport mid-clip —
    // which is what a non-sticky version does no matter how much runway you
    // add below it.
    <div ref={hostRef} className={`relative ${className}`} style={{ height: scrollLength }}>
      <div ref={stageRef} className="sticky top-0 h-screen overflow-hidden isolate">
        {/* Gradient standing in until frame 1 decodes. Same near-black the
            footage sits on, so the handover is invisible. */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 60%, #1a1420 0%, #0b0910 55%, #060509 100%)",
          }}
          aria-hidden
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full transition-opacity duration-700"
          style={{ opacity: ready ? 1 : 0 }}
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}
