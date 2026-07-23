"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Quote, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getExpertById } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/therapyCategories";

// Full profile page for one expert — everything the directory card
// deliberately leaves out (long bio, named modalities, common client
// concerns, languages, a personal note) lives here instead, sourced from
// the same `experts` row so any future expert with this data filled in
// gets the same page for free. Sections with no data (most experts today
// only have the short card fields) simply don't render — this page has
// to look complete for a bare-minimum listing too, not just Shivalika's.
export function ExpertDetailContent({ expertId }: { expertId: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  const expertQuery = useQuery({
    queryKey: ["expert", expertId],
    queryFn: () => getExpertById(createClient(), expertId),
  });

  if (expertQuery.isLoading) {
    return <div className="min-h-[60vh] bg-white px-4 py-16 text-center text-sm text-ink/60">Loading…</div>;
  }

  const expert = expertQuery.data;
  if (!expert) {
    return (
      <div className="mx-auto min-h-[60vh] max-w-md bg-white px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold lowercase text-ink">expert not found</h1>
        <p className="mt-2 text-sm text-ink/60">This listing may no longer be active.</p>
        <Link href="/experts" className="pill-btn-outline mt-6 inline-flex">
          back to experts
        </Link>
      </div>
    );
  }

  const initials = expert.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const bookHref = `/book-appointment?expert=${expert.id}`;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Link href="/experts" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/60 hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          back to experts
        </Link>

        <div className="mt-6 flex flex-col items-center text-center">
          {expert.photo_url && !imageFailed ? (
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-ink">
              <Image src={expert.photo_url} alt={expert.name} fill className="object-cover" onError={() => setImageFailed(true)} />
            </div>
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-ink bg-ink text-2xl font-bold text-cream">
              {initials}
            </div>
          )}

          <h1 className="font-display mt-4 text-2xl font-bold text-ink sm:text-3xl">{expert.name}</h1>
          {expert.certifications.length > 0 && (
            <p className="mt-1 text-sm font-medium uppercase tracking-label text-ink/50">
              {expert.certifications.join(" · ")}
            </p>
          )}
          {expert.years_experience && <p className="mt-1 text-sm text-ink/60">{expert.years_experience} of experience</p>}

          {expert.rating !== null && (
            <div className="mt-2 flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4" fill={index < Math.round(expert.rating!) ? "currentColor" : "none"} aria-hidden />
              ))}
            </div>
          )}

          {expert.specialties.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {expert.specialties.map((specialty) => (
                <span key={specialty} className="rounded-full border border-ink px-2.5 py-1 text-[10px] font-medium uppercase tracking-label">
                  {CATEGORY_LABELS[specialty] ?? specialty}
                </span>
              ))}
            </div>
          )}

          {expert.is_bookable && (
            <Link href={bookHref} className="pill-btn mt-6">
              book with {expert.name.split(" ")[0]}
            </Link>
          )}
        </div>

        {(expert.long_bio || expert.bio) && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">about</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/70">
              {(expert.long_bio ?? expert.bio ?? "").split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}

        {expert.modalities.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">specialisation</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {expert.modalities.map((modality) => (
                <span key={modality} className="rounded-full border border-ink/20 bg-cream px-3 py-1.5 text-xs font-medium text-ink">
                  {modality}
                </span>
              ))}
            </div>
          </section>
        )}

        {expert.client_concerns.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">you might relate if…</h2>
            <ul className="mt-3 space-y-3">
              {expert.client_concerns.map((concern, index) => (
                <li key={index} className="flex gap-2 rounded-xl border border-ink/15 bg-cream p-4 text-sm italic text-ink/70">
                  <Quote className="mt-0.5 h-4 w-4 shrink-0 text-ink/30" aria-hidden />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {expert.languages.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">languages spoken</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {expert.languages.map((language) => (
                <span key={language} className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-medium text-ink">
                  {language}
                </span>
              ))}
            </div>
          </section>
        )}

        {expert.therapist_note && (
          <section className="mt-10 rounded-2xl border border-ink/15 bg-cream p-6">
            <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">a note from {expert.name.split(" ")[0]}</h2>
            <p className="mt-3 text-sm italic leading-relaxed text-ink/70">&ldquo;{expert.therapist_note}&rdquo;</p>
          </section>
        )}

        {expert.is_bookable && (
          <div className="mt-12 text-center">
            <Link href={bookHref} className="pill-btn">
              book with {expert.name.split(" ")[0]}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
