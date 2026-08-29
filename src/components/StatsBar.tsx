"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getSiteSetting } from "@/lib/api";
import { CountUp, DrawLine, RiseIn } from "@/components/motion/primitives";

const DEFAULT_CHIPS = ["4 moods", "10 strips per box"];

// Splits a leading number off a chip string ("10 strips per box" -> "10" +
// "strips per box") so it can be shown as a large stat figure with a small
// label underneath. Chips that don't start with a number (e.g. a future
// site_settings value that doesn't follow this pattern) fall back to
// rendering as plain text — the split is purely a display nicety, never a
// requirement for a chip to render.
function splitLeadingNumber(chip: string): { figure: string; label: string } | null {
  const match = chip.match(/^(\d+[\d.,]*\+?)\s+(.*)$/);
  if (!match) return null;
  return { figure: match[1], label: match[2] };
}

// Reads site_settings['homepage_stats'] so marketing can update these
// without a deploy, falling back to the hardcoded defaults if that key
// hasn't been configured yet — never renders empty/broken either way.
export function StatsBar() {
  const settingQuery = useQuery({
    queryKey: ["site-settings", "homepage_stats"],
    queryFn: () => getSiteSetting<{ chips: string[] }>(createClient(), "homepage_stats"),
  });

  const chips = settingQuery.data?.chips?.length ? settingQuery.data.chips : DEFAULT_CHIPS;

  return (
    <div className="border-y border-ink/10 bg-gradient-to-b from-white to-cream/50 px-4 py-14 text-center">
      {/* A breathing space, so the order matters: the divider draws first,
          the figure counts up, and only then does the label arrive. */}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        {chips.map((chip, index) => {
          const split = splitLeadingNumber(chip);
          return (
            <div key={chip} className="flex items-center gap-6 sm:gap-10">
              {index > 0 && (
                <DrawLine
                  className="h-10 w-px bg-brand/15"
                  vertical
                  origin="top"
                  delay={index * 0.12}
                />
              )}
              <div className="group flex flex-col items-center gap-1.5 rounded-2xl px-6 py-3 transition-transform duration-500 ease-out hover:-translate-y-1">
                {split ? (
                  <>
                    <RiseIn delay={0.15 + index * 0.12} y={10} blur={4} amount={0.6}>
                      <CountUp
                        value={split.figure}
                        delay={0.25 + index * 0.12}
                        className="font-hero block text-4xl font-bold leading-none text-brand transition-colors duration-500 group-hover:text-brand-navy sm:text-5xl"
                      />
                    </RiseIn>
                    <RiseIn delay={0.6 + index * 0.12} y={6} blur={3} amount={0.6}>
                      <span className="text-[11px] font-semibold uppercase tracking-label text-ink/50">
                        {split.label}
                      </span>
                    </RiseIn>
                  </>
                ) : (
                  <RiseIn delay={0.15 + index * 0.12} amount={0.6}>
                    <span className="font-display text-lg font-bold text-ink sm:text-xl">{chip}</span>
                  </RiseIn>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
