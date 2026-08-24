"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getActiveExperts } from "@/lib/api";
import { motion } from "motion/react";
import { EASE, MaskLine, RiseIn, useCalmMotion } from "@/components/motion/primitives";

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
  const calm = useCalmMotion();

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* The warmest, most human moment on the page, so the heading arrives
            slowly and unhurried rather than snapping in. */}
        <div className="text-center">
          <RiseIn y={8} blur={3} amount={0.6}>
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">Counselling</p>
          </RiseIn>
          <h2 className="font-display mt-2 text-5xl font-bold tracking-tight text-ink sm:text-6xl">
            <MaskLine delay={0.15} duration={1.15}>
              Talk to someone who gets it
            </MaskLine>
          </h2>
          <RiseIn delay={0.5} y={12} amount={0.5}>
            <p className="mx-auto mt-4 max-w-xl text-sm text-ink/60">
              1:1 sessions with certified counsellors: individual, family, child &amp; adolescent, and
              specialized care. Book online, meet from anywhere.
            </p>
          </RiseIn>
        </div>

        {experts.length > 0 && (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {experts.map((expert, index) => {
              const base = index * 0.13;
              return (
                <motion.div
                  key={expert.id}
                  initial={calm ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.8, delay: base, ease: EASE }}
                >
                  <Link
                    href={`/book-appointment?expert=${expert.id}`}
                    className="group block overflow-hidden rounded-3xl border border-ink/10 bg-white text-left shadow-sm transition-all duration-500 ease-out hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_18px_40px_-24px_rgba(77,42,57,0.35)]"
                  >
                    {/* The portrait WIPES in — clip-path opening downward —
                        rather than fading. A face fading up reads as a
                        placeholder loading; a wipe reads as a considered
                        reveal, and it lets the card content follow after
                        the person has arrived. */}
                    <motion.div
                      className="relative aspect-square w-full overflow-hidden bg-ink/5"
                      initial={calm ? false : { clipPath: "inset(0 0 100% 0)" }}
                      animate={{ clipPath: "inset(0 0 0% 0)" }}
                      transition={{ duration: 1.1, delay: base + 0.1, ease: EASE }}
                    >
                      {expert.photo_url ? (
                        <Image
                          src={expert.photo_url}
                          alt={expert.name}
                          fill
                          sizes="(min-width: 1024px) 22vw, 45vw"
                          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-cream text-2xl font-bold text-ink">
                          {initialsFor(expert.name)}
                        </div>
                      )}
                      <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-cream transition-transform duration-500 group-hover:scale-110">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </motion.div>

                    {/* Name, then credential — the person before the label. */}
                    <div className="p-4 text-center">
                      <RiseIn delay={base + 0.62} y={8} blur={3} duration={0.7} amount={0.2}>
                        <h3 className="font-display text-sm font-bold text-ink">{expert.name}</h3>
                      </RiseIn>
                      {expert.certifications.length > 0 && (
                        <RiseIn delay={base + 0.76} y={6} blur={2} duration={0.7} amount={0.2}>
                          <p className="mt-0.5 truncate text-xs text-ink/60">
                            {expert.certifications[0]}
                          </p>
                        </RiseIn>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        <RiseIn delay={0.2} y={12} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/book-appointment" className="pill-btn">
            Book a Session
          </Link>
          <Link href="/counselling" className="pill-btn-outline">
            Explore Counselling
          </Link>
        </RiseIn>
      </div>
    </section>
  );
}
