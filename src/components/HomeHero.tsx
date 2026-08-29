"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { JourneyStrip } from "@/components/hero/JourneyStrip";
import { HeroLightFlow } from "@/components/hero/HeroLightFlow";
import { SettledWord, UnsettledWord } from "@/components/hero/FloatingWords";

// Homepage hero built ON the cinematic artwork (public/homepage/hero-artwork.png)
// rather than attempting to recreate it.
//
// The previous SVG-wave/silhouette implementation is gone — HeroCanvas.tsx,
// FigureSilhouette.tsx and heroPalette.ts were deleted outright, not disabled.
// Nothing draws the artwork any more; the artwork IS the artwork.
//
// Layers (back to front), matching the spec:
//   1 base colour · 2 the artwork · 3 readability gradients · 4 atmosphere
//   (warm glow + particles) · 5 floating words · 6 content · 7 journey strip
//
// Motion is motion@12 (already a project dependency). Everything continuous
// is transform/opacity only, and the artwork itself is never "animated" —
// perceived depth comes from separate layers moving at different rates.
const EASE = [0.22, 0.61, 0.36, 1] as const;

const T = {
  art: 0.07,
  eyebrow: 0.52,
  headline: 0.7,
  paragraph: 1.3,
  ctas: 1.47,
  words: 1.68,
  journey: 1.85,
  cue: 2.05,
};

/** Beat between each word arriving. Eight words in all, so the full
 *  sequence runs a little over 2.5s — unhurried, but never a wait. */
const WORD_GAP = 0.24;

// Confined to a safe corridor between the copy and the figure.
//
// LEFT BOUND: the copy column is lg:w-[40%] inside a max-w-7xl container,
// which reaches roughly 41% of the viewport — the previous 30–40% positions
// put these words directly on top of the paragraph and the CTA buttons.
// RIGHT BOUND: the figure's hair begins around 58%.
// So everything lives in 44–53%, and the vertical steps are wide enough
// (11–12%) that no two words can collide even at full drift.
//
// `dur` drives each word's drift cycle; the entrance order is handled by
// WORD_GAP at the call site, deliberately independent of it.
const EMOTIONS = [
  { word: "Overthinking", top: "24%", left: "45%", drift: 7, dur: 21, delay: 0 },
  { word: "Stress", top: "35%", left: "48.5%", drift: 8, dur: 25, delay: 1.4 },
  { word: "Anxiety", top: "46%", left: "44.5%", drift: 6, dur: 19, delay: 0.7 },
  { word: "Self-Doubt", top: "57%", left: "47.5%", drift: 7, dur: 23, delay: 2.1 },
  { word: "Low Mood", top: "68%", left: "45%", drift: 6, dur: 27, delay: 1.1 },
];

/** On the warm side. Deliberately steadier — they drift roughly a third as
 *  far as the difficult words, which is the emotional point. */
const CALM = [
  { word: "Understanding", top: "30%", left: "86.5%" },
  { word: "Healing", top: "41%", left: "89%" },
  { word: "Clarity", top: "52%", left: "87.5%" },
];

