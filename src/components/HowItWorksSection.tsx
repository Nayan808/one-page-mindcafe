import Image from "next/image";

const STEPS = [
  { title: "The Box", description: "Sleek. Pocket-ready. Always within reach.", src: "/how-it-works/step-1.webp" },
  { title: "Open Box", description: "Open and take out a strip with ease.", src: "/how-it-works/step-2.webp" },
  {
    title: "The Strip",
    description: "Tear the inner packaging, take out the ultra-thin, fast-dissolving strip — designed for real life.",
    src: "/how-it-works/step-3.webp",
  },
  {
    title: "On Your Tongue",
    description: "Place the strip on your tongue. Let it dissolve. No water. No tablets. Just pure support.",
    src: "/how-it-works/step-4.webp",
  },
  { title: "Anywhere You Go", description: "From pocket to peace of mind.", src: "/how-it-works/step-5.webp" },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
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

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
        {STEPS.map((step, index) => (
          <div
            key={step.title}
            className={`flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_1px_2px_rgba(17,17,16,0.04),0_16px_32px_-16px_rgba(17,17,16,0.25)] ${
              index === STEPS.length - 1 ? "col-span-2 mx-auto w-1/2 sm:col-span-1 sm:mx-0 sm:w-auto" : ""
            }`}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={step.src}
                alt={step.title}
                fill
                sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-4 text-left">
              <h3 className="font-display text-base font-bold text-ink sm:text-lg">{step.title}</h3>
              <p className="text-xs leading-snug text-ink/60 sm:text-sm">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
