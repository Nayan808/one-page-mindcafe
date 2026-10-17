import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { MOOD_STYLES, FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";

type MoodKey = "focus" | "extrovert" | "joy" | "rest";

// Real, current packaging — tight 3:4 crops of each pack's front from the
// client's product photography (public/feelz-creative/products/*), so
// colours and artwork are exact. (The older /products/*.png renders show
// a retired black pack design.)
const PACK_IMAGE: Record<MoodKey, string> = {
  focus: "/feelz-creative/packs/focus.webp",
  extrovert: "/feelz-creative/packs/extrovert.webp",
  joy: "/feelz-creative/packs/joy.webp",
  rest: "/feelz-creative/packs/rest.webp",
};

// Each persona gets a scene that sets its mood (study desk, laptop,
// mountains, a dusk bedroom…) with its real packs fanned over the corner.
// `focus` is the object-position that keeps the subject in frame.
const PERSONAS: {
  title: string;
  tagline: string;
  description: string;
  moods: MoodKey[];
  scene: string;
  focus: string;
  wide?: boolean;
  zostel?: boolean;
  /** The scene photo already features the pack — skip the fanned tiles. */
  packInScene?: boolean;
}[] = [
  {
    title: "The traveller",
    tagline: "Pocket-sized, Zostel-approved",
    description:
      "Hopping between hostels, cities, and time zones. Feelz travels light, no water, no fuss, fits in any pocket. First stocked at every Zostel in India.",
    moods: ["rest", "focus"],
    scene: "/feelz-creative/moments/focus-travelling-v3.webp",
    focus: "45% 35%",
    wide: true,
    zostel: true,
  },
  {
    title: "The student",
    tagline: "Exam-season survival kit",
    description: "Exam season, long study nights, social pressure. Feelz supports the mind through the demands without sedating it.",
    moods: ["focus", "joy"],
    scene: "/feelz-creative/moments/focus-studying-v3.webp",
    focus: "35% 40%",
  },
  {
    title: "The remote worker",
    tagline: "Focus, minus the office",
    description: "Working from home or cafés. When your environment isn't built for focus, Feelz helps you create it internally.",
    moods: ["focus"],
    scene: "/feelz-creative/moments/focus-working-v3.webp",
    focus: "45% 35%",
  },
  {
    title: "The night owl",
    tagline: "For the 2am scroll",
    description: "Can't switch off at midnight. Rest strips with melatonin and L-Theanine help you wind down naturally; wake up actually rested.",
    moods: ["rest"],
    // Client photo: scrolling her phone in bed at 2:03am.
    scene: "/feelz-creative/moments/persona-night-owl.webp",
    focus: "50% 35%",
    wide: true,
  },
  {
    title: "The overthinker",
    tagline: "Quiet the noise",
    description: "Social situations, new places, unfamiliar people. Joy and Extrovert are built exactly for these moments of overload.",
    moods: ["extrovert", "joy"],
    // Client photo: lost in thought at a busy gathering.
    scene: "/feelz-creative/moments/persona-overthinker.webp",
    focus: "78% 40%",
    wide: true,
  },
  {
    title: "The professional",
    tagline: "Calm under deadline",
    description: "Back-to-back meetings, tight deadlines, constant noise. Focus when it matters, rest when you need to switch off.",
    moods: ["focus", "rest"],
    scene: "/feelz-creative/moments/extrovert-presenting-v3.webp",
    focus: "55% 30%",
  },
];

export function WhoItsForSection() {
  return (
    <section id="who-its-for">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <div className="mx-auto flex w-fit items-center gap-3">
            <span className="h-px w-10 bg-ink/20" aria-hidden />
            <span className="h-1.5 w-1.5 rounded-full bg-ink/40" aria-hidden />
            <span className="h-px w-10 bg-ink/20" aria-hidden />
          </div>
          <h2 className="font-display mt-3 text-2xl font-bold uppercase tracking-[0.3em] text-ink sm:text-3xl">Who Is It For</h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((persona, index) => (
            <Reveal key={persona.title} delayMs={index * 70} className={persona.wide ? "lg:col-span-2" : ""}>
              <article
                className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white text-ink shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(16,35,63,0.45)] ${
                  persona.wide ? "lg:flex-row" : ""
                }`}
              >
                {/* Scene + fanned packs */}
                <div className={`relative shrink-0 ${persona.wide ? "aspect-[4/3] lg:aspect-auto lg:w-[55%]" : "aspect-[4/3]"}`}>
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={persona.scene}
                      alt=""
                      fill
                      sizes={persona.wide ? "(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"}
                      className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
                      style={{ objectPosition: persona.focus }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden />
                  </div>

                  {!persona.packInScene && (
                  <div className="pointer-events-none absolute -bottom-6 right-5 flex items-end" aria-hidden>
                    {persona.moods.map((mood, packIndex) => {
                      const isBack = persona.moods.length > 1 && packIndex === 0;
                      return (
                        <div
                          key={mood}
                          className={`relative aspect-[3/4] w-24 overflow-hidden rounded-xl border-4 border-white shadow-[0_18px_36px_-14px_rgba(16,35,63,0.55)] transition-transform duration-500 ease-out sm:w-28 ${
                            isBack
                              ? "-mr-8 -rotate-[10deg] group-hover:-translate-x-3 group-hover:-rotate-[14deg]"
                              : "rotate-[6deg] group-hover:-translate-y-2 group-hover:rotate-[3deg]"
                          }`}
                        >
                          <Image src={PACK_IMAGE[mood]} alt="" fill sizes="112px" className="object-cover" />
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>

                {/* Copy */}
                <div className={`flex flex-1 flex-col p-5 pt-8 sm:p-6 sm:pt-9 ${persona.wide ? "lg:justify-center lg:pt-6" : ""}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-label text-brand/80">
                    Who It&apos;s For · 0{index + 1}
                  </span>
                  <h3 className="font-display mt-2 text-xl font-bold leading-tight sm:text-2xl">{persona.title}</h3>
                  <p className="font-tagline mt-1 text-sm italic opacity-90">{persona.tagline}</p>
                  <p className="mt-3 text-sm leading-relaxed opacity-80">{persona.description}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {persona.moods.map((mood) => {
                      const colors = FEELZ_COLOR_CLASSES[MOOD_STYLES[mood].feelzColor];
                      return (
                        <span
                          key={mood}
                          className={`rounded-full ${colors.bgTint} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-label ${colors.text}`}
                        >
                          {mood}
                        </span>
                      );
                    })}
                    {persona.zostel && (
                      <span className="flex items-center gap-1.5 rounded-full border border-brand/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-label text-brand">
                        <span className="relative h-4 w-4 overflow-hidden rounded-full">
                          <Image src="/press/zostel.png" alt="" fill sizes="16px" className="object-cover" />
                        </span>
                        Zostel
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
