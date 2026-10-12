"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";

// "A thoughtful journey" — built to the client's reference creative: a
// sage, sun-washed wall with soft leaf shadows, torn-paper accents, and a
// single copper wire threading five objects on stone (mortar → botanicals
// → formulation flask → dissolving strip → the moment), each with a small
// editorial caption floating above it.
//
// The five objects are the client's own transparent cutouts
// (public/feelz-creative/journey/*.webp, trimmed to their content), placed
// on a fixed 2.5:1 stage in percentages so the composition holds at any
// desktop width. Phones get the same objects as a simple stacked list.
//
// Motion (.journey-* in globals.css): once the stage scrolls into view
// the wall settles from a slight zoom, the copper wire draws itself left
// → right, and each object rises into place in step with it, its caption
// following. After that only quiet ambient motion remains — leaf shadows
// sway and every object floats a few pixels on one slow, phase-shifted
// rhythm. Reduced-motion shows the finished composition.

type Item = {
  key: string;
  src: string;
  width: number;
  height: number;
  /** Stage placement — left/width as % of stage width, bottom as % of height. */
  left?: string;
  right?: string;
  bottom: string;
  w: string;
  /** Objects sit at equal distances: each one's box ends 0.6% before the
   * next begins (widths 19/22.5/20/14.5/24%).
   * Float amplitude — every object drifts on the same slow cycle,
   * phase-shifted left → right so the row moves as one gentle wave. */
  amp: string;
};

const ITEMS: Item[] = [
  { key: "ayurveda", src: "/feelz-creative/journey/ayurveda.webp", width: 887, height: 782, left: "0.5%", bottom: "13.5%", w: "19%", amp: "6px" },
  { key: "botanicals", src: "/feelz-creative/journey/botanicals.webp", width: 1000, height: 613, left: "20.1%", bottom: "13%", w: "22.5%", amp: "6px" },
  { key: "formulation", src: "/feelz-creative/journey/formulation.webp", width: 1000, height: 552, left: "43.2%", bottom: "13.5%", w: "20%", amp: "6px" },
  { key: "dissolve", src: "/feelz-creative/journey/dissolve.webp", width: 1000, height: 696, left: "63.8%", bottom: "30%", w: "14.5%", amp: "10px" },
  { key: "moment", src: "/feelz-creative/journey/moment.webp", width: 1000, height: 1013, left: "78.9%", bottom: "1%", w: "24%", amp: "4px" },
];

const STEPS = [
  { n: "01", title: "Ayurveda", body: ["Timeless wisdom", "for modern lives."], color: "text-feelz-berry", left: "5.5%", top: "25%" },
  { n: "02", title: "Botanicals", body: ["Potent plants.", "Real benefits."], color: "text-[#3f6b2a]", left: "26.5%", top: "24%" },
  { n: "03", title: "Formulation", body: ["Science meets", "nature's best."], color: "text-[#b9652d]", left: "48%", top: "28.5%" },
  { n: "04", title: "Dissolves in seconds", body: ["Place on your tongue,", "and Feelz"], color: "text-feelz-berry", left: "64%", top: "24.5%" },
];

// Phone list: the four captioned steps plus the closing moment.
const MOBILE_STEPS = [
  ...STEPS.map((step, index) => ({ ...step, item: ITEMS[index] })),
  { n: "05", title: "Your moment", body: ["More goodness", "in your everyday."], color: "text-feelz-berry", left: "", top: "", item: ITEMS[4] },
];

// Torn-paper pieces, in the stage's 2000×800 space. A deterministic
// jagged outline (no randomness, so server and client render the same).
function tornPolygon(x: number, y: number, w: number, h: number, seed: number) {
  const pts: string[] = [];
  // Rounded to 2 decimals so server (Node) and browser produce identical
  // markup — Math.sin can differ in its last digits between engines.
  const jag = (i: number) => Math.round((((Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453) % 1 + 1) % 1) * 100) / 100;
  const steps = 9;
  for (let i = 0; i <= steps; i++) pts.push(`${x + (w * i) / steps},${y + jag(i) * 14}`);
  for (let i = 1; i <= steps; i++) pts.push(`${x + w - jag(i + 20) * 14},${y + (h * i) / steps}`);
  for (let i = steps - 1; i >= 0; i--) pts.push(`${x + (w * i) / steps},${y + h - jag(i + 40) * 14}`);
  for (let i = steps - 1; i >= 1; i--) pts.push(`${x + jag(i + 60) * 14},${y + (h * i) / steps}`);
  return pts.join(" ");
}

