"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight, ConciergeBell, MapPin, Search, ShoppingBag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getActivePickupLocations } from "@/lib/api";
import type { PickupLocation } from "@/types/domain";

function scrollToProducts() {
  document.getElementById("mood-picks")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Prefers the client-verified maps_url (a Google Place ID link — exact,
// no ambiguity) over a plain address text-search, which can occasionally
// land on the wrong result in cities with more than one similarly-named
// place. Falls back to an address search only for a location that hasn't
// had a verified link added yet (see supabase/data-imports/
// pickup_location_maps_url_2026-08-04.sql).
function mapsUrl(location: PickupLocation): string {
  return location.maps_url ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
}

// Real property photography — eight of these are the actual Zostel-supplied
// photos from "Zostel Properties/" (resized to webp), Jaipur is the one
// exception still sourced from the client's reference creative. Keyed by a
// normalized substring of the real pickup_locations.name values, so a photo
// only ever shows on the location it actually depicts — any location
// without a confirmed name match falls back to a branded placeholder
// rather than a mismatched or generic hostel photo.
const LOCATION_PHOTOS: Record<string, string> = {
  manali: "/feelz-creative/zostel/manali.webp",
  goa: "/feelz-creative/zostel/goa.webp",
  jaipur: "/feelz-creative/zostel/jaipur.webp",
  mumbai: "/feelz-creative/zostel/mumbai.webp",
  gokarna: "/feelz-creative/zostel/gokarna.webp",
  dharamkot: "/feelz-creative/zostel/dharamkot.webp",
  mcleodganj: "/feelz-creative/zostel/mcleodganj.webp",
  gurgaon: "/feelz-creative/zostel/hq-gurgaon.webp",
  poombarai: "/feelz-creative/zostel/poombarai.webp",
};

function photoForLocation(location: PickupLocation): string | null {
  const normalized = location.name.toLowerCase().replace(/\s+/g, " ").trim();
  for (const [key, src] of Object.entries(LOCATION_PHOTOS)) {
    if (normalized.includes(key)) return src;
  }
  return null;
}

// Zostel's own orange (from its logo mark), used for this section only.
const ZOSTEL_ORANGE = "#F15A24";

function LocationCard({ location }: { location: PickupLocation }) {
  const photo = photoForLocation(location);
  // Primary action is "order here" (scan-and-order pre-scoped to this
  // Zostel via ?location=). Directions stay one tap away via the pin
  // button — a sibling of the Link, since an <a> can't contain another.
  return (
    <div className="zostel-card group relative w-[17rem] shrink-0 snap-start sm:w-[18.5rem]">
      <Link
        href={`/scan-order?location=${location.id}`}
        className="block h-full overflow-hidden rounded-2xl border border-ink/15 bg-white text-left text-ink shadow-[0_12px_30px_-18px_rgba(16,35,63,0.45)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_40px_-20px_rgba(16,35,63,0.5)]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#fbe7cf]">
          {photo ? (
            <Image
              src={photo}
              alt={`${location.name} property photo`}
              fill
              sizes="300px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Image src="/press/zostel-star.png" alt="" width={72} height={68} className="opacity-80" />
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="flex items-center gap-1.5 text-base font-bold leading-tight">
            <MapPin className="h-4 w-4 shrink-0" style={{ color: ZOSTEL_ORANGE }} fill={ZOSTEL_ORANGE} stroke="white" aria-hidden />
            {location.name}
          </p>
          <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-xs leading-relaxed text-ink/60">{location.address}</p>
          <span className="mt-3 inline-block rounded-full border border-ink/70 px-3 py-1 text-[11px] font-semibold">{location.city}</span>
        </div>
      </Link>
      <a
        href={mapsUrl(location)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${location.name} in Google Maps`}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-110"
      >
        <MapPin className="h-4 w-4" style={{ color: ZOSTEL_ORANGE }} aria-hidden />
      </a>
    </div>
  );
}

// --- Hand-drawn decorations (desktop only) -------------------------------

function MapPinMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className} aria-hidden>
      <path d="M12 31s10-11.2 10-18.5C22 6.2 17.5 2 12 2S2 6.2 2 12.5C2 19.8 12 31 12 31z" fill={ZOSTEL_ORANGE} />
      <circle cx="12" cy="12.5" r="4" fill="white" />
    </svg>
  );
}

function Signpost() {
  const planks = [
    { y: 34, label: "HOSTELS", rotate: -6, flip: false },
    { y: 92, label: "GOOD PEOPLE", rotate: 4, flip: true },
    { y: 150, label: "BIGGER STORIES", rotate: -3, flip: false },
  ];
  return (
    <svg viewBox="0 0 260 290" className="h-full w-full" aria-hidden>
      {/* palms behind */}
      <g fill="none" stroke="#3f5f2a" strokeWidth="5" strokeLinecap="round">
        <path d="M30 290 C 34 230, 40 190, 48 150" />
        <path d="M48 150 C 30 140, 14 142, 2 152" />
        <path d="M48 150 C 40 128, 26 118, 10 116" />
        <path d="M48 150 C 58 128, 74 120, 90 122" />
        <path d="M48 150 C 66 144, 80 150, 92 162" />
      </g>
      {/* post */}
      <rect x="118" y="20" width="16" height="262" rx="4" fill="#7a4a24" />
      <rect x="121" y="20" width="4" height="262" fill="#9a6235" />
      {/* planks */}
      {planks.map((plank) => (
        <g key={plank.label} transform={`rotate(${plank.rotate} 126 ${plank.y + 20})`}>
          <path
            d={
              plank.flip
                ? `M 34 ${plank.y} L 222 ${plank.y} L 222 ${plank.y + 40} L 34 ${plank.y + 40} L 14 ${plank.y + 20} Z`
                : `M 26 ${plank.y} L 214 ${plank.y} L 236 ${plank.y + 20} L 214 ${plank.y + 40} L 26 ${plank.y + 40} Z`
            }
            fill="#F7B53B"
            stroke="#B66D12"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <text x="124" y={plank.y + 27} textAnchor="middle" fontSize="17" fontWeight="900" fill="#3b2410" letterSpacing="0.5">
            {plank.label}
          </text>
        </g>
      ))}
      {/* grass */}
      <g fill="#5e8a35">
        <path d="M70 290 C 80 262, 92 252, 96 290 Z" />
        <path d="M150 290 C 160 256, 176 248, 182 290 Z" />
        <path d="M190 290 C 200 266, 214 262, 216 290 Z" />
      </g>
    </svg>
  );
}

function Mountains() {
  return (
    <svg viewBox="0 0 320 230" className="h-full w-full" aria-hidden>
      {/* sun */}
      <g className="zostel-sun" style={{ transformOrigin: "262px 44px" }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={262 + Math.cos(a) * 26}
              y1={44 + Math.sin(a) * 26}
              x2={262 + Math.cos(a) * 36}
              y2={44 + Math.sin(a) * 36}
              stroke="#F7B53B"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <circle cx="262" cy="44" r="19" fill="#F7B53B" />
      {/* birds */}
      <g className="zostel-birds" fill="none" stroke="#2b2522" strokeWidth="2.2" strokeLinecap="round">
        <path d="M150 52 q 6 -6 12 0 q 6 -6 12 0" />
        <path d="M184 70 q 4 -4 8 0 q 4 -4 8 0" />
      </g>
      {/* mountains */}
      <path d="M40 230 L 140 92 L 186 150 L 222 108 L 320 230 Z" fill="#3a332f" />
      <path d="M140 92 L 160 120 L 148 116 L 136 128 L 126 112 Z" fill="#f5efe6" />
      <path d="M222 108 L 236 128 L 226 126 L 216 134 Z" fill="#f5efe6" />
      <path d="M0 230 L 76 150 L 130 230 Z" fill="#5a504a" />
      {/* palm */}
      <g fill="none" stroke="#3f5f2a" strokeWidth="5" strokeLinecap="round">
        <path d="M300 230 C 296 196, 292 172, 286 146" />
        <path d="M286 146 C 300 136, 314 138, 320 146" />
        <path d="M286 146 C 270 134, 256 134, 244 142" />
        <path d="M286 146 C 288 128, 300 118, 314 116" />
      </g>
    </svg>
  );
}

// Real pickup points, not marketing copy — same pickup_locations table the
// takeaway step at checkout reads from, so this list can never drift from
// what's actually selectable there. Only active rows are fetched, so a
// search hit here is a genuine "yes, pick it up there".
//
// Zostel-styled: warm sunny backdrop, signpost + mountains illustrations
// joined by dashed travel routes with bobbing pins (.zostel-* in
// globals.css), a pill search that filters live, and a swipeable /
// arrow-scrolled row of property cards.
export function ZostelLocationsSection() {
  const locationsQuery = useQuery({
    queryKey: ["pickup-locations", "landing-section"],
    queryFn: () => getActivePickupLocations(createClient()),
  });
  const locations = locationsQuery.data ?? [];
  const [query, setQuery] = useState("");
  const rowRef = useRef<HTMLDivElement | null>(null);

  function scrollRow(direction: "left" | "right") {
    rowRef.current?.scrollBy({ left: direction === "left" ? -320 : 320, behavior: "smooth" });
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    rowRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const trimmedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!trimmedQuery) return locations;
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(trimmedQuery) || location.city.toLowerCase().includes(trimmedQuery),
    );
  }, [locations, trimmedQuery]);

  return (
    <section id="zostel-locations" className="relative isolate overflow-hidden bg-[#fdf3e3]">
      {/* Warm light + soft paper glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,214,150,0.55),transparent_60%)]" aria-hidden />

      {/* Decorations + routes (desktop) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[26rem] lg:block" aria-hidden>
        <div className="absolute left-[2%] top-10 h-[17rem] w-[15rem] xl:left-[4%]">
          <Signpost />
        </div>
        <div className="absolute right-[1%] top-2 h-[15rem] w-[21rem] xl:right-[3%]">
          <Mountains />
        </div>
        <svg viewBox="0 0 1440 420" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path
            d="M 250 150 C 300 110, 340 120, 380 160"
            fill="none"
            stroke={ZOSTEL_ORANGE}
            strokeWidth="2.5"
            strokeDasharray="8 9"
            strokeLinecap="round"
            className="zostel-route"
          />
          <path
            d="M 1010 300 C 1090 300, 1120 230, 1190 250 S 1260 210, 1300 180"
            fill="none"
            stroke={ZOSTEL_ORANGE}
            strokeWidth="2.5"
            strokeDasharray="8 9"
            strokeLinecap="round"
            className="zostel-route"
          />
        </svg>
        <MapPinMark className="zostel-pin absolute left-[25.5%] top-[17%] h-8 w-6" />
        <MapPinMark className="zostel-pin zostel-pin-alt absolute right-[8.5%] top-[36%] h-8 w-6" />
      </div>

      <div className="relative mx-auto w-full min-w-0 max-w-[96rem] px-4 py-14 text-center sm:px-6 sm:py-16">
        {/* Zostel logo */}
        <div className="flex items-center justify-center gap-2.5">
          <Image src="/press/zostel-star.png" alt="" width={30} height={28} />
          <span className="text-lg font-semibold tracking-[0.45em] text-[#2b2522]">ZOSTEL</span>
        </div>

        <h2 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-[#1f1a17] sm:text-5xl lg:text-6xl">
          <span className="relative inline-block px-3">
            <span className="absolute inset-x-0 bottom-[0.06em] top-[0.12em] -z-10 -rotate-2 rounded-[0.4em_0.2em_0.5em_0.25em] bg-[#F7C948]" aria-hidden />
            FEELZ
          </span>{" "}
          is on{" "}
          <span className="relative inline-block" style={{ color: ZOSTEL_ORANGE }}>
            your route
            {/* little sparkle strokes */}
            <svg viewBox="0 0 40 40" className="absolute -right-8 -top-5 h-8 w-8" aria-hidden>
              <g stroke={ZOSTEL_ORANGE} strokeWidth="4" strokeLinecap="round">
                <line x1="8" y1="30" x2="16" y2="18" />
                <line x1="20" y1="32" x2="32" y2="26" />
                <line x1="14" y1="14" x2="18" y2="4" />
              </g>
            </svg>
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base font-medium text-[#3a332f] sm:text-lg">
          Forgot to pack your Feelz? Find it at Zostel.
        </p>

        <form onSubmit={handleSearch} className="relative mx-auto mt-7 flex max-w-lg items-center rounded-full border border-ink/10 bg-white p-1.5 pl-5 shadow-[0_14px_30px_-18px_rgba(16,35,63,0.5)]">
          <Search className="h-5 w-5 shrink-0 text-ink/40" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your city or Zostel…"
            aria-label="Search your city or Zostel"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/40 sm:text-base"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="mr-2 text-ink/40 hover:text-ink">
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
          <button
            type="submit"
            aria-label="Search"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:scale-105"
            style={{ backgroundColor: ZOSTEL_ORANGE }}
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </form>

        <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#3a332f] sm:text-sm">
          <span className="flex items-center gap-1.5">
            <ConciergeBell className="h-4 w-4" style={{ color: ZOSTEL_ORANGE }} aria-hidden />
            Built with Zostel
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" style={{ color: ZOSTEL_ORANGE }} aria-hidden />
            Ask at reception
          </span>
          <button type="button" onClick={scrollToProducts} className="flex items-center gap-1.5 hover:underline">
            <ShoppingBag className="h-4 w-4" style={{ color: ZOSTEL_ORANGE }} aria-hidden />
            Order online
          </button>
        </div>

        {locationsQuery.isLoading ? (
          <p className="mt-12 text-sm text-ink/60">Loading pickup points…</p>
        ) : locations.length === 0 ? (
          <p className="mt-12 text-sm text-ink/60">No pickup points listed yet. Check back soon.</p>
        ) : trimmedQuery && results.length === 0 ? (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-ink/15 bg-white p-6">
            <p className="text-sm text-ink">
              Not available at &ldquo;{query.trim()}&rdquo; yet. We&apos;re still growing our Zostel network.
            </p>
            <button type="button" onClick={scrollToProducts} className="pill-btn mt-4">
              Order Online Instead
            </button>
          </div>
        ) : (
          <div className="relative mx-auto mt-12 max-w-[92rem]">
            {results.length > 1 && (
              <button
                type="button"
                onClick={() => scrollRow("left")}
                aria-label="Scroll locations left"
                className="absolute -left-1 top-[38%] z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white text-ink shadow-md transition hover:scale-105 sm:flex"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
            )}
            <div
              ref={rowRef}
              className={`scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-4 pt-1 ${
                results.length < 5 ? "lg:justify-center" : ""
              }`}
            >
              {results.map((location, index) => (
                <div key={location.id} className="zostel-card-in" style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}>
                  <LocationCard location={location} />
                </div>
              ))}
            </div>
            {results.length > 1 && (
              <button
                type="button"
                onClick={() => scrollRow("right")}
                aria-label="Scroll locations right"
                className="absolute -right-1 top-[38%] z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white text-ink shadow-md transition hover:scale-105 sm:flex"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            )}
          </div>
        )}

        <p className="mx-auto mt-6 max-w-md text-xs text-ink/55">
          Available at hostel reception: ask for &ldquo;Feelz by mindcafe&rdquo;.{" "}
          <button type="button" onClick={scrollToProducts} className="font-semibold text-ink underline">
            Can&apos;t find it? Order online →
          </button>
        </p>
      </div>
    </section>
  );
}
