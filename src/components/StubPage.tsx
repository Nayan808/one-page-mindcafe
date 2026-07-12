import Link from "next/link";

// Placeholder for a vertical whose real page lands in a later phase
// (counselling, business, about) — exists purely so header/footer nav
// links resolve to something real instead of a 404 while that phase is
// still unbuilt.
export function StubPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">coming soon</p>
      <h1 className="font-display mt-3 text-3xl font-bold lowercase text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-ink/60">{description}</p>
      <Link href="/feelz" className="pill-btn mt-6">
        shop feelz in the meantime
      </Link>
    </div>
  );
}
