"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqItem = { question: string; answer: string };

// Generic single-open accordion, factored out of the original Feelz-only
// FaqSection so the counselling FAQ teaser (and any future section) can
// reuse the exact same interaction/animation instead of re-implementing it.
export function AccordionFaq({ id, heading, items }: { id?: string; heading: string; items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id={id} className="mx-auto max-w-[52.8rem] px-4 py-10 sm:px-6">
      <div className="text-center">
        <div className="mx-auto flex w-fit items-center gap-3">
          <span className="h-px w-10 bg-ink/20" aria-hidden />
          <span className="h-1.5 w-1.5 rounded-full bg-ink/40" aria-hidden />
          <span className="h-px w-10 bg-ink/20" aria-hidden />
        </div>
        <h2 className="font-display mt-3 text-2xl font-bold uppercase tracking-[0.3em] text-ink sm:text-3xl">
          {heading}
        </h2>
      </div>

      <div className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
        {items.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.question} className="py-3">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4"
              >
                <span className="font-display flex-1 text-center text-sm font-semibold text-ink sm:text-left sm:text-base">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-ink/50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <p className="overflow-hidden text-xs leading-relaxed text-ink/65 sm:text-sm">
                  <span className="block pt-2">{faq.answer}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
