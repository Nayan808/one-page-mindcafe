"use client";

import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getRecentReviews, getReviewsSummary } from "@/lib/api";
import { Reveal } from "@/components/Reveal";
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

function ReviewCard({ review, featured }: { review: Review; featured?: boolean }) {
  return (
    <div
      className={`flex h-full flex-col justify-between rounded-3xl p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        featured ? "bg-ink text-cream" : "border border-ink/10 bg-cream text-ink"
      }`}
    >
      <div>
        <Stars rating={review.rating} className={featured ? "text-amber-300" : "text-amber-400"} />
        {review.comment && (
          <p className={`font-tagline mt-4 text-lg italic leading-snug ${featured ? "text-cream" : "text-ink"}`}>
            &ldquo;{review.comment}&rdquo;
          </p>
        )}
      </div>
      <p className={`mt-6 text-xs font-medium ${featured ? "text-cream/60" : "text-ink/50"}`}>
        {review.reviewer_name}
        {review.city ? ` · ${review.city}` : ""}
      </p>
    </div>
  );
}

// 4-5 most recent reviews (spec 4.1), first one featured in a large dark
// tile — an asymmetric bento layout instead of a uniform card grid, for
// visual variety from the other homepage sections. reviewer_name/city and
// star rating are the only fields the reviews table has (no photo column),
// so there's nothing to anonymize beyond what the schema already omits.
// No review-submission UI exists yet anywhere in the app, so an empty
// state here is expected until that ships — not a bug.
export function TestimonialsSection() {
  const reviewsQuery = useQuery({
    queryKey: ["reviews", "recent"],
    queryFn: () => getRecentReviews(createClient(), 5),
  });
  const summaryQuery = useQuery({
    queryKey: ["reviews", "summary"],
    queryFn: () => getReviewsSummary(createClient()),
  });
  const reviews = reviewsQuery.data ?? [];
  const summary = summaryQuery.data;

  if (!reviewsQuery.isLoading && reviews.length === 0) return null;

  const [first, ...rest] = reviews;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">real stories</p>
            <h2 className="font-display mt-2 text-4xl font-bold tracking-tight lowercase text-ink sm:text-5xl">
              india is <span className="font-tagline italic">healing</span>.
            </h2>
          </div>
          {summary && (
            <div className="flex items-center gap-2">
              <Stars rating={summary.average} />
              <span className="text-sm text-ink/60">
                <span className="font-display font-bold text-ink">{summary.average.toFixed(1)}/5</span> from{" "}
                {summary.count} review{summary.count === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {first && (
            <Reveal className="sm:col-span-2">
              <ReviewCard review={first} featured />
            </Reveal>
          )}
          {rest.map((review, index) => (
            <Reveal key={review.id} delayMs={index * 70}>
              <ReviewCard review={review} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
