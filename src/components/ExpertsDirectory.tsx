"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getActiveExperts } from "@/lib/api";
import { CATEGORY_LABELS, VALID_CATEGORY_SLUGS } from "@/lib/therapyCategories";
import { ExpertCard } from "@/components/ExpertCard";

function ExpertsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const expertsQuery = useQuery({
    queryKey: ["experts", category ?? "all"],
    queryFn: () => getActiveExperts(createClient(), category ?? undefined),
  });
  const experts = expertsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">counselling</p>
        <h1 className="font-display mt-3 text-3xl font-bold lowercase text-ink sm:text-4xl">our experts</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink/60">
          Certified counsellors, ready when you are.{category && ` Filtered to ${CATEGORY_LABELS[category] ?? category}.`}
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-xs">
        <select
          value={category ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            router.push(value ? `/experts?category=${value}` : "/experts");
          }}
          className="input text-center text-sm font-medium uppercase tracking-label"
        >
          <option value="">all</option>
          {VALID_CATEGORY_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {CATEGORY_LABELS[slug]}
            </option>
          ))}
        </select>
      </div>

      {expertsQuery.isLoading ? (
        <p className="mt-12 text-center text-sm text-ink/60">Loading experts…</p>
      ) : experts.length === 0 ? (
        <div className="mx-auto mt-12 flex max-w-md flex-col items-center rounded-2xl border border-ink/15 bg-white p-8 text-center">
          <Users className="h-8 w-8 text-ink/30" aria-hidden />
          <p className="mt-3 text-sm text-ink/60">
            No experts listed yet{category ? ` for ${CATEGORY_LABELS[category] ?? category}` : ""} — we&apos;re onboarding
            our counsellor network. Check back soon.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {experts.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} bookHref={`/book-appointment?expert=${expert.id}${category ? `&category=${category}` : ""}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ExpertsDirectory() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>}>
      <ExpertsContent />
    </Suspense>
  );
}
