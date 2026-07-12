import Image from "next/image";

const STEPS = [
  { title: "The Box", description: "Sleek. Pocket-ready. Always within reach.", src: "/how-it-works/step-1.webp" },
  { title: "Open Box", description: "Open and take out a strip with ease.", src: "/how-it-works/step-2.webp" },
  {
    title: "The Strip",
    description: "Tear the inner packaging, take out the ultra-thin, fast-dissolving strip — designed for real life.",
    src: "/how-it-works/step-3.webp",
  },
  {
    title: "On Your Tongue",
    description: "Place the strip on your tongue. Let it dissolve. No water. No tablets. Just pure support.",
    src: "/how-it-works/step-4.webp",
  },
  { title: "Anywhere You Go", description: "From pocket to peace of mind.", src: "/how-it-works/step-5.webp" },
];

// A connected step-path rather than a plain photo-card grid — the
// through-line (vertical on mobile, horizontal on desktop) reinforces that
// this is a sequence, not just five unrelated tiles. Circular photo nodes
// + ghost numerals keep it on-theme with the rest of the site's visual
// language (cream/ink, numbered "0X" labels) instead of a generic gallery.
export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div className="mx-auto flex w-fit items-center gap-3">
          <span className="h-px w-10 bg-ink/20" aria-hidden />
          <span className="h-1.5 w-1.5 rounded-full bg-ink/40" aria-hidden />
          <span className="h-px w-10 bg-ink/20" aria-hidden />
        </div>
        <h2 className="font-display mt-4 text-2xl font-bold uppercase tracking-[0.3em] text-ink sm:text-3xl">
          — how it works —
        </h2>
      </div>

      <div className="relative mt-16 sm:mt-20">
        {/* Vertical line (mobile) */}
        <div className="absolute bottom-6 left-8 top-6 w-px bg-ink/15 sm:hidden" aria-hidden />
        {/* Horizontal line (desktop) — spans between the first and last node centers */}
        <div
          className="absolute top-8 hidden h-px bg-ink/15 sm:block"
          style={{ left: "10%", right: "10%" }}
          aria-hidden
        />

        <div className="relative flex flex-col gap-10 sm:flex-row sm:justify-between sm:gap-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative flex items-start gap-5 sm:flex-1 sm:flex-col sm:items-center sm:text-center">
              <span
                className="font-display pointer-events-none absolute -top-3 left-1/2 hidden -translate-x-1/2 select-none text-6xl font-bold text-ink/[0.06] sm:block"
                aria-hidden
              >
                0{index + 1}
              </span>

              <div className="relative shrink-0">
                <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-ink bg-white shadow-sm sm:h-20 sm:w-20">
                  <Image src={step.src} alt={step.title} fill sizes="80px" className="object-cover" />
                </div>
                <span className="font-display absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-cream bg-ink text-[11px] font-bold text-cream">
                  {index + 1}
                </span>
              </div>

              <div className="relative pt-1 sm:mt-4 sm:pt-0">
                <h3 className="font-display text-base font-bold text-ink sm:text-lg">{step.title}</h3>
                <p className="mt-1 max-w-[16rem] text-xs leading-snug text-ink/60 sm:mx-auto sm:text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
