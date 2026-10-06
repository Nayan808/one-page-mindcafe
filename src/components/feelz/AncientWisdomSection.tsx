import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";

// Real coded content instead of the static formulation-story creative —
// same five-step Ayurveda → Botanicals → Formulation → Melt-in-mouth →
// Your moment sequence and copy. The step photos ARE real — cropped from
// the client's reference creative (public/feelz-creative/08-ayurvedic-
// wisdom-modern-formulation.webp, see public/feelz-creative/wisdom/), not
// stock art. Laid out as a "process wheel" — circular photo nodes along a
// gentle arc, connected by a dashed path — a deliberately modern take
// rather than a literal re-stitch of the reference's single photographed
// row (tried a straight 5-column grid and alternating editorial blocks
// first; this is the third direction, picked after those two).
const STEPS = [
  { n: "01", title: "Ayurveda", body: "Timeless wisdom for modern lives.", color: FEELZ_COLOR_CLASSES["feelz-berry"], image: "/feelz-creative/wisdom/ayurveda.webp", offset: "lg:translate-y-6" },
  { n: "02", title: "Botanicals", body: "Potent plants. Real benefits.", color: FEELZ_COLOR_CLASSES["feelz-orange"], image: "/feelz-creative/wisdom/botanicals.webp", offset: "lg:-translate-y-2" },
  { n: "03", title: "Formulation", body: "Science meets nature's best.", color: FEELZ_COLOR_CLASSES["feelz-navy"], image: "/feelz-creative/wisdom/formulation.webp", offset: "lg:-translate-y-8" },
  { n: "04", title: "Melt-in-mouth", body: "Wellness that dissolves in seconds.", color: FEELZ_COLOR_CLASSES["feelz-rest"], image: "/feelz-creative/wisdom/melt.webp", offset: "lg:-translate-y-2" },
  { n: "05", title: "Your moment", body: "More goodness in your everyday.", color: FEELZ_COLOR_CLASSES["feelz-berry"], image: "/feelz-creative/wisdom/moment-v2.webp", offset: "lg:translate-y-6" },
];

export function AncientWisdomSection() {
  return (
    <section className="mx-auto max-w-[88rem] px-4 py-16 sm:px-6">
      <Reveal className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-berry">Ancient wisdom. Modern formulation.</p>
        <h2 className="font-display mt-3 text-3xl font-bold text-feelz-ink sm:text-4xl">
          A thoughtful journey. <span className="font-tagline italic text-feelz-berry">For your everyday moments.</span>
        </h2>
      </Reveal>

      <Reveal delayMs={100} className="relative mt-20 sm:mt-24">
        {/* Hand-drawn, looping squiggle arrows — one per gap (1→2, 2→3,
            3→4, 4→5) — a single reusable doodle shape (defined once as a
            <symbol>, reused via <use>) rather than four separate paths,
            each alternating slightly in rotation/flip so the row doesn't
            look mechanically repeated. Replaces the earlier dot-travel +
            node-glow animation and the plain smooth-curve arrows. */}
        <svg
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-40 w-full lg:block lg:h-52"
          viewBox="0 0 1000 160"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <symbol id="wisdom-squiggle" viewBox="0 0 130 70">
              <path
                d="M6,46 C6,18 34,6 46,24 C56,40 38,52 30,38 C22,24 46,10 70,18 C96,27 84,46 66,44 C58,43 60,34 70,34 C92,34 108,38 116,40"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M112,32 L124,40 L110,48 C113,43 113,37 112,32 Z" strokeLinejoin="round" />
            </symbol>
          </defs>
          <use href="#wisdom-squiggle" x="145" y="66" width="110" height="60" className="stroke-feelz-ink/30 fill-feelz-ink/30" strokeWidth="3" transform="rotate(-6 200 96)" />
          <use href="#wisdom-squiggle" x="345" y="10" width="110" height="60" className="stroke-feelz-ink/30 fill-feelz-ink/30" strokeWidth="3" transform="rotate(8 400 40)" />
          <use href="#wisdom-squiggle" x="545" y="10" width="110" height="60" className="stroke-feelz-ink/30 fill-feelz-ink/30" strokeWidth="3" transform="rotate(-8 600 40)" />
          <use href="#wisdom-squiggle" x="745" y="66" width="110" height="60" className="stroke-feelz-ink/30 fill-feelz-ink/30" strokeWidth="3" transform="rotate(6 800 96)" />
        </svg>

        {/* Mobile: a single-column vertical stepper (photo left, text
            right, connected by a plain vertical line) so the five steps
            read as one clear top-to-bottom sequence instead of a 2-up
            grid that breaks the 1→2→3→4→5 order into odd row pairs.
            Desktop keeps the 5-across arc layout. */}
        <div className="relative mx-auto flex max-w-md flex-col gap-8 lg:grid lg:max-w-none lg:grid-cols-5 lg:gap-x-4 lg:gap-y-10">
          {STEPS.map((step, index) => (
            <div key={step.n} className={`relative flex items-center gap-4 text-left lg:flex-col lg:items-center lg:text-center ${step.offset}`}>
              {index < STEPS.length - 1 && (
                <span className="absolute left-10 top-full h-8 w-px bg-feelz-ink/15 lg:hidden" aria-hidden />
              )}
              <div className="relative shrink-0">
                <div className="h-20 w-20 overflow-hidden rounded-full shadow-[0_8px_24px_-8px_rgba(16,35,63,0.3)] lg:h-40 lg:w-40 xl:h-52 xl:w-52">
                  <Image src={step.image} alt={step.title} width={416} height={416} className="h-full w-full object-cover" />
                </div>
                <span className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-feelz-cream ${step.color.bgTint} text-[11px] font-bold ${step.color.text} lg:h-8 lg:w-8 lg:text-xs`}>
                  {step.n}
                </span>
              </div>
              <div>
                <p className={`font-display text-base font-bold lg:mt-4 lg:text-lg ${step.color.text}`}>{step.title}</p>
                <p className="mt-1 max-w-[14rem] text-xs leading-relaxed text-feelz-ink/55 lg:max-w-[10rem]">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <p className="mt-16 text-center text-[11px] uppercase tracking-label text-feelz-ink/40">
        Plants · people · better days — anytime, anywhere.
      </p>
    </section>
  );
}
