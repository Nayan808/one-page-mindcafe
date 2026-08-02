"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getHomepageStats } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

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
    { figure: stats ? floorPlus(stats.sessionsBooked, 100) : "…", label: "sessions booked" },
    { figure: UNITS_SOLD_FIGURE, label: "units sold" },
    { figure: stats ? floorPlus(stats.expertsCount, 25) : "…", label: "experts" },
    { figure: stats ? floorPlus(stats.zostelLocationsCount, 10) : "…", label: "Zostel locations" },
  ];

  return (
    <div className="border-y border-ink/10 bg-gradient-to-b from-white to-cream/50 px-4 py-14 text-center">
      <Reveal className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center gap-6 sm:gap-10">
            {index > 0 && <span className="h-10 w-px bg-brand/15" aria-hidden />}
            <div className="group flex flex-col items-center gap-1.5 rounded-2xl px-6 py-3 transition-transform duration-300 hover:-translate-y-1">
              <span className="font-hero text-4xl font-bold leading-none text-brand transition-colors duration-300 group-hover:text-brand-navy sm:text-5xl">
                {item.figure}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-label text-ink/50">{item.label}</span>
            </div>
          </div>
        ))}
      </Reveal>
    </div>
  );
}
