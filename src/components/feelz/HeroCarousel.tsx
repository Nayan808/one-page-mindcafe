"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

// The /feelz hero (Hero.tsx): the client's four "Revised Hero" banners
// (public/feelz-creative/hero-revised, 16:9). Each banner already carries
// its own headline and copy right across the image, so the Shop Now / Find
// at Zostel buttons and the slide dots sit in a row underneath rather than
// on top of it. Clicking a banner jumps to the product grid — or, for the
// four-pack "10-Day Routine" banner, to the bundle card.
// Embla swallows the click that ends a swipe, so dragging never navigates.
const HERO_SLIDES = [
  { key: "ayurvedic", src: "/feelz-creative/hero-revised/1.webp", target: "shop", label: "India's first supplement with Ayurvedic and active food ingredients — shop Feelz" },
  { key: "tiny-strip", src: "/feelz-creative/hero-revised/2.webp", target: "shop", label: "Your supplement, in a tiny strip — shop Feelz" },
  { key: "routine", src: "/feelz-creative/hero-revised/3.webp", target: "bundle", label: "Your 10-day Feelz routine — shop the bundle" },
  { key: "big-day", src: "/feelz-creative/hero-revised/4.webp", target: "shop", label: "Big day? Tiny strip — shop Feelz" },
] as const;

export function HeroCarousel({
  onShopClick,
  onZostelClick,
  onBundleClick,
  showButtons = true,
}: {
  onShopClick: () => void;
  onZostelClick: () => void;
  /** When set (on /feelz itself), the bundle slide smooth-scrolls to the
   * bundle card in place instead of following its /feelz#bundle link. */
  onBundleClick?: () => void;
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
    <div className="bg-feelz-cream">
      <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {HERO_SLIDES.map((slide) => (
            <div key={slide.key} className="relative aspect-[5225/2941] min-w-0 flex-[0_0_100%] overflow-hidden">
              {/* Frame ratio matches the banners' native 16:9 exactly, so
                  object-cover never trims their edge-to-edge copy. */}
              <Link
                href={slide.target === "bundle" ? "/feelz#bundle" : "/feelz#mood-picks"}
                aria-label={slide.label}
                onClick={(event) => {
                  event.preventDefault();
                  if (slide.target === "bundle" && onBundleClick) onBundleClick();
                  else onShopClick();
                }}
                className="absolute inset-0 block"
              >
                <Image src={slide.src} alt="" fill priority={slide.key === "ayurvedic"} className="object-cover" sizes="100vw" />
              </Link>

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

      </div>

      {/* Dots and buttons sit below the banner on every screen size. */}
      <div className="flex items-center justify-center gap-1.5 pt-3">
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

      {showButtons && (
        <div className="mx-auto flex max-w-md gap-2.5 px-4 pb-1 pt-3 sm:pt-4">
          <button
            type="button"
            onClick={onShopClick}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-feelz-berry whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wider text-feelz-cream shadow-sm"
          >
            Shop Now
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onZostelClick}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-feelz-ink/15 bg-feelz-paper whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wider text-feelz-ink shadow-sm"
          >
            <Image src="/press/zostel-star.png" alt="" width={20} height={19} className="h-4 w-4 object-contain sm:h-[18px] sm:w-[18px]" />
            Find at Zostel
          </button>
        </div>
      )}
    </div>
  );
}
