"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, ArrowRight, MapPin } from "lucide-react";
import { MOOD_GRID, MOOD_STYLES } from "@/lib/moodStyles";

// Shared by Hero.tsx (/feelz, full-bleed, scrolls within the same page) and
// HomeHero.tsx (homepage, inside a contained card, navigates to /feelz) —
// five full-bleed marketing creatives (bundle intro + one per mood, see
// public/feelz-creative). Every slide gets the same pair of real, visible
// buttons ("Shop Now" + "Find at Zostel") in the same fixed spot,
// independent of whatever each photo's own baked-in graphic happens to
// show — swapping a slide's `src` later needs no button changes. The
// homepage card opts out of the buttons (showButtons=false) since the
// whole carousel there is already a clickable-feeling preview that leads
// to /feelz via its own "Shop Feelz" CTA beside it — /feelz itself always
// shows them since that's where shopping actually happens.
const HERO_SLIDES = [
  { key: "bundle", src: "/feelz-creative/00-feelz-bundle-hero-v2.webp" },
  ...MOOD_GRID.map((m) => ({ key: m.key, src: MOOD_STYLES[m.key].heroSrc })),
];

export function HeroCarousel({
  onShopClick,
  onZostelClick,
  showButtons = true,
}: {
  onShopClick: () => void;
  onZostelClick: () => void;
  showButtons?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const reduced = !!prefersReduced;
  const autoplay = useRef(Autoplay({ delay: 4500, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, reduced ? [] : [autoplay.current]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative bg-feelz-cream">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {HERO_SLIDES.map((slide) => (
            <div key={slide.key} className="relative aspect-[1672/941] min-w-0 flex-[0_0_100%] overflow-hidden">
              {/* fill + object-cover rather than fixed width/height. All
                  five creatives now share the same native 1672×941 ratio
                  (replaced together as a matching set), so the container
                  ratio matches every slide exactly rather than favoring
                  one over the others. */}
              <Image src={slide.src} alt="" fill priority={slide.key === "bundle"} className="object-cover" sizes="100vw" />

              {/* Real, visible buttons — not invisible hit-zones sitting
                  silently on top of the photo's own "Shop Now" graphic.
                  Fixed position across every slide (rather than trying to
                  align to each image's own differently-placed baked-in
                  button) so they're consistent and robust regardless of how
                  object-cover crops or scales any given photo. */}
              {showButtons && (
                <div className="absolute bottom-[22%] left-[4%] flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onShopClick}
                    className="group inline-flex items-center gap-1.5 rounded-full bg-feelz-berry px-4 py-2.5 text-xs font-semibold uppercase tracking-label text-feelz-cream shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:px-5 sm:py-3 sm:text-sm"
                  >
                    Shop Now
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={onZostelClick}
                    className="inline-flex items-center gap-1.5 rounded-full border border-feelz-ink/15 bg-feelz-paper/95 px-4 py-2.5 text-xs font-semibold uppercase tracking-label text-feelz-ink shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl sm:px-5 sm:py-3 sm:text-sm"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    Find at Zostel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-feelz-ink/10 bg-feelz-paper/90 text-feelz-ink shadow-sm backdrop-blur transition hover:bg-feelz-paper sm:flex"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-feelz-ink/10 bg-feelz-paper/90 text-feelz-ink shadow-sm backdrop-blur transition hover:bg-feelz-paper sm:flex"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.key}
            type="button"
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Show slide ${index + 1}`}
            className={`h-1.5 rounded-full transition-all ${index === selectedIndex ? "w-6 bg-feelz-berry" : "w-1.5 bg-feelz-ink/20"}`}
          />
        ))}
      </div>
    </div>
  );
}
