"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSiteSetting } from "@/lib/api";

type AnnouncementValue = { text: string; enabled: boolean; href?: string };

const DISMISS_KEY_PREFIX = "mc_announcement_dismissed_";

// Thin, dismissible banner above the header for time-limited marketing
// messages, content-managed via site_settings so it can change without a
// deploy. Keys the per-session dismissal on the message text itself, so a
// new message re-shows even if an old dismissal is still cached.
export function AnnouncementBar() {
  const settingQuery = useQuery({
    queryKey: ["site-settings", "announcement_bar"],
    queryFn: () => getSiteSetting<AnnouncementValue>(createClient(), "announcement_bar"),
  });
  const [dismissed, setDismissed] = useState(false);

  const value = settingQuery.data;

  useEffect(() => {
    if (!value?.text) return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY_PREFIX + value.text) === "1");
  }, [value?.text]);

  if (!value?.enabled || !value.text || dismissed) return null;

  function handleDismiss() {
    if (value?.text) sessionStorage.setItem(DISMISS_KEY_PREFIX + value.text, "1");
    setDismissed(true);
  }

  const content = (
    <span className="text-center text-[11px] font-medium tracking-label text-cream sm:text-xs">{value.text}</span>
  );

  return (
    <div className="relative flex items-center justify-center bg-ink px-10 py-2">
      {value.href ? (
        <a href={value.href} className="hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/60 hover:text-cream"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
