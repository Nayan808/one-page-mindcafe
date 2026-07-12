"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getSiteSetting } from "@/lib/api";

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
    <div className="border-y border-ink/10 bg-cream px-4 py-6 text-center">
      <p className="font-display flex flex-wrap items-center justify-center gap-3 text-lg font-bold sm:text-2xl">
        {chips.map((chip, index) => (
          <span key={chip} className="contents">
            {index > 0 && (
              <span aria-hidden className="text-ink/40">
                ✦
              </span>
            )}
            <span>{chip}</span>
          </span>
        ))}
      </p>
    </div>
  );
}
