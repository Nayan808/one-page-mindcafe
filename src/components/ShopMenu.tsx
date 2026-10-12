"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MOOD_GRID } from "@/lib/moodStyles";

// Desktop mega-menu for "Feelz" — Neurogum-style category grouping instead
// of a flat link, since Feelz is the only nav item with real
// subcategories. Reads MOOD_GRID (src/lib/moodStyles.ts), the same list
// Hero.tsx's product grid and Footer.tsx's Feelz links already use, so
// adding/renaming a mood updates all three at once instead of drifting.
export function ShopMenu({ linkClassName }: { linkClassName: string }) {
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

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* "Feelz" itself is a real link to the /feelz landing page; hovering
          still opens the menu, and the chevron is a separate toggle for
          touch/keyboard users who can't hover. */}
      <div className="flex items-center gap-1">
        <Link href="/feelz" onClick={() => setIsOpen(false)} className={linkClassName}>
          Feelz
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close Feelz menu" : "Open Feelz menu"}
          className={`flex items-center ${linkClassName}`}
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>

      {isOpen && (
        // The pt-3 gap (rather than mt-3 on the inner panel) keeps the
        // whole span from the button down to the panel inside THIS one
        // absolutely-positioned box, so it's part of the container's
        // hoverable area. A margin-based gap instead leaves a dead strip
        // that belongs to neither the button nor the panel — the mouse
        // crosses it while moving diagonally from "Feelz" down to the
        // menu, mouseleave fires, and the menu closes before it's reached.
        //
        // Left-aligned to the trigger (not centered under it) — the nav
        // now sits at the left edge of the header (logo moved to center),
        // so centering a 380px panel under "Feelz" pushed half of it past
        // the left edge of the screen.
        <div className="absolute left-0 top-full z-20 w-[380px] pt-3">
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xl">
            <div className="grid grid-cols-2 gap-2">
              {MOOD_GRID.map((mood) => (
                <Link
                  key={mood.key}
                  href={`/feelz/${mood.key}`}
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-cream"
                >
                  <span className="relative h-14 w-[42px] shrink-0 overflow-hidden rounded-md bg-cream shadow-sm ring-1 ring-ink/10 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                    <Image src={mood.src} alt="" fill sizes="42px" className="object-cover" />
                  </span>
                  <span className="text-sm font-medium text-ink group-hover:text-brand">{mood.label}</span>
                </Link>
              ))}
            </div>
            <Link
              href="/feelz"
              onClick={() => setIsOpen(false)}
              className="mt-3 block rounded-xl border border-ink/10 px-3 py-2 text-center text-xs font-semibold uppercase tracking-label text-ink/70 transition hover:border-brand/40 hover:text-brand"
            >
              Shop All
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
