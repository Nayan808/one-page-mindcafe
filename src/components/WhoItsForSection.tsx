import Image from "next/image";

type MoodKey = "focus" | "extrovert" | "joy" | "rest";

const MOOD_IMAGE: Record<MoodKey, string> = {
  focus: "/products/focus.png",
  extrovert: "/products/extrovert.png",
  joy: "/products/joy.png",
  rest: "/products/rest.png",
};

const PERSONAS: { title: string; tagline: string; description: string; moods: MoodKey[]; wide?: boolean; tilt: string }[] = [
  {
    title: "the traveller",
    tagline: "pocket-sized, zostel-approved",
    description:
      "Hopping between hostels, cities, and time zones. feelz travels light — no water, no fuss, fits in any pocket. first stocked at every Zostel in India.",
    moods: ["rest", "focus"],
    wide: true,
    tilt: "rotate-6",
  },
  {
    title: "the student",
    tagline: "exam-season survival kit",
    description: "Exam season, long study nights, social pressure. feelz supports the mind through the demands without sedating it.",
    moods: ["focus", "joy"],
    tilt: "-rotate-6",
  },
  {
    title: "the remote worker",
    tagline: "focus, minus the office",
    description: "Working from home or cafés. When your environment isn't built for focus, feelz helps you create it internally.",
    moods: ["focus"],
    tilt: "rotate-3",
  },
  {
    title: "the night owl",
    tagline: "for the 2am scroll",
    description: "Can't switch off at midnight. rest strips with melatonin and l-theanine help you wind down naturally — wake up actually rested.",
    moods: ["rest"],
    wide: true,
    tilt: "-rotate-6",
  },
  {
    title: "the overthinker",
    tagline: "quiet the noise",
    description: "Social situations, new places, unfamiliar people. joy and extrovert are built exactly for these moments of overload.",
    moods: ["extrovert", "joy"],
    wide: true,
    tilt: "rotate-6",
  },
  {
    title: "the professional",
    tagline: "calm under deadline",
    description: "Back-to-back meetings, tight deadlines, constant noise. focus when it matters, rest when you need to switch off.",
    moods: ["focus", "rest"],
    tilt: "-rotate-3",
  },
];

export function WhoItsForSection() {
  return (
    <section id="who-its-for" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div className="mx-auto flex w-fit items-center gap-3">
          <span className="h-px w-10 bg-ink/20" aria-hidden />
          <span className="h-1.5 w-1.5 rounded-full bg-ink/40" aria-hidden />
          <span className="h-px w-10 bg-ink/20" aria-hidden />
        </div>
        <h2 className="font-display mt-4 text-2xl font-bold uppercase tracking-[0.3em] text-ink sm:text-3xl">
          — who it&apos;s for —
        </h2>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAS.map((persona, index) => {
          const primaryMood = persona.moods[0];
          return (
            <div
              key={persona.title}
              className={`relative flex flex-col overflow-hidden rounded-[1.75rem] border border-ink bg-white p-6 text-ink shadow-lg sm:p-7 ${persona.wide ? "lg:col-span-2" : ""}`}
            >
              <div
                className={`pointer-events-none absolute -right-4 -top-6 h-32 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-ink shadow-2xl sm:-right-3 sm:h-40 sm:w-32 ${persona.tilt}`}
                aria-hidden
              >
                <Image
                  src={MOOD_IMAGE[primaryMood]}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>

              <div className="relative max-w-[70%] sm:max-w-[65%]">
                <span className="text-[11px] font-semibold uppercase tracking-label opacity-80">
                  who it&apos;s for · 0{index + 1}
                </span>

                <h3 className="font-display mt-3 text-3xl font-bold lowercase leading-none sm:text-4xl">
                  {persona.title}
                </h3>
                <p className="font-tagline mt-1.5 text-base italic opacity-90">{persona.tagline}</p>

                <p className={`mt-4 text-sm leading-relaxed opacity-90 ${persona.wide ? "sm:max-w-md" : ""}`}>
                  {persona.description}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-1.5">
                  {persona.moods.map((mood) => (
                    <span
                      key={mood}
                      className="rounded-full border border-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-label"
                    >
                      {mood}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
