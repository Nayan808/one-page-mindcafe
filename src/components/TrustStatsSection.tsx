"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getHomepageStats } from "@/lib/api";
import { CountUp, DrawLine, RiseIn } from "@/components/motion/primitives";

// Rounds down to the nearest step and formats as "N+" — keeps this
// honest as real counts grow, without needing a copy change every time a
// session/expert/location count ticks up by one. Today's real numbers
// (107 sessions, 26 experts, 10 locations) land on exactly "100+", "25+",
// "10+".
function floorPlus(value: number, step: number): string {
  return `${Math.floor(value / step) * step}+`;
}

// Units sold: real (in-person sales at Zostel front desks predate this
// checkout system), but there's no table tracking it — confirmed with the
// site owner to keep this one as static copy rather than a live query,
// since there's genuinely nothing in the database to compute it from.
const UNITS_SOLD_FIGURE = "200+";

// Baseline figures shown while the live query is in flight, or if it fails.
//
// These are the same real numbers the comment above documents, already
// rounded by the same floorPlus rule — so the row always renders as real
// copy instead of three "…" placeholders, which is what a visitor was
// actually seeing whenever the request was slow, blocked, or unconfigured.
// Live data replaces them the moment it lands, and the count-up re-runs.
//
// Keep these in step with reality if the true baseline moves.
const FALLBACK = {
  sessionsBooked: "100+",
  expertsCount: "25+",
  zostelLocationsCount: "10+",
} as const;

// Homepage trust-stats row, right before PressMentionsSection — real
// counts (sessionsBooked/expertsCount/zostelLocationsCount) come from
// getHomepageStats, same "big figure + small label" visual language as
// StatsBar uses for the Feelz product facts, so the two read as one
// system despite pulling from different data.
export function TrustStatsSection() {
  const statsQuery = useQuery({
    queryKey: ["homepage-stats"],
    queryFn: () => getHomepageStats(createClient()),
  });

  const stats = statsQuery.data;

  const items = [
    {
      figure: stats ? floorPlus(stats.sessionsBooked, 100) : FALLBACK.sessionsBooked,
      label: "sessions booked",
    },
    { figure: UNITS_SOLD_FIGURE, label: "units sold" },
    {
      figure: stats ? floorPlus(stats.expertsCount, 25) : FALLBACK.expertsCount,
      label: "experts",
    },
    {
      figure: stats ? floorPlus(stats.zostelLocationsCount, 10) : FALLBACK.zostelLocationsCount,
      label: "Zostel locations",
    },
  ];

  return (
    <div className="border-y border-ink/10 bg-gradient-to-b from-white to-cream/50 px-4 py-14 text-center">
      {/* Milestone moment. Same choreography as StatsBar so the two read as
          one system: divider, then figure counting up, then label. The
          count is keyed on the figure string, so it starts only once the
          real number has arrived rather than counting the "…" placeholder. */}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center gap-6 sm:gap-10">
            {index > 0 && (
              <DrawLine className="h-10 w-px bg-brand/15" vertical origin="top" delay={index * 0.1} />
            )}
            <div className="group flex flex-col items-center gap-1.5 rounded-2xl px-6 py-3 transition-transform duration-500 ease-out hover:-translate-y-1">
              <RiseIn delay={0.12 + index * 0.1} y={10} blur={4} amount={0.6}>
                <CountUp
                  key={item.figure}
                  value={item.figure}
                  delay={0.22 + index * 0.1}
                  className="font-hero block text-4xl font-bold leading-none text-brand transition-colors duration-500 group-hover:text-brand-navy sm:text-5xl"
                />
              </RiseIn>
              <RiseIn delay={0.55 + index * 0.1} y={6} blur={3} amount={0.6}>
                <span className="text-[11px] font-semibold uppercase tracking-label text-ink/50">
                  {item.label}
                </span>
              </RiseIn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