const PAPERS = [
  { x: 30, y: 420, w: 120, h: 230, rotate: -8, fill: "#e8b4a0", seed: 1 },
  { x: 300, y: 380, w: 130, h: 190, rotate: 7, fill: "#f6f1e8", seed: 2 },
  { x: 690, y: 440, w: 110, h: 150, rotate: -5, fill: "#f6f1e8", seed: 3 },
  { x: 1290, y: 340, w: 170, h: 230, rotate: -4, fill: "#e8b4a0", seed: 4 },
  { x: 1420, y: 300, w: 120, h: 190, rotate: 8, fill: "#f6f1e8", seed: 5 },
  { x: 1650, y: 380, w: 90, h: 190, rotate: -6, fill: "#e8b4a0", seed: 6 },
  { x: 1720, y: 250, w: 220, h: 260, rotate: 4, fill: "#f6f1e8", seed: 7 },
];

// The copper wire runs through the middle of every object — mortar,
// botanicals, flask, strip, ending inside the woman — rising and falling
// gently in the gaps between them. It's drawn UNDER the objects, so it
// disappears behind each one and reads as threading straight through.
// If ITEMS move, recompute these centres (left + w/2, bottom - h/2 in the
// 2000×800 stage).
const WIRE_POINTS: [number, number][] = [
  // in from the left edge, through the middle of each object (hidden
  // behind it), rising/falling gently in each gap between them
  [-60, 489], [200, 524], [396, 486], [627, 558], [858, 610], [1064, 582], [1270, 466], [1421, 459], [1592, 504], [1758, 469],
];
function smoothPath(points: [number, number][]) {
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[Math.max(0, i - 1)];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const [x3, y3] = points[Math.min(points.length - 1, i + 2)];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x2} ${y2}`;
  }
  return d;
}
const WIRE = smoothPath(WIRE_POINTS);

// The wire draws over WIRE_MS after WIRE_DELAY_MS; each object (and its
// caption) rises the moment the wire reaches it — `at` is that point as a
// fraction of the draw, so object and line stay in step.
const WIRE_DELAY_MS = 400;
const WIRE_MS = 3200;
const ARRIVALS = [0.143, 0.378, 0.618, 0.815, 1.000];
const arrivalMs = (index: number) => Math.round(WIRE_DELAY_MS + ARRIVALS[index] * WIRE_MS - 250);

export function AncientWisdomSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // A soft glowing bead travels the wire as it draws (SMIL, started here
  // so it begins with the CSS draw rather than on page load).
  const beadRef = useRef<SVGGElement>(null);
  useEffect(() => {
    if (!inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => {
      beadRef.current?.querySelectorAll("animate, animateMotion").forEach((el) => (el as SVGAnimationElement).beginElement());
    }, WIRE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [inView]);

  return (
    <section ref={stageRef} data-inview={inView ? "" : undefined} className="journey relative isolate overflow-hidden bg-[#e2dfca]">
      {/* The client's own background plate — a sunlit, textured sage wall
          with leaf shadows and a stone floor (public/feelz-creative/
          journey/wall.webp, 1983×793). It's the same 2.5:1 as the stage, so
          object-cover fills it edge to edge without cropping. */}
      <div className="journey-wall pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <Image src="/feelz-creative/journey/wall.webp" alt="" fill sizes="100vw" quality={90} className="object-cover object-center" />
      </div>


      {/* --- Desktop stage (2.5 : 1) --- */}
      <div className="relative hidden aspect-[5/2] w-full lg:block">
        {/* Heading */}
        <div className="absolute inset-x-0 top-[3%] text-center">
          <h2 className="font-serif-display text-[2.9vw] font-medium leading-[1.15] text-[#2b2724]">
            <span className="journey-mask"><span className="journey-rise" style={{ "--journey-step": "0ms" } as CSSProperties}>A thoughtful journey.</span></span>
          </h2>
          <p className="font-tagline text-[2.45vw] italic leading-[1.25] text-feelz-berry">
            <span className="journey-mask"><span className="journey-rise" style={{ "--journey-step": "160ms" } as CSSProperties}>For your everyday moments.</span></span>
          </p>
        </div>

        {/* Torn paper + copper wire */}
        <svg viewBox="0 0 2000 800" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <filter id="journey-paper-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#5a4a3a" floodOpacity="0.18" />
            </filter>
          </defs>
          <g className="journey-papers" filter="url(#journey-paper-shadow)">
            {PAPERS.map((paper) => (
              <polygon
                key={paper.seed}
                points={tornPolygon(paper.x, paper.y, paper.w, paper.h, paper.seed)}
                fill={paper.fill}
                opacity={paper.fill === "#e8b4a0" ? 0.75 : 0.9}
                transform={`rotate(${paper.rotate} ${paper.x + paper.w / 2} ${paper.y + paper.h / 2})`}
              />
            ))}
          </g>
          <defs>
            <filter id="journey-bead-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <path id="journey-wire-path" d={WIRE} pathLength={1} fill="none" stroke="#b5724a" strokeWidth="2.6" strokeLinecap="round" className="journey-wire" />
          {/* A faint highlight that keeps gliding along the copper. */}
          <path d={WIRE} pathLength={1} fill="none" stroke="#f7d9b8" strokeWidth="2.6" strokeLinecap="round" className="journey-shimmer" />
          <g ref={beadRef} opacity="0">
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.9;1" dur={`${WIRE_MS}ms`} begin="indefinite" fill="freeze" />
            <circle r="9" fill="#ffd9a8" filter="url(#journey-bead-glow)" />
            <circle r="3.6" fill="#fff4e3" />
            <animateMotion
              dur={`${WIRE_MS}ms`}
              begin="indefinite"
              fill="freeze"
              calcMode="spline"
              keyPoints="0;1"
              keyTimes="0;1"
              keySplines="0.45 0 0.2 1"
            >
              <mpath href="#journey-wire-path" />
            </animateMotion>
          </g>
        </svg>

        {/* Objects */}
        {ITEMS.map((item, index) => (
          <div
            key={item.key}
            className="journey-item absolute"
            style={{ left: item.left, right: item.right, bottom: item.bottom, width: item.w, "--journey-step": `${arrivalMs(index)}ms` } as CSSProperties}
          >
            <div className="journey-float" style={{ "--amp": item.amp, animationDelay: `${2600 + index * 700}ms` } as CSSProperties}>
              <Image
                src={item.src}
                alt=""
                width={item.width}
                height={item.height}
                sizes="30vw"
                className="h-auto w-full drop-shadow-[0_18px_22px_rgba(70,55,40,0.18)]"
              />
            </div>
          </div>
        ))}

        {/* Captions */}
        {STEPS.map((step, index) => (
          <div
            key={step.n}
            className="journey-cap absolute"
            style={{ left: step.left, top: step.top, "--journey-step": `${arrivalMs(index)}ms` } as CSSProperties}
          >
            <p className="flex items-center gap-[0.5vw] font-serif-display text-[0.9vw] font-semibold text-[#2b2724]">
              {step.n}
              <span className={`journey-hairline block h-px w-[1.8vw] origin-left bg-current opacity-60 ${step.color}`} aria-hidden />
            </p>
            <p className={`font-serif-display mt-[0.2vw] text-[1.7vw] leading-tight ${step.color}`}>
              <span className="journey-mask"><span className="journey-rise">{step.title}</span></span>
            </p>
            <p className="journey-body mt-[0.4vw] text-[0.98vw] leading-snug text-[#3a3530]">
              {step.body[0]}
              <br />
              {step.body[1]}
            </p>
          </div>
        ))}
      </div>

      {/* --- Phones / tablets --- */}
      <div className="relative mx-auto max-w-xl px-5 py-14 lg:hidden">
        <div className="text-center">
          <h2 className="font-serif-display text-4xl font-medium leading-tight text-[#2b2724]">A thoughtful journey.</h2>
          <p className="font-tagline mt-1 text-3xl italic text-feelz-berry">For your everyday moments.</p>
        </div>
        <ol className="mt-10 space-y-6">
          {MOBILE_STEPS.map((step, index) => (
            <li key={step.n} className="journey-caption flex items-center gap-5" style={{ "--i": index } as CSSProperties}>
              <div className="relative w-32 shrink-0 sm:w-40">
                <Image src={step.item.src} alt="" width={step.item.width} height={step.item.height} sizes="160px" className="h-auto w-full" />
              </div>
              <div>
                <p className="font-serif-display text-xs font-semibold text-[#2b2724]">{step.n}</p>
                <p className={`font-serif-display text-2xl leading-tight ${step.color}`}>{step.title}</p>
                <p className="mt-1 text-sm leading-snug text-[#3a3530]">
                  {step.body[0]} {step.body[1]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
