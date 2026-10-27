"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

// "Not sure how FEELZ works?" — a quiet invitation to the how-it-works
// section, in the site's cream / berry / serif language. Either side: a
// slowly morphing colour blob with a fine orbiting ring, a real step photo
// in an arch frame (same shape as HowToUseSection's cards), a floating
// strip, and a handwritten note whose arrow draws itself toward the photo.
//
// Motion (.notsure-* in globals.css) — once in view: blobs bloom, photos
// rise and settle into their tilt, arrows draw, notes fade in, and the
// headline's lines rise from behind a mask before the button arrives.
// Ambient afterwards: blobs morph, rings turn, photos and strips drift,
// and a soft sheen glides across the button. Reduced-motion shows the
// finished state.

function useInViewOnce<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function Side({
  side,
  image,
  note,
  blob,
  ring,
}: {
  side: "left" | "right";
  image: string;
  note: string;
  blob: string;
  ring: string;
}) {
  const isLeft = side === "left";
  return (
    <div className="relative hidden aspect-square items-center justify-center sm:flex" style={{ "--side": isLeft ? 0 : 1 } as CSSProperties}>
      {/* Morphing blob + orbiting dashed ring */}
      <div className={`notsure-blob absolute h-[82%] w-[82%] ${blob}`} aria-hidden />
      <div className={`notsure-ring absolute h-[94%] w-[94%] rounded-full border border-dashed ${ring}`} aria-hidden />

      {/* Floating strip */}
      <span
        className={`notsure-strip absolute h-12 w-9 rounded-md border border-white/70 bg-[#f6c66a]/70 shadow-[0_10px_20px_-10px_rgba(16,35,63,0.4)] ${
          isLeft ? "right-[14%] top-[16%] [--r:16deg]" : "left-[14%] bottom-[18%] [--r:-14deg]"
        }`}
        aria-hidden
      />

      {/* Photo in an arch frame */}
      <div className={`notsure-photo relative ${isLeft ? "[--tilt:-5deg]" : "[--tilt:5deg]"}`}>
        <div className="notsure-drift relative h-48 w-40 overflow-hidden rounded-b-[22px] rounded-t-[999px] border-[5px] border-white shadow-[0_24px_48px_-20px_rgba(16,35,63,0.45)] lg:h-56 lg:w-44">
          <Image src={image} alt="" fill sizes="176px" className="object-cover" />
        </div>
      </div>

      {/* Handwritten note + hand-drawn arrow toward the photo */}
      <div className={`absolute ${isLeft ? "bottom-[2%] left-[2%]" : "right-[0%] top-[2%] text-right"}`}>
        <p className={`notsure-note font-tagline max-w-[9rem] text-base italic leading-snug text-feelz-ink/70 ${isLeft ? "-rotate-3" : "rotate-2"}`}>
          {note}
        </p>
        <svg
          viewBox="0 0 80 60"
          className={`absolute h-12 w-16 ${isLeft ? "-top-12 left-[55%]" : "-bottom-12 right-[55%] rotate-180"}`}
          fill="none"
          aria-hidden
        >
          <path
            d="M6 54 C 14 30, 34 14, 66 10"
            pathLength={1}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="notsure-arrow text-feelz-berry/60"
          />
          <path d="M56 4 L 68 10 L 58 18" pathLength={1} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="notsure-arrow notsure-arrow-head text-feelz-berry/60" />
        </svg>
      </div>
    </div>
  );
}

export function NotSureHowSection() {
  const [ref, inView] = useInViewOnce<HTMLDivElement>(0.3);

  return (
    <section className="mx-auto max-w-[96rem] px-4 pb-6 pt-16 sm:px-6 sm:pb-8">
      <div
        ref={ref}
        data-inview={inView ? "" : undefined}
        className="notsure relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[2.5rem] border border-feelz-ink/10 bg-feelz-paper px-6 py-14 sm:grid-cols-[1fr_1.4fr_1fr] sm:gap-4 sm:px-10 sm:py-16"
      >
        {/* Soft warm light at either side + fine grain */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,rgba(219,139,29,0.10),transparent_45%),radial-gradient(ellipse_at_100%_50%,rgba(143,66,102,0.10),transparent_45%)]" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />

        <Side side="left" image="/feelz-creative/steps/place-v4.webp" note="Tiny strip. Big difference." blob="bg-feelz-orange/20" ring="border-feelz-orange/35" />

        <div className="relative text-center">
          <p className="notsure-fade font-tagline text-lg italic text-feelz-ink/50 sm:text-xl" style={{ "--d": "100ms" } as CSSProperties}>
            Still have questions?
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold leading-[1.1] text-feelz-ink sm:text-5xl">
            <span className="notsure-mask">
              <span className="notsure-rise" style={{ "--d": "250ms" } as CSSProperties}>
                Not sure how
              </span>
            </span>{" "}
            <span className="notsure-mask">
              <span className="notsure-rise" style={{ "--d": "400ms" } as CSSProperties}>
                <span className="font-tagline italic font-normal text-feelz-berry">FEELZ</span> works?
              </span>
            </span>
          </h2>
          <p className="notsure-fade mx-auto mt-4 max-w-sm text-base leading-relaxed text-feelz-ink/60 sm:text-lg" style={{ "--d": "650ms" } as CSSProperties}>
            See how a tiny strip can make a big difference — in four simple steps.
          </p>

          <div className="notsure-fade mt-8" style={{ "--d": "850ms" } as CSSProperties}>
            <button
              type="button"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="notsure-cta group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-feelz-berry py-3.5 pl-7 pr-3 text-base font-semibold text-feelz-cream shadow-[0_18px_36px_-16px_rgba(143,66,102,0.7)] transition hover:shadow-[0_22px_44px_-16px_rgba(143,66,102,0.8)]"
            >
              <span className="notsure-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" aria-hidden />
              <span className="relative">Show me how it works</span>
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-feelz-cream text-feelz-berry transition-transform duration-500 group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </button>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-feelz-ink/40">No water · No waiting · Four moods</p>
          </div>
        </div>

        <Side side="right" image="/feelz-creative/steps/open-v4.webp" note="Same you, just a little brighter." blob="bg-feelz-berry/15" ring="border-feelz-berry/30" />
      </div>
    </section>
  );
}
