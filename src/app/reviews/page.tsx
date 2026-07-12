"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getReviewsPage } from "@/lib/api";

const PAGE_SIZE = 9;

export default function ReviewsPage() {
  const [page, setPage] = useState(0);
  const [rating, setRating] = useState<number | null>(null);

  const reviewsQuery = useQuery({
    queryKey: ["reviews", "page", page, rating],
    queryFn: () => getReviewsPage(createClient(), { page, pageSize: PAGE_SIZE, rating: rating ?? undefined }),
  });

  const reviews = reviewsQuery.data?.reviews ?? [];
  const total = reviewsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleRatingFilter(value: number | null) {
    setRating(value);
    setPage(0);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">reviews</p>
        <h1 className="font-display mt-3 text-3xl font-bold lowercase text-ink sm:text-4xl">what people say</h1>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => handleRatingFilter(null)}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium uppercase tracking-label ${rating === null ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/60 hover:border-ink/40"}`}
        >
          all
        </button>
        {[5, 4, 3, 2, 1].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleRatingFilter(value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium uppercase tracking-label ${rating === value ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/60 hover:border-ink/40"}`}
          >
            {value}★
          </button>
        ))}
      </div>

      {reviewsQuery.isLoading ? (
        <p className="mt-12 text-center text-sm text-ink/60">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-12 text-center text-sm text-ink/60">
          No reviews{rating ? ` at ${rating} stars` : ""} yet.
        </p>
      ) : (
        <>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-ink/10 bg-white p-5 text-left text-sm">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5" fill={i < review.rating ? "currentColor" : "none"} aria-hidden />
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

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="pill-btn-outline !py-2 text-xs disabled:opacity-40"
              >
                previous
              </button>
              <span className="text-xs text-ink/50">
                page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="pill-btn-outline !py-2 text-xs disabled:opacity-40"
              >
                next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
