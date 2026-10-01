// Immediately below the hero carousel — a continuously-running marquee,
// same mechanism ZostelLocationsSection's mobile card strip already uses
// (track duplicated back-to-back, translate exactly -50% loops seamlessly).
const MESSAGE = "Rooted in tradition · Modern formulation · Melt-in-mouth strips · Built with Zostel · Made for your everyday moments";

export function CredibilityStrip() {
  return (
    <div
      className="overflow-hidden border-y border-feelz-ink/10 bg-feelz-paper py-3"
      style={{ maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)" }}
    >
      <div className="marquee-track flex w-max gap-10" style={{ animation: "marquee 26s linear infinite" }}>
        {[0, 1].map((i) => (
          <span
            key={i}
            className="shrink-0 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-feelz-ink/50"
          >
            {MESSAGE}
          </span>
        ))}
      </div>
    </div>
  );
}
