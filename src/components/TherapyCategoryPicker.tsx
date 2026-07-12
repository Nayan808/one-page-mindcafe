"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getTherapyCategories } from "@/lib/api";

// Spec 3.4 "therapy type picker" — 4 category cards routing to
// /therapy/:category, driven by the therapy_categories table so the copy
// stays editable without a redeploy.
export function TherapyCategoryPicker() {
  const categoriesQuery = useQuery({
    queryKey: ["therapy-categories"],
    queryFn: () => getTherapyCategories(createClient()),
  });
  const categories = categoriesQuery.data ?? [];

  if (!categoriesQuery.isLoading && categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">choose a category</p>
        <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">what brings you in?</h2>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/therapy/${category.slug}`}
            className="block rounded-2xl border border-ink bg-white p-6 text-left shadow-lg transition hover:-translate-y-0.5"
          >
            <h3 className="font-display text-xl font-bold text-ink">{category.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/60">{category.body}</p>
            <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-label text-ink underline">
              learn more →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
