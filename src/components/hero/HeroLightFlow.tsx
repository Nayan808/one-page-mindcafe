"use client";

/**
 * Brings the hero artwork itself to life — its own sparkle points twinkle and
 * its own strands carry travelling light — without altering a single pixel of
 * the design.
 *
 * THREE THINGS MAKE THIS READ AS REAL RATHER THAN AS AN OVERLAY:
 *
 * 1. REGISTRATION. The SVG shares the artwork's exact coordinate space
 *    (viewBox 1672x941 = the PNG's native size) and uses
 *    preserveAspectRatio="xMidYMid slice", which is the SVG equivalent of
 *    object-cover + object-center. So it crops and scales identically to the
 *    image at every viewport size, and the paths stay glued to the real
 *    strands instead of sliding off them.
 *
 * 2. ADDITIVE BLENDING. Everything is drawn with mix-blend-mode: screen, so
 *    it can only ever ADD light to what is already there. Nothing darkens,
 *    nothing sits as a grey film — which is exactly what makes a normal
 *    overlay look pasted on. Where the artwork is already bright the effect
 *    disappears into it; where it is dark, the added light is invisible.
 *
 * 3. LOW AMPLITUDE, LONG PERIODS. Twinkles run 4–9s, flows 13–26s. The eye
 *    reads it as the image breathing, not as a loop.
 */

/** Traced along the artwork's real strand bundles: the fan sweeping left from
 *  the figure's head, plus the two warm arcs wrapping right into the sun. */
const FLOWS: { d: string; dur: number; delay: number; width: number; warm: boolean }[] = [
  {
    d: "M 1290 300 C 1150 250, 950 235, 780 275 C 640 308, 520 355, 430 400",
    dur: 17,
    delay: 0,
    width: 1.1,
    warm: true,
  },
  {
    d: "M 1270 345 C 1100 320, 900 332, 740 378 C 620 412, 520 452, 440 492",
    dur: 21,
    delay: 3.5,
    width: 1.3,
    warm: true,
  },
  {
    d: "M 1210 430 C 1030 420, 860 448, 700 500 C 580 544, 470 586, 380 626",
    dur: 15,
    delay: 1.2,
    width: 1.3,
    warm: false,
  },
  {
    d: "M 1160 520 C 1000 532, 840 572, 700 620 C 590 660, 490 696, 400 726",
    dur: 24,
    delay: 6,
    width: 1.0,
    warm: false,
  },
  {
    d: "M 1130 612 C 990 642, 850 682, 720 722 C 620 752, 530 780, 450 802",
    dur: 19,
    delay: 2.4,
    width: 1.2,
    warm: false,
  },
  {
    d: "M 1300 322 C 1380 262, 1452 236, 1524 242",
    dur: 13,
    delay: 4.4,
    width: 1.4,
    warm: true,
  },
  {
    d: "M 1322 420 C 1400 420, 1470 442, 1532 482",
    dur: 26,
    delay: 8,
    width: 1.2,
    warm: true,
  },
];

/** Sparkle positions, sitting on highlights the artwork already has — along
 *  the strands, through the fragment field and around the figure's hair. */
const SPARKS: [number, number, number][] = [
  // x, y, base radius
  [560, 332, 2.4],
  [702, 300, 1.8],
  [880, 262, 2.8],
  [1050, 268, 2.0],
  [1180, 302, 2.4],
  [520, 470, 2.0],
  [690, 432, 3.0],
  [872, 420, 1.9],
  [1032, 442, 2.5],
  [452, 600, 2.2],
  [640, 562, 1.8],
  [822, 546, 2.9],
  [980, 530, 2.1],
  [1120, 520, 2.5],
  [702, 690, 2.0],
  [900, 660, 2.6],
  [1080, 640, 1.9],
  [1332, 300, 2.3],
  [1422, 270, 1.9],
  [1480, 362, 2.6],
  [1400, 452, 2.0],
  [612, 214, 1.7],
  [980, 186, 2.2],
];

/** Slow-rising motes, seeded across the dark half and the mid transition.
 *  Kept out of the far-right sky, where the artwork is already bright and
 *  an added highlight would simply disappear. */
const MOTES: [number, number, number][] = [
  [318, 690, 2.6],
  [402, 782, 1.9],
  [246, 560, 2.2],
  [498, 838, 2.4],
  [586, 700, 1.8],
  [672, 806, 2.7],
  [370, 452, 2.0],
  [754, 690, 2.1],
  [842, 792, 2.5],
  [930, 706, 1.9],
  [1046, 800, 2.3],
  [268, 386, 1.7],
  [614, 546, 2.0],
  [1134, 742, 2.2],
];

