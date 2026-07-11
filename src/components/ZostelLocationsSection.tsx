"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getActivePickupLocations } from "@/lib/api";
import { MOOD_STYLES } from "@/lib/moodStyles";
import type { PickupLocation } from "@/types/domain";

const CARD_STYLES = [
  { gradient: MOOD_STYLES.focus.gradient, text: "#f6f1e6" },
  { gradient: MOOD_STYLES.extrovert.gradient, text: "#111110" },
  { gradient: MOOD_STYLES.joy.gradient, text: "#111110" },
  { gradient: MOOD_STYLES.rest.gradient, text: "#f6f1e6" },
];

function scrollToProducts() {
  document.getElementById("mood-picks")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LocationCard({ location, index, wide }: { location: PickupLocation; index: number; wide?: boolean }) {
  const style = CARD_STYLES[index % CARD_STYLES.length];
  return (
    <div
      className={`shrink-0 rounded-2xl p-4 text-left shadow-lg ${wide ? "w-64" : "w-56"}`}
      style={{ background: style.gradient, color: style.text }}
    >
      <p className="font-display text-base font-bold">{location.name}</p>
      <p className="mt-1.5 flex items-start gap-1.5 text-xs opacity-80">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        {location.address}
      </p>
      <span className="mt-3 inline-block rounded-full bg-black/15 px-3 py-1 text-[11px] font-medium backdrop-blur">
        {location.city}
      </span>
    </div>
  );
}

// Real pickup points, not marketing copy — same pickup_locations table the
// takeaway step at checkout reads from, so this list can never drift from
// what's actually selectable there. Add a row to that table and it shows
// up here automatically.
export function ZostelLocationsSection() {
  const locationsQuery = useQuery({
    queryKey: ["pickup-locations", "landing-section"],
    queryFn: () => getActivePickupLocations(createClient()),
  });
  const locations = locationsQuery.data ?? [];

  return (
    <section id="zostel-locations" className="mx-auto w-full min-w-0 max-w-6xl px-4 py-16 text-center sm:px-6">
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
        Pick up a pack at the reception of any of these Zostel properties — no order, no wait. Not near one? Order
        online and we'll deliver, or reserve a pack for pickup at checkout.
      </p>

      {locationsQuery.isLoading ? (
        <p className="mt-10 text-sm text-ink/60">Loading pickup points…</p>
      ) : locations.length === 0 ? (
        <p className="mt-10 text-sm text-ink/60">No pickup points listed yet — check back soon.</p>
      ) : (
        <>
          {/* Mobile: continuously-running marquee — the list is rendered
              twice back-to-back so the loop is seamless (translating
              exactly -50% of the doubled track lands back on the start).
              Swapped out entirely at sm rather than layered with the
              desktop row — a drag-to-scroll gesture on a track that's also
              auto-advancing fights the user. */}
          <div
            className="mt-10 overflow-hidden sm:hidden"
            style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}
          >
            <div
              className="marquee-track flex w-max gap-4"
              style={{ animation: `marquee ${Math.max(12, locations.length * 6)}s linear infinite` }}
            >
              {[...locations, ...locations].map((location, index) => (
                <LocationCard key={`${location.id}-${index}`} location={location} index={index} />
              ))}
            </div>
          </div>

          {/* Desktop / tablet: normal manual horizontal scroll. */}
          <div className="scrollbar-hide mt-10 hidden justify-center gap-4 overflow-x-auto pb-2 sm:flex">
            {locations.map((location, index) => (
              <LocationCard key={location.id} location={location} index={index} wide />
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
    </section>
  );
}
