"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getTherapyCategory } from "@/lib/api";

export function TherapyCategoryContent({ category }: { category: string }) {
  const categoryQuery = useQuery({
    queryKey: ["therapy-category", category],
    queryFn: () => getTherapyCategory(createClient(), category),
  });

  if (categoryQuery.isLoading) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-ink/60 sm:px-6">Loading…</div>;
  }

  const therapyCategory = categoryQuery.data;

  if (!therapyCategory) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold lowercase text-ink">category not found</h1>
        <p className="mt-2 text-sm text-ink/60">That therapy category doesn&apos;t exist — here are the ones we offer.</p>
        <Link href="/counselling" className="pill-btn mt-6">
          back to counselling
        </Link>
      </div>
    );
  }

  return (
    <div>
      <section className="border-b border-ink/10 bg-ink text-cream">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-label text-cream/60">counselling</p>
          <h1 className="font-display mt-3 text-3xl font-bold lowercase sm:text-4xl">{therapyCategory.title}</h1>
        </div>
      </section>

      {therapyCategory.hero_image && (
        <div className="relative mx-auto mt-8 aspect-[21/9] w-full max-w-4xl overflow-hidden rounded-2xl border border-ink px-4 sm:px-6">
          <Image src={therapyCategory.hero_image} alt={therapyCategory.title} fill className="object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <p className="text-sm leading-relaxed text-ink/70 sm:text-base">{therapyCategory.body}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={`/book-appointment?category=${therapyCategory.slug}`} className="pill-btn">
            book a session
          </Link>
          <Link href={`/experts?category=${therapyCategory.slug}`} className="pill-btn-outline">
            find an expert
          </Link>
          <Link href="/counselling" className="text-xs font-medium uppercase tracking-label text-ink/50 hover:text-ink">
            back to counselling
          </Link>
        </div>
      </div>
    </div>
  );
}
