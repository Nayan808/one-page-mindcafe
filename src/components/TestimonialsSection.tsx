"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { getRecentReviews, getReviewsSummary } from "@/lib/api";
import { MaskLine, RiseIn } from "@/components/motion/primitives";
import type { Review } from "@/types/domain";

function Stars({ rating, className = "text-amber-400" }: { rating: number; className?: string }) {
  return (
    <div className={`flex gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5" fill={i < Math.round(rating) ? "currentColor" : "none"} aria-hidden />
      ))}
    </div>
  );
}

// Each card takes the colour of the Feelz mood its review mentions (same
// pack colours as the homepage product cards); anything else — e.g. a
// counselling review — gets the soft mauve brand tint. Literal class
// strings so Tailwind generates them.
const PRODUCT_TONES = {
  Focus: { card: "border-feelz-navy/20 bg-feelz-navy/[0.06]", chip: "bg-feelz-navy/[0.12] text-feelz-navy", name: "text-feelz-navy" },
  Joy: { card: "border-feelz-berry/20 bg-feelz-berry/[0.07]", chip: "bg-feelz-berry/[0.12] text-feelz-berry", name: "text-feelz-berry" },
  Extrovert: { card: "border-feelz-orange/25 bg-feelz-orange/[0.08]", chip: "bg-feelz-orange/[0.16] text-[#7a4708]", name: "text-[#94560a]" },
  Rest: { card: "border-feelz-rest/20 bg-feelz-rest/[0.07]", chip: "bg-feelz-rest/[0.12] text-feelz-rest", name: "text-feelz-rest" },
} as const;
const DEFAULT_TONE = { card: "border-brand/15 bg-[#f8eef2]", chip: "", name: "text-brand" };

// Capitalised mood names only, so ordinary words ("the rest of the day")
// don't count as a product mention.
function productFor(comment: string | null): keyof typeof PRODUCT_TONES | null {
  const match = comment?.match(/\b(Focus|Joy|JOY|Extrovert|Rest)\b/);
  if (!match) return null;
  const word = match[1];
  return (word.charAt(0) + word.slice(1).toLowerCase()) as keyof typeof PRODUCT_TONES;
}

const CLAMP_CHARS = 260;

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const product = productFor(review.comment);
  const tone = product ? PRODUCT_TONES[product] : DEFAULT_TONE;
  const isLong = (review.comment?.length ?? 0) > CLAMP_CHARS;

  return (
    <div className={`rounded-3xl border p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-7 ${tone.card}`}>
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        {product && <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone.chip}`}>{product}</span>}
      </div>
      {review.comment && (
        <p
          className={`font-tagline mt-4 whitespace-pre-line text-lg italic leading-snug text-ink ${
            isLong && !expanded ? "line-clamp-5" : ""
          }`}
        >
          &ldquo;{review.comment}&rdquo;
        </p>
      )}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`mt-2 text-xs font-semibold hover:underline ${tone.name}`}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      <p className={`mt-5 text-sm font-semibold ${tone.name}`}>
        — {review.reviewer_name}
        {review.city ? <span className="font-normal text-ink/50"> · {review.city}</span> : null}
      </p>
    </div>
  );
}

// The most recent reviews (spec 4.1), each tinted by the product it mentions —
// a real rotating carousel (same embla primitive as the homepage hero)
// rather than a static bento grid, so the featured tile and supporting
// voices each get full width instead of being squeezed into a fixed grid.
// reviewer_name/city and star rating are the only fields the reviews table
// has (no photo column), so there's nothing to anonymize beyond what the
// schema already omits. No review-submission UI exists yet anywhere in the
// app, so an empty state here is expected until that ships — not a bug.
export function TestimonialsSection({ background = "bg-surface-alt" }: { background?: string }) {
  const reviewsQuery = useQuery({
    queryKey: ["reviews", "recent"],
    queryFn: () => getRecentReviews(createClient(), 8),
  });
  const summaryQuery = useQuery({
    queryKey: ["reviews", "summary"],
    queryFn: () => getReviewsSummary(createClient()),
  });
  const reviews = reviewsQuery.data ?? [];
  const summary = summaryQuery.data;

  const prefersReduced = useReducedMotion();
  const reduced = !!prefersReduced;
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, reduced ? [] : [autoplay.current]);
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

  if (!reviewsQuery.isLoading && reviews.length === 0) return null;

  return (
    <section className={`${background} py-20`}>
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6">
        {/* The page's quietest moment: label, then heading, then the rating —
            each waiting on the one before it, so the section settles rather
            than arriving all at once. */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <RiseIn y={8} blur={3} amount={0.6}>
              <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">
                Real Stories
              </p>
            </RiseIn>
            <h2 className="font-display mt-2 text-5xl font-bold tracking-tight text-ink sm:text-6xl">
              <MaskLine delay={0.16} duration={1.1}>
                India is <span className="font-tagline italic text-brand">healing</span>.
              </MaskLine>
            </h2>
          </div>
          {summary && (
            <RiseIn delay={0.55} y={10} amount={0.4}>
              <div className="flex items-center gap-2">
                <Stars rating={summary.average} />
                <span className="text-sm text-ink/60">
                  <span className="font-display font-bold text-ink">
                    {summary.average.toFixed(1)}/5
                  </span>{" "}
                  from {summary.count} review{summary.count === 1 ? "" : "s"}
                </span>
              </div>
            </RiseIn>
          )}
        </div>

        <RiseIn delay={0.2} y={18} blur={5} duration={0.9} amount={0.2} className="mt-10">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="-ml-4 flex items-start">
              {reviews.map((review) => (
                <div key={review.id} className="min-w-0 flex-[0_0_100%] pl-4 sm:flex-[0_0_60%] lg:flex-[0_0_42%]">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>

          {reviews.length > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1.5">
              {reviews.map((review, index) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(index)}
                  aria-label={`Show review ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${index === selectedIndex ? "w-6 bg-brand" : "w-1.5 bg-ink/15"}`}
                />
              ))}
            </div>
          )}
        </RiseIn>
      </div>
    </section>
  );
}
