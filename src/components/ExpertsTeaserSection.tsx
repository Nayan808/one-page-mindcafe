"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getActiveExperts } from "@/lib/api";
import { ExpertCard } from "@/components/ExpertCard";

// Spec 4.4 "Experts teaser: pull 3–4 rows from experts where
// is_active = true". Renders nothing if the table is ever empty (e.g. a
// fresh environment before seeding) rather than showing a broken section.
export function ExpertsTeaserSection() {
  const expertsQuery = useQuery({
    queryKey: ["experts", "teaser"],
    queryFn: () => getActiveExperts(createClient()),
  });
  const experts = (expertsQuery.data ?? []).slice(0, 4);

  if (!expertsQuery.isLoading && experts.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">meet the experts</p>
        <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">certified counsellors</h2>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {experts.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} bookHref={`/book-appointment?expert=${expert.id}`} />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/experts" className="pill-btn-outline">
          see all experts
        </Link>
      </div>
    </section>
  );
}
