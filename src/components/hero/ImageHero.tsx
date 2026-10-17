import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

// Page hero built from the client's finished hero artwork (public/heroes/*,
// from "MINDCAFE - HERO SECTIONS/"). On desktop the artwork is shown exactly
// as designed — full width at its native 1671×941 ratio, headline and copy
// baked in — with the page's real buttons placed in the empty space under
// that copy (`cta` = their position as % of the image). The image's text is
// mirrored in a real <h1>/<p> for screen readers and search.
//
// Below lg the baked-in type would be too small to read, so phones and
// tablets get the photo cropped to its subject (`mobileFocus`) with the
// same words set as live text underneath.
//
// Motion (.imghero-* in globals.css): the artwork settles from a slight
// zoom and fades in; the buttons rise in after it. Reduced-motion: none.
export function ImageHero({
  src,
  alt,
  eyebrow,
  title,
  accent,
  body,
  cta,
  mobileFocus = "50%",
  trimTop = 0.85,
  children,
}: {
  src: string;
  alt: string;
  eyebrow: string;
  /** Headline, with `accent` set in the brand's italic serif after it. */
  title: string;
  accent: string;
  body: string;
  /** Button placement on the desktop artwork, in % of its width/height. */
  cta: { left: number; top: number };
  /** Share (0–1) of any height trim taken from the top of the artwork. */
  trimTop?: number;
  /** Vertical focus of the phone crop (the crop is always the photo side). */
  mobileFocus?: string;
  /** The page's buttons. */
  children?: ReactNode;
}) {
  return (
    <section className="relative -mt-16 overflow-hidden bg-[#fbf4ef] sm:-mt-[76px]">
      {/* Desktop: the artwork at full width, sized to fit the screen on
          load. The stage is the screen height left under the announcement
          bar (--announce-h, set by AnnouncementBar), but never taller than
          the artwork itself. When the screen is shorter than the artwork,
          the excess is trimmed — `trimTop` of it from the top (mostly empty
          wall), the rest from the bottom — so headline, copy and buttons
          stay in view. The buttons live inside the artwork box, so they move
          with it. (cq units = the stage's own size.) */}
      <div
        className="relative hidden w-full overflow-hidden lg:block"
        style={{
          containerType: "size",
          height: "min(calc(100svh - var(--announce-h, 0px)), calc(100vw * 941 / 1671))",
        }}
      >
        <div
          className="absolute inset-x-0 aspect-[1671/941]"
          style={{ top: `calc((100cqh - 100cqw * 941 / 1671) * ${trimTop})` }}
        >
          <Image src={src} alt={alt} fill priority sizes="100vw" quality={90} className="imghero-art object-cover" />
          {children && (
            <div
              className="imghero-cta absolute flex flex-wrap items-center gap-3"
              style={{ left: `${cta.left}%`, top: `${cta.top}%` } as CSSProperties}
            >
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Phones / tablets: subject-cropped photo + live text. */}
      <div className="lg:hidden">
        {/* Tall crop anchored to the right edge: the artwork's copy occupies
            its left ~45%, so this shows only the photo side, never a sliver
            of baked-in headline next to the live text. */}
        <div className="relative aspect-[5/6] w-full sm:aspect-square">
          <Image src={src} alt={alt} fill priority sizes="100vw" className="imghero-art object-cover" style={{ objectPosition: `100% ${mobileFocus}` }} />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#fbf4ef] to-transparent" aria-hidden />
        </div>
        <div className="px-5 pb-12 pt-2 sm:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#3d5a8a]">{eyebrow}</p>
          <h1 className="font-serif-display mt-3 text-4xl leading-[1.1] text-feelz-ink sm:text-5xl">
            {title} <span className="font-tagline italic text-feelz-berry">{accent}</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink/70">{body}</p>
          {children && <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>}
        </div>
      </div>

      {/* The artwork's words, for screen readers / search on desktop. */}
      {/* Only rendered at lg, where the live-text block above is hidden —
          so there's always exactly one <h1>. */}
      <div className="sr-only hidden lg:block">
        <p>{eyebrow}</p>
        <h1>
          {title} {accent}
        </h1>
        <p>{body}</p>
      </div>
    </section>
  );
}
