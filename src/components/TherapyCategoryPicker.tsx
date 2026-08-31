"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, Heart, Sparkles, User, type LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getTherapyCategories } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

// Icon per category, keyed by slug — matches the emoji mindcafe.app itself
// uses for this exact section (no real photography exists for these 4
// categories on the live site, only emoji), translated to lucide for
// consistency with the rest of the site's iconography.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  individual: User,
  "family-relationship": Heart,
  "child-adolescent": GraduationCap,
  specialized: Sparkles,
};

// Bespoke per-category link copy, keyed by slug rather than derived from
// category.title — the DB title ("Relationships & Family") doesn't
// mechanically become the desired link text ("Explore Relationship
// Support"), so this is spelled out explicitly instead of guessed.
const EXPLORE_LABELS: Record<string, string> = {
  individual: "Explore Individual Support",
  "family-relationship": "Explore Relationship Support",
  "child-adolescent": "Explore Child & Adolescent Support",
  specialized: "Explore Specialised Support",
};

// Spec 3.4 "therapy type picker" — 4 category cards, driven by the
// therapy_categories table so the copy stays editable without a redeploy.
// Display-only: cards don't link anywhere, just present the categories.
export function TherapyCategoryPicker() {
  const categoriesQuery = useQuery({
    queryKey: ["therapy-categories"],
    queryFn: () => getTherapyCategories(createClient()),
  });
  const categories = categoriesQuery.data ?? [];

  if (!categoriesQuery.isLoading && categories.length === 0) return null;

  return (
    <section className="bg-white">
      <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">Choose a Category</p>
        <h2 className="font-display mt-2 text-3xl font-bold text-ink sm:text-4xl">What are you navigating right now?</h2>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.slug] ?? Sparkles;
          return (
            <Link
              key={category.slug}
              href={`/experts?category=${category.slug}`}
              className="group relative block overflow-hidden rounded-2xl border border-ink bg-white p-6 text-left shadow-lg transition-shadow hover:shadow-xl"
            >
              <Icon
                className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rotate-[-12deg] text-ink/[0.05]"
                strokeWidth={1.25}
                aria-hidden
              />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-ink/10 bg-cream">
                <Icon className="h-5 w-5 text-ink" aria-hidden />
              </div>
              <h3 className="font-display relative mt-4 text-xl font-bold text-ink">{category.title}</h3>
              <p className="relative mt-2 line-clamp-2 text-sm leading-relaxed text-ink/60">{category.body}</p>
              <span className="relative mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink underline-offset-2 group-hover:underline">
                {EXPLORE_LABELS[category.slug] ?? `Explore ${category.title}`}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
      </Reveal>
    </section>
  );
}
