"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSiteSetting } from "@/lib/api";

type AnnouncementMessage = { text: string; href?: string };
// `messages` is the current shape (supports rotating more than one line);
// `text`/`href` are read as a fallback for a setting saved under the older
// single-message shape, so an already-configured production value keeps
// working without needing to be re-saved through /admin/site-settings.
type AnnouncementValue = { enabled: boolean; messages?: AnnouncementMessage[]; text?: string; href?: string };

const ROTATE_MS = 4500;

// Dev-only preview content — shown on localhost when site_settings has no
// announcement_bar row configured yet, purely so the banner is visible
// while iterating on it locally. Never applies in production: once
// deployed, an unconfigured setting means no banner, same as before this
// existed. Not a substitute for actually setting the real value (see
// /admin/site-settings) — this fallback disappears the moment a real row
// exists, in dev or prod alike.
const DEV_PREVIEW_FALLBACK: AnnouncementValue = {
  enabled: true,
  messages: [
    { text: "Get 10% off on purchases of ₹300 or more", href: "/feelz" },
    { text: "Book a 1:1 session with a certified counsellor", href: "/book-appointment" },
  ],
};

// Thin, dismissible banner above the header for time-limited marketing
// messages, content-managed via site_settings so it can change without a
// deploy. Dismissal is plain component state, not persisted anywhere — a
// page refresh always shows the banner again, on request.
export function AnnouncementBar() {
  const settingQuery = useQuery({
    queryKey: ["site-settings", "announcement_bar"],
    queryFn: () => getSiteSetting<AnnouncementValue>(createClient(), "announcement_bar"),
  });
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  const isDev = process.env.NODE_ENV !== "production";
  const value = settingQuery.data ?? (isDev && settingQuery.isFetched ? DEV_PREVIEW_FALLBACK : undefined);
  const messages = value?.messages?.length ? value.messages : value?.text ? [{ text: value.text, href: value.href }] : [];

  // Only rotates when there's more than one message — a single message just
  // sits still rather than needlessly re-rendering on an interval.
  useEffect(() => {
    if (messages.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [messages.length]);

  if (!value?.enabled || messages.length === 0 || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
  }

  const current = messages[index % messages.length];
  const content = (
    <span key={index} className="animate-[fade-in_0.4s_ease-out] text-center text-[11px] font-medium tracking-[0.03em] text-ink/80 sm:text-xs">
      {current.text}
    </span>
  );

  return (
    // Light strip with a hairline bottom border, not a solid dark block —
    // matches the reference site's own offer bar (and the site's flat-white
    // surface direction) more closely than a heavy bg-ink bar would.
    <div className="relative flex items-center justify-center gap-2 border-b border-ink/10 bg-white px-10 py-2.5">
      {current.href ? (
        <a href={current.href} className="hover:underline">
          {content}
        </a>
      ) : (
        content
      )}

      {messages.length > 1 && (
        <div className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
          {messages.map((message, i) => (
            <button
              key={message.text}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show message ${i + 1}`}
              className={`h-1 rounded-full transition-all ${i === index ? "w-4 bg-brand" : "w-1 bg-ink/20"}`}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