/** Deterministic jitter so timings differ per spark but never reshuffle. */
function jitter(i: number, seed: number) {
  return ((Math.sin(i * 37.13 + seed) * 43758.5453) % 1 + 1) % 1;
}

export function HeroLightFlow({ reduced }: { reduced: boolean }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1672 941"
      preserveAspectRatio="xMidYMid slice"
      style={{ mixBlendMode: "screen" }}
      aria-hidden
    >
      <defs>
        {/* Head-and-tail gradient: each travelling segment is bright at its
            leading edge and fades behind, so it reads as light moving along
            the strand rather than a dash sliding down a line. */}
        <linearGradient id="flowWarm" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffe9c6" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#fffaf0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="flowCool" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c9a6ff" stopOpacity="0" />
          <stop offset="50%" stopColor="#e2ccff" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <radialGradient id="sparkWarm">
          <stop offset="0%" stopColor="#fff6e2" stopOpacity="1" />
          <stop offset="45%" stopColor="#ffd9a0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffb870" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sparkCool">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="45%" stopColor="#dcc4ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a97fff" stopOpacity="0" />
        </radialGradient>

        {/* Sits over the sun already in the artwork, so it reads as that
            sun getting brighter rather than as a new light source. */}
        <radialGradient id="sunBloom">
          <stop offset="0%" stopColor="#fff8e8" stopOpacity="0.9" />
          <stop offset="34%" stopColor="#ffdca6" stopOpacity="0.42" />
          <stop offset="70%" stopColor="#f0a862" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#e08a4a" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="skyHaze">
          <stop offset="0%" stopColor="#ffe6c0" stopOpacity="0.65" />
          <stop offset="60%" stopColor="#f5c79a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#e8b088" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="moteWarm">
          <stop offset="0%" stopColor="#fff2d8" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffc98a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moteCool">
          <stop offset="0%" stopColor="#f0e6ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#b795ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Drawn first so everything else sits in front of it. */}
      <ellipse
        cx={1352}
        cy={208}
        rx={392}
        ry={136}
        fill="url(#skyHaze)"
        className={reduced ? undefined : "hero-haze"}
        style={{ opacity: reduced ? 0.16 : undefined }}
      />

      {/* Positioned on the artwork's own sun, low on the right. */}
      <circle
        cx={1486}
        cy={646}
        r={215}
        fill="url(#sunBloom)"
        className={reduced ? undefined : "hero-bloom"}
        style={{ opacity: reduced ? 0.32 : undefined }}
      />

      {/* Motes lifting through the dark half — the counterpart to the sun,
          and the reason the left side never feels inert. */}
      <g>
        {MOTES.map(([x, y, r], i) => {
          const warm = x > 900;
          return (
            <circle
              key={`m${i}`}
              cx={x}
              cy={y}
              r={r}
              fill={warm ? "url(#moteWarm)" : "url(#moteCool)"}
              className={reduced ? undefined : "hero-mote"}
              style={{
                animationDuration: `${17 + jitter(i, 7) * 12}s`,
                animationDelay: `${jitter(i, 8) * 18}s`,
                opacity: reduced ? 0.22 : undefined,
              }}
            />
          );
        })}
      </g>

      {/* Travelling light along the strands. */}
      <g>
        {FLOWS.map((f, i) => (
          <path
            key={i}
            d={f.d}
            fill="none"
            stroke={f.warm ? "url(#flowWarm)" : "url(#flowCool)"}
            strokeWidth={f.width}
            strokeLinecap="round"
            className={reduced ? undefined : "hero-flow"}
            style={{
              // A short lit segment chasing a long gap: one pulse per path.
              strokeDasharray: "64 1500",
              strokeDashoffset: 1564,
              animationDuration: `${f.dur}s`,
              animationDelay: `${f.delay}s`,
              opacity: reduced ? 0.35 : undefined,
            }}
          />
        ))}
      </g>

      {/* Sparkles sitting on the artwork's existing highlights. */}
      <g>
        {SPARKS.map(([x, y, r], i) => {
          const warm = x > 1150 || jitter(i, 3) > 0.62;
          const dur = 4 + jitter(i, 1) * 5;
          const delay = jitter(i, 2) * 7;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r * 2.6}
              fill={warm ? "url(#sparkWarm)" : "url(#sparkCool)"}
              className={reduced ? undefined : "hero-spark"}
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
                opacity: reduced ? 0.4 : undefined,
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
