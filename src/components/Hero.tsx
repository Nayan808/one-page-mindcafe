"use client";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const FLOATING_BADGES = [
  { label: "focus", gradient: "linear-gradient(135deg, #1fb894, #2461e0)", className: "left-[6%] top-[18%] -rotate-6" },
  { label: "extrovert", gradient: "linear-gradient(135deg, #f0405f, #ff8a3d)", className: "right-[6%] top-[10%] rotate-6" },
  { label: "joy", gradient: "linear-gradient(135deg, #ff9d2e, #ffd23c)", className: "left-[8%] bottom-[14%] -rotate-3" },
  { label: "rest", gradient: "linear-gradient(135deg, #5b3df0, #8f6bff)", className: "right-[7%] bottom-[18%] rotate-3" },
];

export function Hero() {
  return (
    <section
      className="relative mx-3 mt-3 overflow-hidden rounded-[2rem] px-4 py-16 text-center text-cream sm:mx-6 sm:mt-6 sm:py-24"
      style={{ background: "linear-gradient(135deg, #2f6fe0 0%, #17b88b 100%)" }}
    >
      {FLOATING_BADGES.map((badge) => (
        <span
          key={badge.label}
          className={`pointer-events-none absolute hidden rounded-full px-4 py-2 text-xs font-bold uppercase tracking-label text-ink shadow-lg md:inline-block ${badge.className}`}
          style={{ background: badge.gradient, color: "#fff" }}
        >
          {badge.label}
        </span>
      ))}

      <span className="badge-pill mx-auto mb-6 inline-block border-cream/30 bg-white/10 text-cream/80">
        incubated at zo world · distributed by zostel
      </span>

      <h1 className="font-display text-6xl font-bold leading-none tracking-tight sm:text-8xl">feelz</h1>
      <p className="font-tagline mt-1 text-xl text-cream/80 sm:text-2xl">by mindcafé</p>

      <p className="font-tagline mx-auto mt-6 max-w-xl text-lg text-cream/90 sm:text-xl">
        a paper-thin strip. sixty seconds on the tongue. four moods, on demand.
      </p>

      <button onClick={() => scrollTo("products")} className="pill-btn-white mt-8">
        shop feelz ↓
      </button>

      <div className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-2">
        {["fssai ✓", "no sugar", "no water needed", "made in india"].map((tag) => (
          <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-label text-cream/80">
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}
