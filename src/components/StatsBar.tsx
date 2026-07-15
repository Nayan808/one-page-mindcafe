"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getSiteSetting } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

const DEFAULT_CHIPS = ["10 strips per box", "1.5g total", "4 moods × 2.5mg"];

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
    <div className="border-y border-ink/10 bg-white px-4 py-10 text-center">
      <Reveal className="flex flex-wrap items-center justify-center gap-3">
        {chips.map((chip) => (
          <span
            key={chip}
            className="font-display rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-bold text-ink shadow-sm sm:text-base"
          >
            {chip}
          </span>
        ))}
      </Reveal>
    </div>
  );
}
