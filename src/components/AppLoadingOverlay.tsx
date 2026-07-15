"use client";

import { useEffect, useState } from "react";
import { BrandLoader } from "@/components/BrandLoader";

// Next's route-level loading.tsx only fires when a Server Component
// actually suspends — every page here is a client component fetching its
// own data with React Query, so there's nothing for Next to suspend on
// and loading.tsx never gets a chance to show on a hard refresh. This is
// the real fix: a splash overlay that's part of the initial server-rendered
// HTML (visible the instant the page paints, before hydration), which
// fades out once the window "load" event fires — capped by a fallback
// timeout so a slow/stuck resource can never leave it stuck forever, and
// floored by a minimum visible time so it doesn't just flash on fast loads.
const MIN_VISIBLE_MS = 500;
const FALLBACK_TIMEOUT_MS = 4000;
const FADE_MS = 300;

export function AppLoadingOverlay() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const start = Date.now();
    let done = false;

    function hide() {
      if (done) return;
      done = true;
      const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - start));
      window.setTimeout(() => {
        setFading(true);
        window.setTimeout(() => setVisible(false), FADE_MS);
      }, remaining);
    }

    if (document.readyState === "complete") {
      hide();
    } else {
      window.addEventListener("load", hide);
    }
    const fallback = window.setTimeout(hide, FALLBACK_TIMEOUT_MS);

    return () => {
      window.removeEventListener("load", hide);
      window.clearTimeout(fallback);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-cream transition-opacity ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      aria-hidden={fading}
    >
      <BrandLoader size={48} />
    </div>
  );
}
