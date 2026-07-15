"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getActiveExperts } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Homepage teaser for the counselling vertical — mirrors FeelzTeaserSection's
// role (a taste, not the full page) so the homepage isn't Feelz-only. Full
// detail (full expert directory, emotional checklist, FAQs) stays on
// /counselling and /experts. Shows real active experts (not therapy
// categories) — a photo, name, and role reads as more "someone who gets
// it" than a category label does. The intro copy and CTAs render
// regardless of whether the experts query has resolved yet — "counselling
// exists here" shouldn't disappear just because one table's fetch is slow
// or briefly empty.
export function CounsellingTeaserSection() {
  const expertsQuery = useQuery({
    queryKey: ["experts", "counselling-teaser"],
    queryFn: () => getActiveExperts(createClient()),
  });
  const experts = (expertsQuery.data ?? []).slice(0, 4);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">counselling</p>
        <h2 className="font-display mt-2 text-4xl font-bold tracking-tight lowercase text-ink sm:text-5xl">
          talk to someone who gets it
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-ink/60">
          1:1 sessions with certified counsellors — individual, family, child &amp; adolescent, and specialized
          care. Book online, meet from anywhere.
        </p>
      </Reveal>

      {experts.length > 0 && (
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {experts.map((expert, index) => (
            <Reveal key={expert.id} delayMs={index * 80}>
              <Link
                href={`/book-appointment?expert=${expert.id}`}
                className="group block overflow-hidden rounded-3xl border border-ink/10 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-ink/5">
                  {expert.photo_url ? (
                    <Image
                      src={expert.photo_url}
                      alt={expert.name}
                      fill
                      sizes="(min-width: 1024px) 22vw, 45vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-ink text-2xl font-bold text-cream">
                      {initialsFor(expert.name)}
                    </div>
                  )}
                  <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-cream">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-sm font-bold text-ink">{expert.name}</h3>
                  {expert.certifications.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-ink/60">{expert.certifications[0]}</p>
                  )}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
