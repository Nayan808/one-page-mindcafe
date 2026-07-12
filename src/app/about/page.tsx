"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getMilestones } from "@/lib/api";
import { TherapyCategoryPicker } from "@/components/TherapyCategoryPicker";

// Mission/vision/founding story/milestones sourced from mindcafe.app's own
// real /about page (same company) rather than invented.
export default function AboutPage() {
  const milestonesQuery = useQuery({
    queryKey: ["milestones"],
    queryFn: () => getMilestones(createClient()),
  });
  const milestones = milestonesQuery.data ?? [];

  return (
    <div>
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-label text-cream/60">about mindcafé</p>
          <h1 className="font-display mx-auto mt-4 max-w-xl text-3xl font-bold lowercase leading-[1.15] sm:text-4xl">
            a world where seeking support is as natural as offering a hand.
          </h1>
          <p className="mt-4 text-sm text-cream/70 sm:text-base">
            Our mission: make mental wellness practical, accessible, and relevant — part of everyday life, not just
            something for crisis moments.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-2xl font-bold lowercase text-ink sm:text-3xl">our story</h2>
        <p className="mt-4 text-sm leading-relaxed text-ink/70 sm:text-base">
          mindcafé was built on the belief that taking care of your brain shouldn&apos;t feel like a last resort.
          Founded by Sneh Nigam, it set out to close the gap in mental health accessibility — moving support out of
          the crisis-only corner and into everyday life, for individuals and, later, for the teams they work on.
        </p>
        <p className="mt-4 text-sm font-medium text-ink/50">20,000+ people across India, and counting.</p>
      </section>

      {milestones.length > 0 && (
        <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-center text-2xl font-bold lowercase text-ink sm:text-3xl">milestones</h2>
          <div className="relative mt-10">
            <div className="absolute bottom-2 left-[2.6rem] top-2 w-px bg-ink/15" aria-hidden />
            <ul className="space-y-6">
              {milestones.map((milestone) => (
                <li key={milestone.id} className="relative flex gap-5">
                  <span className="font-display relative z-10 w-[3.2rem] shrink-0 rounded-full border-2 border-ink bg-cream py-1 text-center text-xs font-bold text-ink">
                    {milestone.year}
                  </span>
                  <div className="pt-0.5">
                    <h3 className="font-display text-base font-bold text-ink">{milestone.title}</h3>
                    {milestone.description && <p className="mt-1 text-sm text-ink/60">{milestone.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <TherapyCategoryPicker />
    </div>
  );
}
