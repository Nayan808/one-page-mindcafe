import { CalendarCheck, ListChecks, UserCheck } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const STEPS = [
  { title: "Pick a category", description: "Individual, family, child & adolescent, or specialized support.", Icon: ListChecks },
  { title: "Choose your expert", description: "Browse certified counsellors and pick who feels right.", Icon: UserCheck },
  { title: "Book a session", description: "Set a time that works for you — private, at your pace.", Icon: CalendarCheck },
];

// Same connected-step visual language as Feelz's HowItWorksSection, but
// icon nodes instead of photos — there's no real counselling photography
// to show yet, and fabricating stock-photo "counsellors" would be
// misleading for a page about real mental-health support.
export function CounsellingHowItWorks() {
  return (
    <section id="how-it-works" className="bg-white">
      <Reveal className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
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

      <div className="relative mt-16">
        <div className="absolute top-8 hidden h-px bg-ink/15 sm:block" style={{ left: "16%", right: "16%" }} aria-hidden />
        <div className="absolute bottom-6 left-8 top-6 w-px bg-ink/15 sm:hidden" aria-hidden />

        <div className="relative flex flex-col gap-10 sm:flex-row sm:justify-between">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative flex items-start gap-5 sm:flex-1 sm:flex-col sm:items-center sm:text-center">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white shadow-sm sm:h-20 sm:w-20">
                <step.Icon className="h-6 w-6 text-ink sm:h-7 sm:w-7" aria-hidden />
                <span className="font-display absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-cream bg-ink text-[11px] font-bold text-cream">
                  {index + 1}
                </span>
              </div>

              <div className="pt-1 sm:mt-4 sm:pt-0">
                <h3 className="font-display text-base font-bold text-ink sm:text-lg">{step.title}</h3>
                <p className="mt-1 max-w-[16rem] text-xs leading-snug text-ink/60 sm:mx-auto sm:text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  );
}
