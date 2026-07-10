export function StatsBar() {
  return (
    <div className="border-y border-ink/10 bg-cream px-4 py-6 text-center">
      <p className="font-display flex flex-wrap items-center justify-center gap-3 text-lg font-bold sm:text-2xl">
        <span>10 strips per box</span>
        <span aria-hidden className="text-ink/40">
          ✦
        </span>
        <span>1.5g total</span>
        <span aria-hidden className="text-ink/40">
          ✦
        </span>
        <span>4 moods × 2.5mg</span>
      </p>
    </div>
  );
}
