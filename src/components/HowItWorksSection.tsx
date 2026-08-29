"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/Modal";

const STEPS = [
  { title: "Pick your Feelz", description: "", src: "/how-it-works/step-1.webp" },
  { title: "Open the pack", description: "", src: "/how-it-works/step-2.webp" },
  { title: "Place the strip on your tongue", description: "", src: "/how-it-works/step-3.webp" },
  { title: "Let it dissolve", description: "", src: "/how-it-works/step-4.webp" },
  { title: "Get on with your day", description: "", src: "/how-it-works/step-5.webp" },
];

// Alternating tilt per card so the row reads as pinned-up photo prints
// rather than perfectly aligned tiles.
const TILTS = ["-rotate-3", "rotate-2", "-rotate-2", "rotate-3", "-rotate-2"];

// Polaroid clothesline instead of the more common connected-circle-node
// timeline — five taped-up photo prints pinned along a string reads as
// tactile and a little handmade, which fits Feelz's "tear it, place it"
// physical ritual better than another line-and-circle graph. Description
// copy sits outside the tilted frame so it stays level and readable.
export function HowItWorksSection() {
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const detailStep = detailIndex !== null ? STEPS[detailIndex] : null;

  return (
    <section id="how-it-works" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <div className="mx-auto flex w-fit items-center gap-3">
            <span className="h-px w-10 bg-ink/20" aria-hidden />
            <span className="h-1.5 w-1.5 rounded-full bg-ink/40" aria-hidden />
            <span className="h-px w-10 bg-ink/20" aria-hidden />
          </div>
          <h2 className="font-display mt-4 text-2xl font-bold uppercase tracking-[0.3em] text-ink sm:text-3xl">
            Wellness, without the routine
          </h2>
        </div>

        <div className="relative mt-20 sm:mt-24">
          {/* The clothesline the polaroids hang from */}
          <div
            className="absolute top-3 hidden border-t border-dashed border-ink/20 sm:block"
            style={{ left: "6%", right: "6%" }}
            aria-hidden
          />

          <div className="grid grid-cols-2 gap-x-5 gap-y-14 sm:grid-cols-5 sm:gap-x-6 sm:gap-y-0">
            {STEPS.map((step, index) => {
              const isLast = index === STEPS.length - 1;
              return (
                <div key={step.title} className={isLast ? "col-span-2 flex justify-center sm:col-span-1 sm:block" : ""}>
                  <div className="w-40 sm:w-auto">
                    <div
                      className={`group relative ${TILTS[index]} transition-transform duration-300 ease-out hover:rotate-0 hover:scale-[1.04]`}
                    >
                      {/* Washi tape pinning the print to the line */}
                      <span
                        className="absolute -top-3 left-1/2 h-5 w-14 -translate-x-1/2 -rotate-2 bg-brand-blush/80 shadow-sm"
                        aria-hidden
                      />

                      <button
                        type="button"
                        onClick={() => setDetailIndex(index)}
                        aria-label={`View larger image for step ${index + 1}: ${step.title}`}
                        className="relative block w-full cursor-zoom-in border border-ink/10 bg-white p-2 pb-3.5 shadow-[0_14px_28px_-16px_rgba(17,17,16,0.35)] transition-shadow duration-300 group-hover:shadow-[0_18px_32px_-14px_rgba(17,17,16,0.4)]"
                      >
                        <span className="relative block aspect-square w-full overflow-hidden bg-ink/5">
                          <Image
                            src={step.src}
                            alt={step.title}
                            fill
                            sizes="(min-width: 640px) 18vw, 45vw"
                            className="object-cover"
                          />
                          <span className="font-display absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-cream bg-ink text-[11px] font-bold text-cream">
                            {index + 1}
                          </span>
                        </span>
                        <span className="font-tagline mt-2 block text-center text-sm italic text-ink">
                          {step.title}
                        </span>
                      </button>
                    </div>

                    {step.description && (
                      <p className="mt-3 text-center text-xs leading-snug text-ink/60 sm:text-sm">{step.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!detailStep}
        onClose={() => setDetailIndex(null)}
        title={detailStep?.title ?? ""}
        panelClassName="max-w-md"
        bgClassName="bg-white"
      >
        {detailStep && (
          <>
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
              <Image src={detailStep.src} alt={detailStep.title} fill sizes="28rem" className="object-cover" />
            </div>
            {detailStep.description && <p className="mt-3 text-sm text-ink/70">{detailStep.description}</p>}
          </>
        )}
      </Modal>
    </section>
  );
}
