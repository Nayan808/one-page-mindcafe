"use client";

import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getRecentReviews } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

// 4 most recent reviews (spec 4.1). No review-submission UI exists yet
// anywhere in the app, so an empty state here is expected until that
// ships in a later phase — not a bug.
export function TestimonialsSection() {
  const reviewsQuery = useQuery({
    queryKey: ["reviews", "recent"],
    queryFn: () => getRecentReviews(createClient(), 4),
  });
  const reviews = reviewsQuery.data ?? [];

  if (!reviewsQuery.isLoading && reviews.length === 0) return null;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">what people say</p>
          <h2 className="font-display mt-2 text-4xl font-bold tracking-tight lowercase text-ink sm:text-5xl">
            real feedback
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review, index) => (
            <Reveal key={review.id} delayMs={index * 80}>
              <div className="rounded-3xl border border-ink/10 bg-cream p-5 text-left text-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="h-3.5 w-3.5"
                      fill={starIndex < review.rating ? "currentColor" : "none"}
                      aria-hidden
                    />
                  ))}
                </div>
                {review.comment && <p className="mt-3 text-ink/70">&ldquo;{review.comment}&rdquo;</p>}
                <p className="mt-3 text-xs font-medium text-ink/50">
                  {review.reviewer_name}
                  {review.city ? ` · ${review.city}` : ""}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
