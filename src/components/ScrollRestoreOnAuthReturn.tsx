"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const MAX_AGE_MS = 15 * 60 * 1000;

function restoreScroll() {
  const saved = sessionStorage.getItem("authReturnScrollY");
  if (saved === null) return;
  sessionStorage.removeItem("authReturnScrollY");
  const y = Number(saved);
  if (!Number.isFinite(y)) return;
  // A short delay lets the page's data-fetched content (e.g. the Feelz
  // catalog) lay out first, so the position lands on the real section.
  window.setTimeout(() => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }), 250);
}

// Runs once per real page load, after a Google sign-in round trip:
//  1. If the customer didn't land back on the page they signed in from
//     (e.g. Supabase fell back to the homepage because the callback URL
//     wasn't in its allow-list), send them there — checkout, a product
//     page, wherever they were. Waits for the session to settle first, so
//     a sign-in code in the URL is exchanged before navigating away.
//  2. Restore the scroll position AuthModal stashed, so they're back at
//     the same section (some sections aren't URL-addressable).
export function ScrollRestoreOnAuthReturn() {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || status === "loading") return;
    handled.current = true;

    let target: string | null = null;
    try {
      const raw = sessionStorage.getItem("authReturnTo");
      sessionStorage.removeItem("authReturnTo");
      if (raw) {
        const { path, at } = JSON.parse(raw) as { path?: string; at?: number };
        const fresh = typeof at === "number" && Date.now() - at < MAX_AGE_MS;
        const safe = typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
        if (fresh && safe && status === "authenticated") target = path;
      }
    } catch {
      target = null;
    }

    const here = window.location.pathname + window.location.search;
    if (target && target.split("#")[0] !== here && !target.startsWith(`${window.location.pathname}?error=`)) {
      router.replace(target);
      // Scroll is restored on the target page once it has rendered.
      window.setTimeout(restoreScroll, 400);
      return;
    }
    restoreScroll();
  }, [status, router, pathname]);

  return null;
}
