"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getTherapyCategories } from "@/lib/api";

// Homepage teaser for the counselling vertical — mirrors FeelzTeaserSection's
// role (a taste, not the full page) so the homepage isn't Feelz-only. Full
// detail (expert directory, emotional checklist, FAQs) stays on
// /counselling. The intro copy and CTAs render regardless of whether the
// therapy_categories query has resolved yet — unlike a pure product grid,
// "counselling exists here" shouldn't disappear just because one table's
// fetch is slow or briefly empty.
export function CounsellingTeaserSection() {
  const categoriesQuery = useQuery({
    queryKey: ["therapy-categories"],
    queryFn: () => getTherapyCategories(createClient()),
  });
  const categories = categoriesQuery.data ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">counselling</p>
        <h2 className="font-display mt-2 text-3xl font-bold lowercase text-ink sm:text-4xl">talk to someone who gets it</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink/60">
          1:1 sessions with certified counsellors — individual, family, child &amp; adolescent, and specialized
          care. Book online, meet from anywhere.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/therapy/${category.slug}`}
              className="block rounded-2xl border border-ink/10 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-display text-base font-bold text-ink">{category.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink/60">{category.body}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/book-appointment" className="pill-btn">
          book a session
        </Link>
        <Link href="/counselling" className="pill-btn-outline">
          explore counselling
        </Link>
      </div>
    </section>
  );
}
