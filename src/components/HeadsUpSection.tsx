const NOTES = [
  { n: "01", text: "A wellness supplement, not a medicine: part of your routine, not a treatment for any condition." },
  { n: "02", text: "Best for healthy adults 18+. If you're pregnant or breastfeeding, we'd suggest skipping this one." },
  { n: "03", text: "Already on medication or managing a health condition? A quick check-in with your doctor is always a smart move." },
  { n: "04", text: "Our Rest strip contains melatonin; one strip every 24 hours is all you need. Skip driving or machinery use right after." },
];

export function HeadsUpSection() {
  return (
    <section id="heads-up" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 shadow-[0_1px_2px_rgba(17,17,16,0.04),0_16px_32px_-16px_rgba(17,17,16,0.25)] sm:flex-row">
        <div className="flex shrink-0 items-center justify-center bg-ink px-6 py-5 text-cream sm:w-36">
          <div className="text-center">
            <p className="font-display text-lg font-bold leading-tight">Good to know</p>
            <p className="text-[10px] uppercase tracking-label opacity-80">Before You Start</p>
          </div>
        </div>
        <div className="grid flex-1 gap-x-6 gap-y-3 bg-cream p-5 text-sm text-ink/65 sm:grid-cols-2 sm:p-6">
          {NOTES.map((note) => (
            <p key={note.n} className="leading-relaxed">
              <span className="font-semibold text-ink">{note.n}</span> {note.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
