"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getMilestones } from "@/lib/api";

// Real milestone photography sourced from mindcafe.app/about (the same
// company's live journey timeline), keyed by year since the milestones
// table itself has no image column.
const MILESTONE_IMAGES: Record<string, string> = {
  2021: "/about/ms-founded.webp",
  2022: "/about/ms-startup-award.webp",
  2023: "/about/ms-corporate.webp",
  2024: "/about/ms-award-2024.webp",
  2025: "/about/asian-games.webp",
  2026: "/about/ms-feelz.webp",
};

export function MilestonesSection() {
  const milestonesQuery = useQuery({
    queryKey: ["milestones"],
    queryFn: () => getMilestones(createClient()),
  });
  const milestones = milestonesQuery.data ?? [];

  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 75%", "end 55%"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  if (!milestonesQuery.isLoading && milestones.length === 0) return null;

  return (
    <section className="overflow-hidden bg-white">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">our journey</p>
          <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
            milestones <span className="font-tagline italic">worth telling.</span>
          </h2>
        </div>

        <div ref={trackRef} className="relative mt-16 sm:mt-20">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-ink/10 sm:left-1/2 sm:-translate-x-1/2" aria-hidden />
          <motion.div
            style={{ height: lineHeight }}
            className="absolute left-6 top-0 w-px bg-ink sm:left-1/2 sm:-translate-x-1/2"
            aria-hidden
          />
          <motion.div
            style={{ top: lineHeight, opacity: glowOpacity }}
            className="absolute left-6 -ml-1 h-2 w-2 rounded-full bg-ink shadow-[0_0_12px_3px_rgba(17,17,16,0.35)] sm:left-1/2 sm:-ml-1 sm:-translate-x-1/2"
            aria-hidden
          />

          <ul className="space-y-10 sm:space-y-14">
            {milestones.map((milestone, index) => {
              const isRight = index % 2 === 0;
              return (
                <li key={milestone.id} className="relative">
                  <span className="absolute left-6 top-6 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-white sm:left-1/2" aria-hidden />

                  <motion.div
                    initial={{ opacity: 0, x: isRight ? 28 : -28, y: 10 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true, margin: "-64px" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`ml-14 sm:ml-0 sm:w-[calc(50%-2.5rem)] ${isRight ? "sm:ml-auto" : "sm:mr-auto sm:text-right"}`}
                  >
                    <div className="overflow-hidden rounded-2xl border border-ink bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                      {MILESTONE_IMAGES[milestone.year] && (
                        <div className="relative aspect-[684/300] w-full">
                          <Image src={MILESTONE_IMAGES[milestone.year]} alt={milestone.title} fill className="object-cover" />
                        </div>
                      )}
                      <div className="p-5">
                        <span className="font-display inline-block rounded-full bg-ink px-3 py-1 text-xs font-bold text-cream">
                          {milestone.year}
                        </span>
                        <h3 className="font-display mt-3 text-lg font-bold text-ink">{milestone.title}</h3>
                        {milestone.description && (
                          <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{milestone.description}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
