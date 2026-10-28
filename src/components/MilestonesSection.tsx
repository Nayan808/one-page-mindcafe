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

// Each card's text area cycles through the four Feelz pack colours, so
// the timeline reads as part of the brand instead of plain white boxes.
// Literal class strings so Tailwind generates them.
const CARD_TONES = [
  { panel: "bg-feelz-berry/[0.1]", border: "border-feelz-berry/30", pill: "bg-feelz-berry", title: "text-feelz-berry" },
  { panel: "bg-feelz-navy/[0.08]", border: "border-feelz-navy/25", pill: "bg-feelz-navy", title: "text-feelz-navy" },
  { panel: "bg-feelz-orange/[0.12]", border: "border-feelz-orange/35", pill: "bg-feelz-orange", title: "text-[#94560a]" },
  { panel: "bg-feelz-rest/[0.1]", border: "border-feelz-rest/30", pill: "bg-feelz-rest", title: "text-feelz-rest" },
];

// Milestone titles are stored lowercase ("mindcafe founded"); shown in
// Title Case, keeping short joining words lowercase and brand names right.
const SMALL_WORDS = new Set(["a", "an", "and", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);
const BRANDS: Record<string, string> = { mindcafe: "Mindcafe", feelz: "Feelz", zostel: "Zostel", ikca: "IKCA", eap: "EAP" };
function titleCase(text: string): string {
  return text
    .split(" ")
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (BRANDS[lower]) return BRANDS[lower];
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

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
    <section className="overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">Our Journey</p>
          <h2 className="font-display mt-2 text-3xl font-bold text-ink sm:text-4xl">
            Milestones <span className="font-tagline italic text-brand">worth telling.</span>
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
              const tone = CARD_TONES[index % CARD_TONES.length];
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
                    <div className={`overflow-hidden rounded-2xl border bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl ${tone.border}`}>
                      {MILESTONE_IMAGES[milestone.year] && (
                        <div className="relative aspect-[684/300] w-full">
                          <Image src={MILESTONE_IMAGES[milestone.year]} alt={titleCase(milestone.title)} fill className="object-cover" />
                        </div>
                      )}
                      <div className={`p-5 ${tone.panel}`}>
                        <span className={`font-display inline-block rounded-full px-3 py-1 text-xs font-bold text-white ${tone.pill}`}>
                          {milestone.year}
                        </span>
                        <h3 className={`font-display mt-3 text-lg font-bold ${tone.title}`}>{titleCase(milestone.title)}</h3>
                        {milestone.description && (
                          <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{milestone.description}</p>
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
