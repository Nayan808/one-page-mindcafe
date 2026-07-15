import { Reveal } from "@/components/Reveal";

// "Built for modern India" use-case list — sits right after the Feelz
// product teaser. Deliberately NOT another icon-in-a-circle card grid:
// that reads as generic template filler, and the Feelz teaser plus the
// counselling experts section right after this one already cover the
// "photo card grid" pattern. This is a numbered editorial list instead —
// large faint index numerals, a divider between rows, no icons — a
// different visual language while staying in the same cream/ink theme
// (font-display, border-ink/10, Reveal scroll-in).
const USE_CASES = [
  {
    title: "travelling India",
    body: "Stay fresh, focused, and balanced through long journeys, changing schedules, and life on the move.",
  },
  {
    title: "remote work",
    body: "Stay clear and productive when your workspace changes every day.",
  },
  {
    title: "digital overload",
    body: "Reset when screens, notifications, and constant input drain your energy.",
  },
  {
    title: "social ease",
    body: "Feel more comfortable meeting new people, speaking up, and entering new spaces.",
  },
  {
    title: "better sleep",
    body: "Unwind after long days, calm the mind, and wake up feeling restored.",
  },
];

export function UseCasesSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <Reveal className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">built for modern india</p>
        <h2 className="font-display mt-2 text-4xl font-bold tracking-tight lowercase text-ink sm:text-5xl">
          for every moment your brain needs support
        </h2>
      </Reveal>

      <div className="mt-14 divide-y divide-ink/10 border-t border-ink/10">
        {USE_CASES.map((item, index) => (
          <Reveal key={item.title} delayMs={index * 70}>
            <div className="group grid grid-cols-[3rem_1fr] items-baseline gap-x-6 py-7 transition-colors duration-300 hover:bg-ink/[0.02] sm:grid-cols-[4.5rem_16rem_1fr] sm:items-center sm:gap-x-10 sm:px-4">
              <span className="font-display text-3xl font-bold text-ink/15 transition-colors duration-300 group-hover:text-ink/30 sm:text-4xl">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-lg font-bold lowercase text-ink sm:text-xl">{item.title}</h3>
              <p className="col-span-2 mt-2 text-sm leading-relaxed text-ink/60 sm:col-span-1 sm:mt-0">{item.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
