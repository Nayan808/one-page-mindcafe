"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getActivePickupLocations } from "@/lib/api";

const POUCH_MOODS = [
  { label: "focus", gradient: "linear-gradient(160deg, #2461e0, #14b3a0)" },
  { label: "extro", gradient: "linear-gradient(160deg, #f0405f, #ff8a3d)" },
  { label: "joy", gradient: "linear-gradient(160deg, #ff9d2e, #ffd23c)" },
  { label: "rest", gradient: "linear-gradient(160deg, #5b3df0, #8f6bff)" },
];

function scrollToCheckoutTakeaway() {
  document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Real pickup points, not marketing copy — same pickup_locations table the
// takeaway step in checkout reads from, so the count/cities here can never
// drift from what's actually selectable at checkout.
export function ZostelNetworkSection() {
  const locationsQuery = useQuery({
    queryKey: ["pickup-locations", "network-section"],
    queryFn: () => getActivePickupLocations(createClient()),
  });
  const locations = locationsQuery.data ?? [];
  const cities = Array.from(new Set(locations.map((l) => l.city)));

  return (
    <section
      id="zostel"
      className="relative mx-3 my-3 overflow-hidden rounded-[2rem] px-6 py-16 text-cream sm:mx-6 sm:my-6 sm:px-12"
      style={{
        background:
          "radial-gradient(circle at 15% 20%, rgba(47,159,143,0.35), transparent 45%), radial-gradient(circle at 85% 30%, rgba(240,64,95,0.3), transparent 45%), radial-gradient(circle at 60% 90%, rgba(91,61,240,0.35), transparent 45%), #0c0c0c",
      }}
    >
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-label text-cream/60">the network</span>
          <h2 className="font-display mt-2 text-4xl font-bold leading-[1.05] sm:text-5xl">
            find feelz
            <br />
            at any zostel.
          </h2>
          <p className="font-tagline mt-4 max-w-md text-lg italic text-cream/80">
            {cities.length > 0
              ? `${cities.join(", ")} — pick up a pack at the front desk of any listed Zostel.`
              : "pick up a pack at the front desk of any listed Zostel."}
          </p>

          <div className="mt-6 flex gap-8">
            <div>
              <p className="font-display text-3xl font-bold">{locations.length}</p>
              <p className="text-[11px] uppercase tracking-label text-cream/60">stocked now</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold">{cities.length}</p>
              <p className="text-[11px] uppercase tracking-label text-cream/60">cities</p>
            </div>
          </div>

          <button onClick={scrollToCheckoutTakeaway} className="pill-btn-white mt-8">
            📍 pick up at a zostel
          </button>
        </div>

        <div className="flex justify-center gap-3 sm:justify-end">
          {POUCH_MOODS.map((pouch, i) => (
            <div
              key={pouch.label}
              className="flex h-40 w-16 shrink-0 flex-col items-center justify-end gap-1 rounded-xl border border-white/20 pb-3 shadow-xl sm:h-48 sm:w-20"
              style={{ background: pouch.gradient, transform: `rotate(${(i - 1.5) * 6}deg)` }}
            >
              <span className="text-[9px] font-semibold uppercase text-white/80">feelz</span>
              <span className="text-xs font-bold lowercase text-white">{pouch.label}</span>
            </div>
          ))}
        </div>
      </div>

      {locations.length > 0 && (
        <ul className="mt-10 flex flex-wrap gap-2">
          {locations.map((location) => (
            <li key={location.id} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-cream/80">
              {location.name} · {location.city}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