export function HomeHero() {
  const prefersReduced = useReducedMotion();
  const reduced = !!prefersReduced;

  // Pointer parallax, desktop only. Written to a ref and applied via
  // transform on three layers at different depths.
  const shellRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const onMove = (e: MouseEvent) => {
      const el = shellRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };

    const tick = () => {
      current.x += (target.x - current.x) * 0.04;
      current.y += (target.y - current.y) * 0.04;
      setPointer({ x: current.x, y: current.y });
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const rise = (delay: number, y = 14) => ({
    initial: reduced ? false : { opacity: 0, y, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <section
      // Anchor for the Header: it measures this element to know whether it
      // is still over the dark artwork or has passed into the light page.
      id="home-hero"
      ref={shellRef}
      // Slides under the sticky, transparent navbar so the artwork begins at
      // the true top of the viewport. Without this the header renders over the
      // page background instead, and its cream-toned links sit on cream.
      className="relative isolate -mt-[84px] overflow-hidden"
      style={{ backgroundColor: "#150c1c" }}
    >
      {/* 1+2 — base colour and the artwork. The base prevents a white flash
             before the image decodes and shows through the blend at the
             bottom edge. The artwork moves ~8px with the pointer and holds a
             very slow 22s Ken Burns, both far below the threshold of
             noticing. */}
      <motion.div
        className="absolute inset-0 -z-30"
        initial={reduced ? false : { opacity: 0, scale: 1.03 }}
        animate={
          reduced
            ? { opacity: 1, scale: 1 }
            : { opacity: 1, scale: [1.012, 1.0, 1.012] }
        }
        transition={
          reduced
            ? { duration: 0.8 }
            : {
                opacity: { duration: 1.26, delay: T.art, ease: EASE },
                scale: { duration: 22, repeat: Infinity, ease: "easeInOut" },
              }
        }
        style={{ transform: `translate3d(${pointer.x * -8}px, ${pointer.y * -6}px, 0)` }}
        aria-hidden
      >
        <Image
          src="/homepage/hero-artwork.png"
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          // Desktop keeps the full composition; narrower screens bias the
          // crop rightward so the figure and the warm valley stay in frame
          // instead of showing only empty dark space.
          className="object-cover object-[68%_center] md:object-[60%_center] lg:object-center"
        />

        {/* Registered to the artwork's own strands and sparkles, inside the
            SAME container as the Image so it shares the exact cover box and
            the pointer/Ken-Burns transform. Screen-blended, so it only ever
            adds light to highlights the artwork already has. */}
        <HeroLightFlow reduced={reduced} />
      </motion.div>

      {/* 3 — readability. Deliberately restrained and left-weighted so the
             artwork stays visible; this is not a blanket dark overlay. */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(97deg, rgba(12,7,16,0.94) 0%, rgba(12,7,16,0.86) 22%, rgba(14,8,18,0.55) 40%, rgba(16,9,20,0.12) 56%, rgba(0,0,0,0) 70%)",
        }}
        aria-hidden
      />
      {/* Mobile needs more help: the copy sits over the artwork rather than
          beside it, so a vertical scrim is added only at small sizes. */}
      <div
        className="absolute inset-0 -z-20 md:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,6,14,0.88) 0%, rgba(10,6,14,0.55) 45%, rgba(10,6,14,0.75) 100%)",
        }}
        aria-hidden
      />
      {/* Anchors the journey strip: the artwork is brightest at lower-right,
          exactly where the last indicator sits, so a low scrim keeps that row
          legible without dimming the composition above it. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-20 h-[34%]"
        style={{ background: "linear-gradient(to top, rgba(10,6,14,0.82) 0%, rgba(10,6,14,0.45) 45%, rgba(10,6,14,0) 100%)" }}
        aria-hidden
      />

      {/* Soft vignette to seat the frame. */}
      <div
        className="pointer-events-none absolute inset-0 -z-20"
        style={{ boxShadow: "inset 0 0 180px 40px rgba(10,6,14,0.55)" }}
        aria-hidden
      />

      {/* 4 — atmosphere: a warm breathing glow sitting over the artwork's own
             sun, plus drifting dust. */}
      <motion.div
        className="pointer-events-none absolute -z-10 hidden md:block"
        style={{
          right: "2%",
          top: "18%",
          width: "34%",
          height: "56%",
          background:
            "radial-gradient(closest-side, rgba(255,214,150,0.30) 0%, rgba(255,186,110,0.14) 42%, rgba(0,0,0,0) 100%)",
          transform: `translate3d(${pointer.x * -14}px, ${pointer.y * -10}px, 0)`,
        }}
        animate={reduced ? { opacity: 0.7 } : { opacity: [0.55, 0.9, 0.55], scale: [1, 1.05, 1] }}
        transition={
          reduced ? { duration: 1 } : { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      />

      {/* The free-floating DOM particle field that used to sit here is gone.
          It drifted at positions unrelated to the artwork, which is precisely
          what made it read as something laid on top. Its job is now done by
          HeroLightFlow, whose sparkles sit on highlights the artwork already
          has and blend additively into them. */}

      {/* 5 — floating words.
             NO POINTER PARALLAX HERE. This layer used to shift with the
             cursor, and although there is no :hover rule anywhere on it, a
             word that moves whenever the mouse does is indistinguishable
             from a hover effect. The artwork and the warm glow still carry
             parallax; the words stay exactly where they were placed. */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden lg:block" aria-hidden>
        {/* ONE BY ONE, in narrative order.
            The difficult thoughts arrive top-to-bottom first, then the calm
            words answer them — so the sequence itself performs the journey
            rather than the whole set fading up together. Entrance timing is
            deliberately decoupled from each word's drift phase: the arrival
            is orderly, the drifting afterwards is not. */}
        {EMOTIONS.map((e, i) => (
          <UnsettledWord
            key={e.word}
            word={e.word}
            top={e.top}
            left={e.left}
            drift={e.drift}
            duration={e.dur}
            delay={T.words + i * WORD_GAP}
            reduced={reduced}
          />
        ))}

        {CALM.map((c, i) => (
          <SettledWord
            key={c.word}
            word={c.word}
            top={c.top}
            left={c.left}
            index={i}
            // Picks up right after the last difficult word lands.
            delay={T.words + EMOTIONS.length * WORD_GAP + 0.21 + i * WORD_GAP}
            reduced={reduced}
          />
        ))}
      </div>

      {/* 6+7 — content. */}
      <div className="relative mx-auto min-h-[92vh] max-w-7xl px-5 pb-10 pt-28 sm:px-8 lg:min-h-screen lg:pt-32">
        <div className="flex min-h-[46vh] flex-col justify-center md:w-[56%] lg:min-h-[52vh] lg:w-[40%]">
          <motion.p
            className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#c9b3a0]"
            {...rise(T.eyebrow, 8)}
          >
            For your mind. For your everyday.
          </motion.p>

          <h1 className="font-display mt-6 text-[2rem] font-bold leading-[1.12] tracking-tight text-[#f6efe4] sm:text-[2.6rem] lg:text-[3.15rem]">
            {["Better days begin", "with a healthier"].map((line, i) => (
              <motion.span key={line} className="block" {...rise(T.headline + i * 0.105)}>
                {line}
              </motion.span>
            ))}
            <motion.span className="block" {...rise(T.headline + 0.21)}>
              <span className="font-tagline italic text-[#d9bff0]">mind.</span>
            </motion.span>
          </h1>

          <motion.div
            className="mt-7 h-px w-12 bg-[#f6efe4]/25"
            initial={reduced ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.63, delay: T.paragraph - 0.14, ease: EASE }}
            style={{ transformOrigin: "left" }}
          />

          <motion.p
            className="mt-6 max-w-sm text-[13.5px] leading-relaxed text-[#e8dcd2]/70"
            {...rise(T.paragraph, 12)}
          >
            Science-backed wellness, human support, and everyday tools to help you understand,
            care for, and strengthen your mental wellbeing.
          </motion.p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <motion.span {...rise(T.ctas, 10)}>
              <Link href="/feelz" className="btn-cine-primary group">
                Shop Feelz
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </motion.span>
            <motion.span {...rise(T.ctas + 0.084, 10)}>
              <Link href="/book-appointment" className="btn-cine-secondary group">
                Talk to an Expert
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </motion.span>
          </div>
        </div>

        <div className="mt-12 border-t border-[#f6efe4]/10 pt-7 lg:mt-16">
          <JourneyStrip reduced={reduced} delay={T.journey} />
        </div>

        <motion.button
          type="button"
          onClick={() => document.getElementById("feelz-teaser")?.scrollIntoView({ behavior: "smooth" })}
          // Centred, matching the reference: the scroll cue is an invitation
          // to the whole page, so it belongs on the hero's centre axis rather
          // than hanging off the end of the left-hand copy column.
          className="mt-6 flex items-center justify-center gap-3 text-[9.5px] uppercase tracking-[0.2em] text-[#f6efe4]/35 transition-colors hover:text-[#f6efe4]/60"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.84, delay: T.cue, ease: EASE }}
        >
          <span className="relative flex h-6 w-4 items-start justify-center rounded-full border border-[#f6efe4]/25 pt-1">
            <motion.span
              className="h-1 w-0.5 rounded-full bg-[#f6efe4]/60"
              animate={reduced ? undefined : { y: [0, 6, 0], opacity: [0.8, 0.2, 0.8] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
          Scroll to begin your journey
        </motion.button>
      </div>

      {/* Soft blend into whatever follows — no hard cut, and the hook point
          for the future scroll continuation. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(to bottom, rgba(21,12,28,0) 0%, #150c1c 100%)" }}
        aria-hidden
      />
    </section>
  );
}
