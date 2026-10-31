import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "mindcafe Assessments | Coming Soon",
  description:
    "Our mental health self-assessments are coming soon. Take a moment to check in with yourself and think about what support may help.",
};

const INSTAGRAM_URL = "https://www.instagram.com/feelzbymindcafe/";

// Subtle paper grain for the background, generated in the browser rather
// than shipped as an image.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.55 0 0 0 0 0.35 0 0 0 0 0.42 0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// Thin hand-drawn-style curves sweeping in from each corner. Each corner is
// its own SVG pinned to that corner, so the curves keep their shape at any
// screen width instead of stretching with the section.
function CornerCurves() {
  const stroke = { stroke: "#a8567c", strokeOpacity: 0.42, strokeWidth: 1.2, fill: "none", vectorEffect: "non-scaling-stroke" as const };
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <svg viewBox="0 0 300 470" className="absolute left-0 top-0 w-[max(6rem,18vw)]">
        <path d="M288 0 C300 125 250 262 122 342 C72 372 28 404 0 438" style={stroke} />
        <path d="M300 0 C314 142 262 282 132 362 C82 394 36 426 0 470" style={{ ...stroke, strokeOpacity: 0.28 }} />
      </svg>
      <svg viewBox="0 0 260 500" className="absolute right-0 top-0 w-[max(5.5rem,16vw)]">
        <path d="M6 0 C-8 112 22 242 132 332 C180 370 224 384 260 390" style={stroke} />
        <path d="M24 0 C16 140 60 270 170 380 C206 416 236 460 260 500" style={{ ...stroke, strokeOpacity: 0.28 }} />
      </svg>
      <svg viewBox="0 0 280 400" className="absolute bottom-0 left-0 w-[max(5.5rem,17vw)]">
        <path d="M0 8 C112 70 202 182 230 400" style={stroke} />
        <path d="M0 98 C122 130 232 232 272 400" style={{ ...stroke, strokeOpacity: 0.3 }} />
      </svg>
      <svg viewBox="0 0 290 270" className="absolute bottom-0 right-0 w-[max(5.5rem,18vw)]">
        <path d="M290 0 C180 62 82 152 0 270" style={stroke} />
      </svg>
    </div>
  );
}

// "Mindcafe Assessments — coming soon", built in code (no flattened artwork):
// warm paper background, a soft blush oval behind the copy, and thin curves
// in the corners. Fills the screen under the floating header on desktop.
export default function AssessmentsPage() {
  return (
    <section className="relative -mt-16 flex min-h-[calc(100svh-var(--announce-h,0px))] items-center justify-center overflow-hidden bg-[#fcf6f5] px-6 pb-20 pt-36 sm:-mt-[76px] sm:pt-40">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-multiply"
        style={{
          backgroundImage: GRAIN,
          maskImage: "radial-gradient(ellipse 45% 40% at 0% 0%, black, transparent), radial-gradient(ellipse 40% 40% at 100% 0%, black, transparent)",
        }}
        aria-hidden
      />

      {/* The blush oval behind the copy. */}
      <div
        className="pointer-events-none absolute left-1/2 top-[56%] h-[78%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,#f3e1e7_0%,#f6e8ec_55%,rgba(246,232,236,0)_100%)] sm:w-[80vw]"
        aria-hidden
      />

      <CornerCurves />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-3xl font-bold tracking-tight text-[#a8567c] sm:text-4xl lg:text-[2.75rem]">mindcafe Assessments</p>
        <p className="mt-3 text-xs font-bold tracking-[0.5em] text-[#1d3458] sm:text-sm lg:text-base">COMING SOON...</p>

        <h1 className="mt-12 text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1d3458] sm:text-6xl lg:mt-16 lg:text-7xl">
          Not sure how you&rsquo;ve
          <br className="hidden sm:block" /> been feeling <em className="font-semibold text-[#a8567c]">lately?</em>
        </h1>

        <p className="mx-auto mt-7 max-w-[34rem] lg:max-w-[38rem] text-base leading-relaxed text-[#1d3458]/85 sm:text-lg lg:mt-9 lg:text-[1.35rem]">
          Our mental health self-assessments are coming soon. Take a moment to check in with yourself and think about
          what support may help.
        </p>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-10 inline-flex items-center gap-4 rounded-full bg-gradient-to-b from-[#ad5f83] to-[#9c4d72] px-9 py-4 text-base font-medium text-white shadow-[0_18px_36px_-16px_rgba(143,66,102,0.7)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-14px_rgba(143,66,102,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a8567c] lg:mt-14 lg:px-16 lg:py-5 lg:text-[1.35rem]"
        >
          Follow us on Instagram
          <ArrowRight className="h-5 w-5" aria-hidden />
        </a>

        <p className="mx-auto mt-10 max-w-md text-sm font-semibold text-[#6b7891] sm:max-w-none sm:text-base lg:mt-12">
          Understand what&rsquo;s been on your mind, and FIND A PLACE TO START
        </p>
      </div>
    </section>
  );
}
