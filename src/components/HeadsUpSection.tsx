const NOTES = [
  { n: "01", text: "not for medicinal use." },
  { n: "02", text: "not for children, pregnant women, or those under 18." },
  { n: "03", text: "consult a physician if you take other medication or have a medical condition." },
  { n: "04", text: "rest strip only — contains melatonin. max 1 strip / 24hr. don't operate heavy machinery." },
];

export function HeadsUpSection() {
  return (
    <section id="heads-up" className="mx-3 my-3 overflow-hidden rounded-2xl border border-ink/15 sm:mx-6 sm:my-6">
      <div className="flex flex-col sm:flex-row">
        <div
          className="flex shrink-0 items-center justify-center px-6 py-4 text-cream sm:w-40"
          style={{
            background:
              "repeating-linear-gradient(135deg, #b3151c, #b3151c 10px, #111110 10px, #111110 20px)",
          }}
        >
          <div className="text-center">
            <p className="font-display text-lg font-bold leading-tight">heads up</p>
            <p className="text-[10px] uppercase tracking-label opacity-80">fine print</p>
          </div>
        </div>
        <div className="grid flex-1 gap-3 bg-cream p-5 text-sm text-ink/70 sm:grid-cols-2 sm:p-6">
          {NOTES.map((note) => (
            <p key={note.n}>
              <span className="font-semibold text-ink">{note.n}</span> {note.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
