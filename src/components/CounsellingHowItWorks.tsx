import { ArrowRight, CalendarCheck, ListChecks, UserCheck } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { RiseIn } from "@/components/motion/primitives";

const STEPS = [
  {
    title: "Tell us what you're looking for",
    description: "Choose the kind of support that feels closest to what you're going through.",
    Icon: ListChecks,
  },
  {
    title: "Find someone who fits",
    description: "Browse qualified professionals by specialty, approach and experience.",
    Icon: UserCheck,
  },
  {
    title: "Take the first step",
    description: "Choose a convenient time and have your private session online.",
    Icon: CalendarCheck,
  },
];

// Three step cards on a soft blush panel. Icon nodes rather than photos —
// there's no real counselling photography to show yet, and fabricating
// stock-photo "counsellors" would be misleading for a page about real
// mental-health support.
export function CounsellingHowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-12 sm:px-6 sm:py-16">
      <Reveal className="relative mx-auto max-w-[88rem] overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#f8eef2] to-[#fdf9fa] px-5 py-14 sm:rounded-[2.5rem] sm:px-10 sm:py-20 lg:px-16">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[44rem] max-w-[140%] -translate-x-1/2 rounded-full bg-brand-blush/25 blur-3xl"
          aria-hidden
        />

        <div className="relative text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-brand">How it works</p>
          <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            A simple place <span className="font-tagline whitespace-nowrap italic text-brand">to start.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/60 sm:text-base">
            Three short steps, at your own pace.
          </p>
        </div>

        <ol className="relative mt-12 grid gap-5 sm:mt-14 lg:grid-cols-3 lg:gap-6">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              <RiseIn delay={0.1 + index * 0.12} y={16} blur={4} amount={0.3} className="h-full">
                <div className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-ink/[0.07] bg-white p-6 shadow-[0_10px_30px_-24px_rgba(77,42,57,0.35)] transition-all duration-500 ease-out hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_22px_44px_-26px_rgba(152,97,120,0.55)] sm:p-8">
                  <span
                    className="font-hero pointer-events-none absolute -top-2 right-5 select-none text-[5.5rem] font-bold leading-none text-brand/[0.09] transition-colors duration-500 group-hover:text-brand/[0.16] sm:text-[6.5rem]"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_10px_20px_-10px_rgba(152,97,120,0.8)] transition-transform duration-500 group-hover:scale-105">
                    <step.Icon className="h-5 w-5" aria-hidden />
                  </div>

                  <p className="relative mt-8 text-[11px] font-semibold uppercase tracking-label text-brand">
                    Step {index + 1}
                  </p>
                  <h3 className="font-display relative mt-1.5 text-lg font-bold leading-snug text-ink sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-ink/60">{step.description}</p>
                </div>
              </RiseIn>

              {/* Connector to the next card, centred in the grid gap. */}
              {index < STEPS.length - 1 && (
                <span
                  className="absolute left-full top-1/2 z-10 ml-3 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-brand/15 bg-white text-brand shadow-sm lg:flex"
                  aria-hidden
                >
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
