"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getActiveExperts } from "@/lib/api";
import { ExpertCard } from "@/components/ExpertCard";
import { Reveal } from "@/components/Reveal";

// Spec 4.4 "Experts teaser: pull 3–4 rows from experts where
// is_active = true". Renders nothing if the table is ever empty (e.g. a
// fresh environment before seeding) rather than showing a broken section.
export function ExpertsTeaserSection() {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const expertsQuery = useQuery({
    queryKey: ["experts", "teaser"],
    queryFn: () => getActiveExperts(createClient()),
  });
  const experts = expertsQuery.data ?? [];

  const q = query.trim().toLowerCase();
  const filtered = q
    ? experts.filter(
        (expert) =>
          expert.name.toLowerCase().includes(q) ||
          expert.certifications.some((c) => c.toLowerCase().includes(q)) ||
          expert.specialties.some((s) => s.toLowerCase().includes(q))
      )
    : experts;

  const isSearching = q.length > 0;
  const visibleExperts = isSearching || showAll ? filtered : filtered.slice(0, 4);
  const canExpand = !isSearching && !showAll && filtered.length > 4;

  if (!expertsQuery.isLoading && experts.length === 0) return null;

  return (
    <section className="bg-white">
      <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">meet the experts</p>
        <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">certified counsellors</h2>
      </div>

      <div className="mx-auto mt-6 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="search by name or specialty"
            className="w-full rounded-full border border-ink/20 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-ink/40 focus:outline-none"
          />
        </div>
      </div>

      {visibleExperts.length > 0 ? (
        <div className="mt-10 flex flex-wrap justify-center gap-5">
          {visibleExperts.map((expert) => (
            <div key={expert.id} className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)]">
              <ExpertCard expert={expert} bookHref={`/book-appointment?expert=${expert.id}`} />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-ink/50">no experts match &ldquo;{query}&rdquo;.</p>
      )}

      {canExpand ? (
        <div className="mt-8 text-center">
          <button type="button" onClick={() => setShowAll(true)} className="pill-btn-outline">
            see all experts
          </button>
        </div>
      ) : null}
      </Reveal>
    </section>
  );
}
