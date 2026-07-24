"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type FilterOption = { value: string; label: string };

// Replaces a growing row of filter pills (order status, pickup location,
// ...) with a single dropdown once there are enough options that the pill
// row wraps to multiple lines and becomes hard to scan. The search box
// stays pinned at the top of the panel — it's the list underneath that
// scrolls, not the whole dropdown — so it's always reachable without
// hunting for it.
export function FilterDropdown({
  options,
  value,
  onChange,
  searchPlaceholder = "Search…",
  placeholder,
  triggerClassName,
}: {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Shown when `value` doesn't match any option (e.g. nothing picked yet).
   * Without this, an unmatched value falls back to the first option's
   * label, which reads as "already selected" — wrong for an empty state. */
  placeholder?: string;
  /** Overrides the default dark filter-pill look, for reuse as a plain
   * form field (e.g. a searchable account picker inside a modal) instead
   * of a standalone filter control. */
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    searchInputRef.current?.focus();

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const term = search.trim().toLowerCase();
  const filtered = term ? options.filter((o) => o.label.toLowerCase().includes(term)) : options;
  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? options[0]?.label ?? "";

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className={
          triggerClassName ?? "flex items-center gap-1.5 rounded-full border border-ink bg-ink px-3.5 py-1.5 text-xs font-medium text-cream"
        }
      >
        <span className={triggerClassName ? "truncate" : ""}>{selectedLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 top-full z-20 mt-2 flex max-h-72 ${triggerClassName ? "w-full" : "w-60"} flex-col overflow-hidden rounded-2xl border border-ink/15 bg-cream shadow-xl`}
        >
          <div className="sticky top-0 shrink-0 border-b border-ink/10 bg-cream p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" aria-hidden />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="input !py-1.5 !pl-8 text-xs"
              />
            </div>
          </div>

          <div className="scrollbar-hide overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-ink/50">No matches.</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-ink/5 ${
                    opt.value === value ? "font-semibold text-ink" : "text-ink/70"
                  }`}
                >
                  {opt.label}
                  {opt.value === value && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
