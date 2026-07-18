"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getActivePickupLocations } from "@/lib/api";
import type { PickupLocation } from "@/types/domain";

function scrollToProducts() {
  document.getElementById("mood-picks")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LocationCard({ location, wide }: { location: PickupLocation; wide?: boolean }) {
  return (
    <div
      className={`shrink-0 rounded-2xl border border-ink bg-white p-4 text-left text-ink shadow-lg ${wide ? "w-64" : "w-56"}`}
    >
      <div className="relative h-8 w-8 overflow-hidden rounded-full border border-ink/10">
        <Image src="/press/zostel.png" alt="" fill className="object-cover" />
      </div>
      <p className="font-display mt-2.5 text-base font-bold">{location.name}</p>
      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-ink/70">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/50" aria-hidden />
        {location.address}
      </p>
      <span className="mt-3 inline-block rounded-full border border-ink px-3 py-1 text-[11px] font-medium">
        {location.city}
      </span>
    </div>
  );
}

// Real pickup points, not marketing copy — same pickup_locations table the
// takeaway step at checkout reads from, so this list can never drift from
// what's actually selectable there. Add a row to that table and it shows
// up here automatically. Only active rows are fetched at all, so a search
// hit here is a genuine "yes, pick it up there" — never a placeholder
// location whose address hasn't been verified yet.
export function ZostelLocationsSection() {
  const locationsQuery = useQuery({
    queryKey: ["pickup-locations", "landing-section"],
    queryFn: () => getActivePickupLocations(createClient()),
  });
  const locations = locationsQuery.data ?? [];
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!trimmedQuery) return locations;
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(trimmedQuery) || location.city.toLowerCase().includes(trimmedQuery),
    );
  }, [locations, trimmedQuery]);

  return (
    <section id="zostel-locations" className="bg-white">
      <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto flex w-fit items-center gap-3">
        <span className="h-px w-10 bg-ink/20" aria-hidden />
        <span className="h-1.5 w-1.5 rounded-full bg-ink/40" aria-hidden />
        <span className="h-px w-10 bg-ink/20" aria-hidden />
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-label text-ink/50">available now</p>

      <h2 className="font-display mx-auto mt-4 max-w-2xl text-3xl font-bold leading-[1.1] text-ink sm:text-4xl">
        find feelz at Zostel locations across india.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-ink/60 sm:text-base">
        Search your city or Zostel property to check if we&apos;re there yet.
      </p>

      <div className="relative mx-auto mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="search your city or Zostel…"
          className="input !pl-10 !pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {locationsQuery.isLoading ? (
        <p className="mt-10 text-sm text-ink/60">Loading pickup points…</p>
      ) : locations.length === 0 ? (
        <p className="mt-10 text-sm text-ink/60">No pickup points listed yet — check back soon.</p>
      ) : trimmedQuery && results.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-ink/15 bg-white p-6">
          <p className="text-sm text-ink text-left sm:text-center">
            Not available at &ldquo;{query.trim()}&rdquo; yet — we&apos;re still growing our Zostel network.
          </p>
          <button type="button" onClick={scrollToProducts} className="pill-btn mt-4">
            order online instead
          </button>
        </div>
      ) : trimmedQuery ? (
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {results.map((location) => (
            <LocationCard key={location.id} location={location} wide />
          ))}
        </div>
      ) : (
        <>
          {/* Mobile: continuously-running marquee — the list is rendered
              twice back-to-back so the loop is seamless (translating
              exactly -50% of the doubled track lands back on the start).
              Swapped out entirely at sm rather than layered with the
              desktop row — a drag-to-scroll gesture on a track that's also
              auto-advancing fights the user. Only shown while browsing
              (no search term) — a filtered result set shouldn't auto-scroll
              away from what the user just searched for. */}
          <div
            className="mt-10 overflow-hidden sm:hidden"
            style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}
          >
            <div
              className="marquee-track flex w-max gap-4"
              style={{ animation: `marquee ${Math.max(12, locations.length * 6)}s linear infinite` }}
            >
              {[...locations, ...locations].map((location, index) => (
                <LocationCard key={`${location.id}-${index}`} location={location} />
              ))}
            </div>
          </div>

          {/* Desktop / tablet: normal manual horizontal scroll, width capped
              to ~3 cards so the rest are a deliberate scroll away rather
              than all laid out at once on wide screens. */}
          <div className="scrollbar-hide mx-auto mt-10 hidden max-w-[50rem] justify-start gap-4 overflow-x-auto pb-2 sm:flex">
            {locations.map((location) => (
              <LocationCard key={location.id} location={location} wide />
            ))}
          </div>
        </>
      )}

      <p className="mx-auto mt-6 max-w-md text-xs text-ink/50">
        Available at hostel reception — ask for &ldquo;feelz by mindcafé&rdquo;.{" "}
        <button type="button" onClick={scrollToProducts} className="font-semibold text-ink underline">
          Can&apos;t find it? Order online →
        </button>
      </p>
      </div>
    </section>
  );
}
