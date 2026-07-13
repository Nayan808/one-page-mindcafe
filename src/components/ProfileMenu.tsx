"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/Avatar";
import { getDashboardLink } from "@/lib/roleNav";

// Avatar button in the header — click to reveal "your account" / "sign out"
// instead of showing both as always-visible pills.
export function ProfileMenu() {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const label = profile?.full_name ?? user?.email ?? "Account";
  const avatarUrl = profile?.avatar_url;
  const dashboardLink = getDashboardLink(profile?.role);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Account menu"
        aria-expanded={isOpen}
        title={label}
      >
        <Avatar label={label} avatarUrl={avatarUrl} />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 top-full mt-2 w-48 -translate-x-1/2 divide-y divide-ink/10 overflow-hidden rounded-2xl border border-ink/15 bg-cream text-center shadow-lg">
          {dashboardLink && (
            <Link
              href={dashboardLink.href}
              onClick={() => setIsOpen(false)}
              className="block w-full px-4 py-3 text-xs font-medium uppercase tracking-label text-ink/70 transition hover:bg-ink/5 hover:text-ink"
            >
              {dashboardLink.label}
            </Link>
          )}
          <Link
            href="/account"
            onClick={() => setIsOpen(false)}
            className="block w-full px-4 py-3 text-xs font-medium uppercase tracking-label text-ink/70 transition hover:bg-ink/5 hover:text-ink"
          >
            your account
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              void signOut();
            }}
            className="block w-full px-4 py-3 text-xs font-medium uppercase tracking-label text-ink/70 transition hover:bg-ink/5 hover:text-ink"
          >
            sign out
          </button>
        </div>
      )}
    </div>
  );
}
