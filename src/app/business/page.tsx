"use client";

import { useQuery } from "@tanstack/react-query";
import { Briefcase, HeartHandshake, Sparkles, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getRecentReviews } from "@/lib/api";
import { BusinessLeadForm } from "@/components/BusinessLeadForm";

// Copy sourced from mindcafe.app/businesses (the same company's live
// corporate-wellness page) rather than invented — stats, client names, and
// the offering breakdown are what the business already publishes.
const OFFERINGS = [
  {
    Icon: HeartHandshake,
    title: "counselling program",
    description: "Confidential 1:1 sessions with certified professionals for stress and anxiety management.",
  },
  {
    Icon: Sparkles,
    title: "wellness workshops",
    description: "Interactive group sessions on emotional resilience, communication, and burnout prevention.",
  },
  {
    Icon: Briefcase,
    title: "brain performance tools",
    description: "Feelz wellness strips, self-help courses, guided journals, and digital resources for the team.",
  },
];

const STATS = ["20,000+ people served", "20+ organisations partnered", "20,000+ sessions completed", "96% satisfaction"];

const CLIENTS = ["Zostel", "Tata Steel", "Times of India", "IIIT Nagpur"];

function CorporateTestimonials() {
  // Corporate-flagged reviews specifically (spec 4.7) — reuses the same
  // reviews table the consumer teaser reads, just scoped differently.
  const reviewsQuery = useQuery({
    queryKey: ["reviews", "corporate"],
    queryFn: async () => {
      const sb = createClient();
      const all = await getRecentReviews(sb, 20);
      return all.filter((r) => r.is_corporate);
    },
  });
  const reviews = (reviewsQuery.data ?? []).slice(0, 3);
  if (!reviewsQuery.isLoading && reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="font-display text-center text-2xl font-bold lowercase text-ink sm:text-3xl">what teams say</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-ink/10 bg-white p-5 text-left text-sm">
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5" fill={i < review.rating ? "currentColor" : "none"} aria-hidden />
              ))}
            </div>
            {review.comment && <p className="mt-3 text-ink/70">&ldquo;{review.comment}&rdquo;</p>}
            <p className="mt-3 text-xs font-medium text-ink/50">{review.reviewer_name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function BusinessPage() {
  return (
    <div>
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <span className="rounded-full border border-cream/25 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-label text-cream/70">
            for business
          </span>
          <h1 className="font-display mx-auto mt-6 max-w-xl text-4xl font-bold lowercase leading-[1.05] sm:text-5xl">
            build healthier teams.
          </h1>
          <p className="font-tagline mx-auto mt-4 max-w-md text-lg italic text-cream/70">improve team performance.</p>
          <a href="#get-in-touch" className="pill-btn-white mt-8 inline-flex">
            talk to us
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat} className="rounded-xl border border-ink/10 bg-white p-4 text-center">
              <p className="font-display text-sm font-bold text-ink sm:text-base">{stat}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] font-semibold uppercase tracking-label text-ink/40">
          trusted by teams at
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-medium text-ink/50">
          {CLIENTS.map((client) => (
            <span key={client}>{client}</span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-center text-2xl font-bold lowercase text-ink sm:text-3xl">what&apos;s included</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {OFFERINGS.map((offering) => (
            <div key={offering.title} className="rounded-2xl border border-ink bg-white p-6 text-center shadow-lg">
              <offering.Icon className="mx-auto h-6 w-6 text-ink" aria-hidden />
              <h3 className="font-display mt-3 text-lg font-bold lowercase text-ink">{offering.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{offering.description}</p>
            </div>
          ))}
        </div>
      </section>

      <CorporateTestimonials />

      <section id="get-in-touch" className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <h2 className="font-display text-center text-2xl font-bold lowercase text-ink sm:text-3xl">get in touch</h2>
        <div className="mt-8">
          <BusinessLeadForm />
        </div>
      </section>
    </div>
  );
}
