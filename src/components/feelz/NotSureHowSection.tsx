"use client";

import Image from "next/image";

// Matches the client's reference creative (public/feelz-creative/06-not-
// sure-how-feelz-works.webp) structurally — same hand-photo-on-colored-
// blob idea either side of the center copy — but coded rather than using
// that creative as a pasted background: the blob shapes are real CSS, the
// photos are real product shots already used elsewhere (public/feelz-
// creative/steps/), and the handwritten-style captions are real typed
// text, not baked into a flat image.
export function NotSureHowSection() {
  return (
    <section className="mx-auto max-w-[96rem] px-4 pb-6 pt-16 sm:px-6 sm:pb-8">
      <div className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[2rem] border border-feelz-ink/10 bg-feelz-paper px-6 py-10 sm:grid-cols-[1fr_1.4fr_1fr] sm:gap-4 sm:px-8">
        <div className="relative hidden aspect-square items-center justify-center sm:flex">
          <div className="absolute h-[85%] w-[85%] rounded-[60%_40%_55%_45%/50%_60%_40%_50%] bg-feelz-orange/20" aria-hidden />
          <div className="relative h-40 w-40 overflow-hidden rounded-2xl border-4 border-feelz-cream shadow-lg">
            <Image src="/feelz-creative/steps/place.webp" alt="" fill className="object-cover" />
          </div>
          <p className="font-tagline absolute bottom-2 left-2 max-w-[8rem] -rotate-3 text-sm italic text-feelz-ink/70">
            Tiny strip. Big difference.
          </p>
        </div>

        <div className="text-center">
          <p className="font-tagline text-base italic text-feelz-ink/50 sm:text-lg">Still have questions?</p>
          <h2 className="font-display mt-2 text-3xl font-bold text-feelz-ink sm:text-4xl">Not sure how FEELZ works?</h2>
          <p className="mx-auto mt-3 max-w-sm text-base text-feelz-ink/60 sm:text-lg">
            Click here to see how a tiny strip can make a big difference.
          </p>
          <button
            type="button"
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-feelz-berry px-7 py-3.5 text-base font-semibold text-feelz-cream transition hover:opacity-90"
          >
            Show me how it works →
          </button>
        </div>

        <div className="relative hidden aspect-square items-center justify-center sm:flex">
          <div className="absolute h-[85%] w-[85%] rounded-[45%_55%_40%_60%/55%_45%_60%_40%] bg-feelz-berry/15" aria-hidden />
          <div className="relative h-40 w-40 overflow-hidden rounded-2xl border-4 border-feelz-cream shadow-lg">
            <Image src="/feelz-creative/steps/open.webp" alt="" fill className="object-cover" />
          </div>
          <p className="font-tagline absolute right-2 top-2 max-w-[8rem] rotate-2 text-sm italic text-feelz-ink/70">
            Same you, just a little brighter.
          </p>
        </div>
      </div>
    </section>
  );
}
