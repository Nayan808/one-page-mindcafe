import { Reveal } from "@/components/Reveal";

// "Built for modern India" use-case grid — sits right after the Feelz
// product teaser. Deliberately not another photo-card grid: the Feelz
// teaser and the counselling experts section right after this one both
// already use that pattern, so this one is a plain icon + text tile
// instead, for visual variety within the same cream/ink theme (rounded
// corners, border-ink/10, hover-lift, Reveal scroll-in) as everything
// else on the page.
const USE_CASES = [
  {
    emoji: "✈️",
    title: "travelling India",
    body: "Stay fresh, focused, and balanced through long journeys, changing schedules, and life on the move.",
  },
  {
    emoji: "💻",
    title: "remote work",
    body: "Stay clear and productive when your workspace changes every day.",
  },
  {
    emoji: "📱",
    title: "digital overload",
    body: "Reset when screens, notifications, and constant input drain your energy.",
  },
  {
    emoji: "🤝",
    title: "social ease",
    body: "Feel more comfortable meeting new people, speaking up, and entering new spaces.",
  },
  {
    emoji: "🌙",
    title: "better sleep",
    body: "Unwind after long days, calm the mind, and wake up feeling restored.",
  },
];

export function UseCasesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">built for modern india</p>
        <h2 className="font-display mt-2 text-4xl font-bold tracking-tight lowercase text-ink sm:text-5xl">
          for every moment your brain needs support
        </h2>
      </Reveal>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {USE_CASES.map((item, index) => (
          <Reveal key={item.title} delayMs={index * 70}>
            <div className="flex h-full flex-col items-center rounded-3xl border border-ink/10 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-2xl" aria-hidden>
                {item.emoji}
              </span>
              <h3 className="font-display mt-4 text-sm font-bold lowercase text-ink">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink/60">{item.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
