import type { SVGProps } from "react";

// Hand-drawn doodle icons — loose, slightly imperfect single-stroke marks in
// the same linework style as the squiggle arrows in AncientWisdomSection,
// used instead of crisp geometric lucide icons so the approach/outcome
// cards in CalmerYouSection don't read as generic stock iconography. Each
// carries a tiny built-in rotation so it sits slightly off-true, like it
// was actually sketched by hand rather than placed on a grid.

export function SketchLeaf(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <g transform="rotate(-6 24 24)">
        <path d="M24 6C13 10 7 21 9 32c1 6 6 9 12 8 10-2 15-11 15-21 1-7-2-11-12-13Z" />
        <path d="M13 35C18 27 23 17 31 9" />
      </g>
    </svg>
  );
}

export function SketchFlask(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <g transform="rotate(4 24 24)">
        <path d="M19 6h10" />
        <path d="M21 6v10L11 36c-1.5 3 1 7 5 7h16c4 0 6.5-4 5-7L27 16V6" />
        <circle cx="19.5" cy="30" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="25" cy="34" r="1" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function SketchHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <g transform="rotate(-3 24 24)">
        <path d="M24 39C11 30 6 21 11 14c4-5 11-4 13 2 2-6 9-7 13-2 5 7 0 16-13 25Z" />
      </g>
    </svg>
  );
}

export function SketchSun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" {...props}>
      <g transform="rotate(2 24 24)">
        <circle cx="24" cy="24" r="8.5" />
        <path d="M24 5v5.5M24 37.5V43M7 24h5.5M35.5 24H41M11.5 11.5l4 4M32.5 32.5l4 4M36.5 11.5l-4 4M15.5 32.5l-4 4" />
      </g>
    </svg>
  );
}

export function SketchTarget(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <g transform="rotate(-2 24 24)">
        <path d="M24 5c10.5 0 19 8.5 19 19S34.5 43 24 43 5 34.5 5 24 13.5 5 24 5Z" />
        <path d="M24 13.5c5.8 0 10.5 4.7 10.5 10.5S29.8 34.5 24 34.5 13.5 29.8 13.5 24 18.2 13.5 24 13.5Z" />
        <circle cx="24" cy="24" r="2.2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function SketchSparkle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" stroke="none" {...props}>
      <g transform="rotate(6 24 24)">
        <path d="M23 5c1.3 10 3.2 12.4 13 13.5-9.8 1.1-11.7 3.5-13 13.5-1.3-10-3.2-12.4-13-13.5 9.8-1.1 11.7-3.5 13-13.5Z" />
        <path d="M38 29c.6 3.6 1.2 4.2 4.6 4.8-3.4.6-4 1.2-4.6 4.8-.6-3.6-1.2-4.2-4.6-4.8 3.4-.6 4-1.2 4.6-4.8Z" />
      </g>
    </svg>
  );
}
