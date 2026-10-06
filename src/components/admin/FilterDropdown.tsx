"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type FilterOption = { value: string; label: string; warning?: boolean };

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
  const listRef = useRef<HTMLDivElement>(null);
  // Whether there's more list below the visible area — the scrollbar
  // itself is hidden (scrollbar-hide, same as every other dropdown/modal
  // on the site), so without this a genuinely long list just looks like
  // it ends at whatever the last visible row happens to be, with no sign
  // there's more to scroll to (see the order-status filter, which was
  // missing exactly this — "cancelled" existed, it just wasn't visible
  // and nothing said to keep scrolling).
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  function updateHasMoreBelow() {
    const el = listRef.current;
    if (!el) return;
    setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }

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
  const selectedOption = options.find((o) => o.value === value);
  const selectedLabel = selectedOption?.label ?? placeholder ?? options[0]?.label ?? "";

  // Re-check after every render that could change whether the list
  // overflows — opening the dropdown, or the option count shrinking via
  // search.
  useEffect(() => {
    if (isOpen) updateHasMoreBelow();
  }, [isOpen, filtered.length]);

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
        {selectedOption?.warning && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-label="Low stock" />
        )}
        <span className={triggerClassName ? "truncate" : ""}>{selectedLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {isOpen && (
        <div
          // max-h-72 (288px) was cutting the order-status list off right
          // around "shipped" with a few real options (out_for_delivery,
          // delivered, cancelled) still below the fold — and since the
          // scrollbar is hidden here (matches every other dropdown/modal
          // on the site), nothing signaled there was more to scroll to.
          // Tall enough now that the common ~10-option lists fit outright;
          // still caps out and scrolls normally for a genuinely long list
          // (e.g. many pickup locations).
          className={`absolute left-0 top-full z-20 mt-2 flex max-h-96 ${triggerClassName ? "w-full" : "w-60"} flex-col overflow-hidden rounded-2xl border border-ink/15 bg-cream shadow-xl`}
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

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div ref={listRef} onScroll={updateHasMoreBelow} className="scrollbar-hide h-full overflow-y-auto py-1">
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
                    className={`flex w-full min-w-0 items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-ink/5 ${
                      opt.value === value ? "font-semibold text-ink" : "text-ink/70"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      {opt.warning && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-label="Low stock" />}
                      <span className="min-w-0 truncate">{opt.label}</span>
                    </span>
                    {opt.value === value && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  </button>
                ))
              )}
            </div>
            {/* The only signal that there's more to scroll to, now that
                the list can genuinely overflow even at the taller max
                height — a hidden scrollbar with no other cue is exactly
                what made "cancelled" look like it didn't exist. */}
            {hasMoreBelow && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-cream to-transparent"
                aria-hidden
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
