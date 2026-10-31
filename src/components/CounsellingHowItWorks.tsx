import Link from "next/link";
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

// Editorial split: heading and CTA on the left, the three steps as
// hairline-divided rows with large serif numerals on the right. Icon
// nodes rather than photos — there's no real counselling photography to
// show yet, and fabricating stock-photo "counsellors" would be misleading
// for a page about real mental-health support.
export function CounsellingHowItWorks() {
  return (
    <section id="how-it-works">
      <Reveal className="mx-auto grid max-w-[88rem] gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-20">
        <div>
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-label text-brand">
            <span className="h-px w-8 bg-brand/50" aria-hidden />
            How it works
          </p>
          <h2 className="font-display mt-5 text-[2.75rem] font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            A simple place
            <span className="font-tagline block italic text-brand">to start.</span>
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-ink/60">
            Three short steps, at your own pace, from knowing what you need to sitting down with the right
            person.
          </p>
          <Link href="/experts" className="pill-btn mt-8 px-6 py-3">
            Browse experts
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <ol className="border-t border-ink/10">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-b border-ink/10">
              <RiseIn delay={0.1 + index * 0.12} y={14} blur={4} amount={0.4}>
                <div className="group -mx-3 grid grid-cols-[4rem_minmax(0,1fr)] items-start gap-x-4 rounded-2xl px-3 py-8 transition-colors duration-500 hover:bg-brand-blush/[0.09] sm:-mx-5 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:px-5 sm:py-10">
                  <span className="font-hero text-5xl font-bold leading-none text-brand transition-transform duration-500 group-hover:-translate-y-0.5 sm:text-7xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold leading-snug text-ink sm:text-2xl">{step.title}</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/60 sm:text-base">{step.description}</p>
                  </div>
                  <span className="hidden h-14 w-14 items-center justify-center rounded-full border border-brand/25 text-brand transition-all duration-500 group-hover:border-brand group-hover:bg-brand group-hover:text-white sm:flex">
                    <step.Icon className="h-5 w-5" aria-hidden />
                  </span>
                </div>
              </RiseIn>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
