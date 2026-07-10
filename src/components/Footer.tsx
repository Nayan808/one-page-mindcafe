export function Footer() {
  return (
    <footer className="mx-3 mb-3 rounded-2xl border border-ink/10 px-6 py-8 sm:mx-6 sm:mb-6 sm:px-10">
      <div className="grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-bold lowercase">feelz</p>
          <p className="mt-2 max-w-xs text-sm text-ink/60">
            sublingual mood strips, made by mindcafé, incubated at zo world, distributed by zostel.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">moods</p>
          <ul className="mt-2 space-y-1 text-sm text-ink/70">
            <li>focus</li>
            <li>extrovert</li>
            <li>joy</li>
            <li>rest</li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">fine print</p>
          <ul className="mt-2 space-y-1 text-sm text-ink/70">
            <li>not for medicinal use</li>
            <li>not for children, pregnant women, or those under 18</li>
            <li>fssai compliant · made in india</li>
          </ul>
        </div>
      </div>
      <p className="mt-8 text-xs text-ink/40">
        © {new Date().getFullYear()} feelz by mindcafé. incubated at zo world. distributed by zostel.
      </p>
    </footer>
  );
}
