"use client";

import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getRecentReviews } from "@/lib/api";

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
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">what people say</p>
        <h2 className="font-display mt-2 text-3xl font-bold lowercase text-ink sm:text-4xl">real feedback</h2>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-ink/10 bg-white p-5 text-left text-sm">
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className="h-3.5 w-3.5"
                  fill={index < review.rating ? "currentColor" : "none"}
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
        ))}
      </div>
    </section>
  );
}
