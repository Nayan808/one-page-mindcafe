import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";

// Real coded content instead of the static formulation-story creative —
// same five-step Ayurveda → Botanicals → Formulation → Melt-in-mouth →
// Your moment sequence and copy, rebuilt as an actual component rather
// than a photograph, in the same page position. The step photos ARE real
// though — cropped from that same reference creative (public/feelz-
// creative/08-ayurvedic-wisdom-modern-formulation.webp, see public/feelz-
// creative/wisdom/), not stock art, per the client's request to match the
// reference's photo-per-step look rather than plain numbered badges.
const STEPS = [
  { n: "01", title: "Ayurveda", body: "Timeless wisdom for modern lives.", color: FEELZ_COLOR_CLASSES["feelz-berry"], image: "/feelz-creative/wisdom/ayurveda.webp" },
  { n: "02", title: "Botanicals", body: "Potent plants. Real benefits.", color: FEELZ_COLOR_CLASSES["feelz-orange"], image: "/feelz-creative/wisdom/botanicals.webp" },
  { n: "03", title: "Formulation", body: "Science meets nature's best.", color: FEELZ_COLOR_CLASSES["feelz-navy"], image: "/feelz-creative/wisdom/formulation.webp" },
  { n: "04", title: "Melt-in-mouth", body: "Wellness that dissolves in seconds.", color: FEELZ_COLOR_CLASSES["feelz-rest"], image: "/feelz-creative/wisdom/melt.webp" },
  { n: "05", title: "Your moment", body: "More goodness in your everyday.", color: FEELZ_COLOR_CLASSES["feelz-berry"], image: "/feelz-creative/wisdom/moment.webp" },
];

export function AncientWisdomSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <Reveal className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-berry">The thinking behind FEELZ</p>
        <h2 className="font-display mt-3 text-3xl font-bold text-feelz-ink sm:text-4xl">
          A thoughtful journey. <span className="font-tagline italic">For your everyday moments.</span>
        </h2>
      </Reveal>

      <Reveal delayMs={120} className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-5 sm:gap-3">
        {STEPS.map((step, index) => (
          <div key={step.n} className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-0">
            <div className="flex items-center gap-3 sm:w-full sm:justify-between sm:gap-0">
              <div className="relative shrink-0">
                <div className="h-28 w-28 overflow-hidden rounded-2xl border border-feelz-ink/10 bg-feelz-paper shadow-sm sm:h-36 sm:w-36">
                  <Image src={step.image} alt={step.title} width={288} height={288} className="h-full w-full object-contain p-1.5" />
                </div>
                <span className={`absolute -left-2.5 -top-2.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white ${step.color.bgTint} text-xs font-bold ${step.color.text}`}>
                  {step.n}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className="hidden h-6 w-6 shrink-0 text-feelz-ink/35 sm:block" aria-hidden />
              )}
            </div>
            <div className="sm:mt-3">
              <p className="font-display text-base font-bold text-feelz-ink">{step.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-feelz-ink/55">{step.body}</p>
            </div>
          </div>
        ))}
      </Reveal>

      <p className="mt-10 text-center text-[11px] uppercase tracking-label text-feelz-ink/40">
        Plants · people · better days — anytime, anywhere.
      </p>
    </section>
  );
}
