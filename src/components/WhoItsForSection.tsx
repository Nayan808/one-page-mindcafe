import Image from "next/image";
import { Reveal } from "@/components/Reveal";

type MoodKey = "focus" | "extrovert" | "joy" | "rest";

const MOOD_IMAGE: Record<MoodKey, string> = {
  focus: "/products/focus.png",
  extrovert: "/products/extrovert.png",
  joy: "/products/joy.png",
  rest: "/products/rest.png",
};

const PERSONAS: { title: string; tagline: string; description: string; moods: MoodKey[]; wide?: boolean; tilt: string; zostel?: boolean }[] = [
  {
    title: "The traveller",
    tagline: "Pocket-sized, Zostel-approved",
    description:
      "Hopping between hostels, cities, and time zones. Feelz travels light, no water, no fuss, fits in any pocket. First stocked at every Zostel in India.",
    moods: ["rest", "focus"],
    wide: true,
    tilt: "rotate-6",
    zostel: true,
  },
  {
    title: "The student",
    tagline: "Exam-season survival kit",
    description: "Exam season, long study nights, social pressure. Feelz supports the mind through the demands without sedating it.",
    moods: ["focus", "joy"],
    tilt: "-rotate-6",
  },
  {
    title: "The remote worker",
    tagline: "Focus, minus the office",
    description: "Working from home or cafés. When your environment isn't built for focus, Feelz helps you create it internally.",
    moods: ["focus"],
    tilt: "rotate-3",
  },
  {
    title: "The night owl",
    tagline: "For the 2am scroll",
    description: "Can't switch off at midnight. Rest strips with melatonin and L-Theanine help you wind down naturally; wake up actually rested.",
    moods: ["rest"],
    wide: true,
    tilt: "-rotate-6",
  },
  {
    title: "The overthinker",
    tagline: "Quiet the noise",
    description: "Social situations, new places, unfamiliar people. Joy and Extrovert are built exactly for these moments of overload.",
    moods: ["extrovert", "joy"],
    wide: true,
    tilt: "rotate-6",
  },
  {
    title: "The professional",
    tagline: "Calm under deadline",
    description: "Back-to-back meetings, tight deadlines, constant noise. Focus when it matters, rest when you need to switch off.",
    moods: ["focus", "rest"],
    tilt: "-rotate-3",
  },
];

export function WhoItsForSection() {
  return (
    <section id="who-its-for" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div className="mx-auto flex w-fit items-center gap-3">
          <span className="h-px w-10 bg-ink/20" aria-hidden />
          <span className="h-1.5 w-1.5 rounded-full bg-ink/40" aria-hidden />
          <span className="h-px w-10 bg-ink/20" aria-hidden />
        </div>
        <h2 className="font-display mt-4 text-3xl font-bold uppercase tracking-[0.3em] text-ink sm:text-4xl">
          Who Is It For
        </h2>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAS.map((persona, index) => {
          const primaryMood = persona.moods[0];
          return (
            <Reveal key={persona.title} delayMs={index * 70} className={persona.wide ? "lg:col-span-2" : ""}>
              <div
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-ink/15 bg-white p-6 text-ink shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl sm:p-7"
              >
                <div
                  className={`pointer-events-none absolute -right-3 -top-5 h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-lg transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-24 ${persona.tilt}`}
                  aria-hidden
                >
                  <Image
                    src={MOOD_IMAGE[primaryMood]}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>

                <div className="relative max-w-[68%] sm:max-w-[62%]">
                  <span className="text-[11px] font-semibold uppercase tracking-label text-brand/80">
                    Who It&apos;s For · 0{index + 1}
                  </span>

                  <h3 className="font-display mt-3 text-2xl font-bold leading-tight sm:text-3xl">
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
                        className="rounded-full border border-brand/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-label text-brand"
                      >
                        {mood}
                      </span>
                    ))}
                    {persona.zostel && (
                      <span className="flex items-center gap-1.5 rounded-full border border-brand/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-label text-brand">
                        <span className="relative h-4 w-4 overflow-hidden rounded-full">
                          <Image src="/press/zostel.png" alt="" fill className="object-cover" />
                        </span>
                        Zostel
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      </div>
    </section>
  );
}
