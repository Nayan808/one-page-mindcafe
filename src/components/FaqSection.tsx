const FAQS = [
  {
    question: "How do I take a feelz strip?",
    answer:
      "Open the pack, place the strip on your tongue, and let it dissolve naturally — no water needed. It melts within seconds, so you can use it anywhere.",
  },
  {
    question: "How quickly does feelz work?",
    answer:
      "Since the strip dissolves in your mouth, the ingredients absorb through the oral mucosa — faster than a traditional tablet. Effectiveness varies by individual factors like body weight; feelz is a supportive wellness tool, not an instant fix.",
  },
  {
    question: "When should I use each mood?",
    answer:
      "focus sharpens mental clarity for work or study. joy eases stress and low mood. extrovert supports confidence before social situations. rest helps you wind down before bed.",
  },
  {
    question: "Will feelz make me feel sleepy or drowsy?",
    answer:
      "Only rest is formulated to promote relaxation for bedtime. focus, joy, and extrovert support clarity and balance without drowsiness, so they're fine for daytime use.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div className="mx-auto flex w-fit items-center gap-3">
          <span className="h-px w-10 bg-ink/20" aria-hidden />
          <span className="h-1.5 w-1.5 rounded-full bg-ink/40" aria-hidden />
          <span className="h-px w-10 bg-ink/20" aria-hidden />
        </div>
        <h2 className="font-display mt-4 text-2xl font-bold uppercase tracking-[0.3em] text-ink sm:text-3xl">
          — faq —
        </h2>
      </div>

      <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
        {FAQS.map((faq) => (
          <div key={faq.question} className="py-5">
            <p className="font-display text-base font-semibold text-ink sm:text-lg">{faq.question}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink/65 sm:text-base">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
