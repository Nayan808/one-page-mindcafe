"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getActiveExperts, getSiteSetting } from "@/lib/api";
import { ExpertCard } from "@/components/ExpertCard";
import { Reveal } from "@/components/Reveal";
import { isWellbeingGuideRole } from "@/lib/expertCategories";
import type { Expert } from "@/types/domain";

// Only this one expert's card shows a price — every other expert's price
// is hidden, by explicit request rather than a data-driven rule (there's
// no "show price" flag on the expert row, just this one name).
const PRICE_VISIBLE_FOR = "Shivalika Srivastav";

function ExpertGroup({ title, description, experts, sessionPrice }: { title: string; description?: string; experts: Expert[]; sessionPrice?: number }) {
  if (experts.length === 0) return null;
  return (
    <div className="mt-10 first:mt-0">
      <div className="text-center">
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        {description && <p className="mt-1 text-xs text-ink/50">{description}</p>}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-5">
        {experts.map((expert) => (
          <div key={expert.id} className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)]">
            <ExpertCard
              expert={expert}
              bookHref={`/book-appointment?expert=${expert.id}`}
              sessionPrice={expert.name === PRICE_VISIBLE_FOR ? sessionPrice : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Spec 4.4 "Experts teaser: pull rows from experts where is_active =
// true". Renders nothing if the table is ever empty (e.g. a fresh
// environment before seeding) rather than showing a broken section.
export function ExpertsTeaserSection() {
  const [query, setQuery] = useState("");

  const expertsQuery = useQuery({
    queryKey: ["experts", "teaser"],
    queryFn: () => getActiveExperts(createClient()),
  });
  const experts = expertsQuery.data ?? [];

  // Same single site-wide rate CounsellingHero already shows — there's no
  // per-expert price field, so this is passed to every card rather than
  // inventing one.
  const priceQuery = useQuery({
    queryKey: ["site-settings", "counselling_session_price"],
    queryFn: () => getSiteSetting<number>(createClient(), "counselling_session_price"),
  });

  const q = query.trim().toLowerCase();
  const filtered = q
    ? experts.filter(
        (expert) =>
          expert.name.toLowerCase().includes(q) ||
          expert.certifications.some((c) => c.toLowerCase().includes(q)) ||
          expert.specialties.some((s) => s.toLowerCase().includes(q))
      )
    : experts;

  const professional = filtered.filter((e) => !isWellbeingGuideRole(e.certifications[0]));
  const guides = filtered.filter((e) => isWellbeingGuideRole(e.certifications[0]));

  if (!expertsQuery.isLoading && experts.length === 0) return null;

  return (
    <section className="bg-white">
      <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">Meet the Experts</h2>
        <p className="mt-2 text-sm text-ink/60">Choose the kind of support that feels right for you.</p>
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

      {professional.length === 0 && guides.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink/50">No experts match &ldquo;{query}&rdquo;.</p>
      ) : (
        <>
          <ExpertGroup
            title="Qualified mental-health professionals"
            description="For structured, professional counselling and mental-health support."
            experts={professional}
            sessionPrice={priceQuery.data ?? undefined}
          />
          <ExpertGroup title="Wellness Guides" experts={guides} sessionPrice={priceQuery.data ?? undefined} />
        </>
      )}
      </Reveal>
    </section>
  );
}
