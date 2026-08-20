"use client";

import { useEffect } from "react";

// Companion to AuthModal's scroll capture: runs once per real page load
// (not per client-side navigation) and, if a scroll position was stashed
// before a Google sign-in redirect, restores it — the piece that actually
// gets the customer back to the mood/product section they were on, since
// those sections aren't URL-addressable (see AuthModal.tsx's comment).
// A short delay lets the page's own data-fetched content (e.g. the Feelz
// catalog) finish laying out first, so the restored position lands on the
// real section instead of wherever a still-loading page happened to be.
export function ScrollRestoreOnAuthReturn() {
  useEffect(() => {
    const saved = sessionStorage.getItem("authReturnScrollY");
    if (saved === null) return;
    sessionStorage.removeItem("authReturnScrollY");

    const y = Number(saved);
    if (!Number.isFinite(y)) return;

    const timer = window.setTimeout(() => {
      window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
    }, 200);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
