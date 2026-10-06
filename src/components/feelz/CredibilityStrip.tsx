import Image from "next/image";

// Rebuilt to match the client's reference creative (public/feelz-creative/
// 05-feelz-credibility-strap.webp) structurally — real icon illustrations
// cropped from that same creative (public/feelz-creative/credibility/),
// and real copy/labels typed out rather than left baked into a flat image,
// so they stay selectable/accessible. The soft wave artwork above and
// below the content strip is also cropped straight from the reference (no
// text or icons baked into those bands, so it's safe to reuse as pure
// background texture).
//
// Continuously running marquee — same mechanism ZostelLocationsSection's
// mobile card strip uses (track duplicated back-to-back, translate exactly
// -50% loops seamlessly), since a one-off static row doesn't loop forever
// on request.
const ITEMS: { icon: string; label: string }[] = [
  { icon: "/feelz-creative/credibility/ayurveda.webp", label: "Ayurveda-Inspired" },
  { icon: "/feelz-creative/credibility/formulation.webp", label: "Modern Formulation" },
  { icon: "/feelz-creative/credibility/mobility.webp", label: "Built for Life on the Move" },
  { icon: "/feelz-creative/credibility/melt-v2.webp", label: "Melt-in-Mouth" },
  { icon: "/feelz-creative/credibility/wellness.webp", label: "Everyday Mental Wellness" },
  { icon: "/feelz-creative/credibility/zostel-backpack.webp", label: "Built with Zostel" },
];

function TrackContent({ keyPrefix }: { keyPrefix: string }) {
  return (
    <div className="flex shrink-0 items-center gap-8 sm:gap-11">
      <div className="flex shrink-0 items-center gap-3.5">
        <span className="font-tagline text-2xl italic text-feelz-ink">Feelz</span>
        <span className="text-feelz-ink/30">×</span>
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
          <Image src="/press/zostel.png" alt="" fill className="object-cover" />
        </span>
        <span className="text-sm font-bold uppercase tracking-[0.25em] text-feelz-ink">Zostel</span>
      </div>

      <span className="h-16 w-px shrink-0 bg-feelz-ink/10" aria-hidden />

      {ITEMS.map((item, index) => (
        <div key={`${keyPrefix}-${item.label}`} className="flex shrink-0 items-center gap-3.5">
          <span className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
            <Image src={item.icon} alt="" fill sizes="96px" className="object-contain" />
          </span>
          <span className="max-w-[8.5rem] text-sm font-bold uppercase leading-tight tracking-[0.08em] text-feelz-ink sm:text-base">
            {item.label}
          </span>
          {index < ITEMS.length - 1 && <span className="ml-5 h-16 w-px shrink-0 bg-feelz-ink/10 sm:ml-7" aria-hidden />}
        </div>
      ))}
    </div>
  );
}

export function CredibilityStrip() {
  return (
    <div className="relative overflow-hidden bg-feelz-cream">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-80 sm:h-28" aria-hidden>
        <Image src="/feelz-creative/credibility/wave-top.webp" alt="" fill className="object-cover object-bottom" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 opacity-80 sm:h-28" aria-hidden>
        <Image src="/feelz-creative/credibility/wave-bottom.webp" alt="" fill className="object-cover object-top" />
      </div>

      <div
        className="relative z-10 overflow-hidden border-y border-feelz-ink/10 bg-feelz-paper/90 py-9 backdrop-blur-sm"
        style={{ maskImage: "linear-gradient(to right, transparent, black 4%, black 96%, transparent)" }}
      >
        <div className="marquee-track flex w-max items-center gap-12 sm:gap-16" style={{ animation: "marquee 32s linear infinite" }}>
          <TrackContent keyPrefix="a" />
          <TrackContent keyPrefix="b" />
        </div>
      </div>
    </div>
  );
}
