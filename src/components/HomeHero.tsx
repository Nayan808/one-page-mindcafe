import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

// Homepage hero — static, no DB call (spec 4.1). Just the brand intro and
// the two top-level paths through the site: shop Feelz, or book
// counselling. The full shopping experience (product grid, add-to-cart)
// lives on /feelz now, not here.
export function HomeHero() {
  return (
    <section className="bg-cream">
      <div className="mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <Reveal className="flex flex-col items-center">
          <span className="rounded-full border border-ink/15 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-label text-ink/70">
            mindcafé
          </span>

          <h1 className="font-display mx-auto mt-7 max-w-4xl text-5xl leading-[0.98] font-bold lowercase tracking-tight text-ink sm:text-7xl">
            everyday tools for how you feel — and someone to talk to when you need more.
          </h1>

          <p className="font-tagline mx-auto mt-7 max-w-xl text-lg italic text-ink/70 sm:text-xl">
            feelz mood strips for the day-to-day. 1:1 counselling with certified experts for everything else.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/feelz" className="pill-btn">
              explore feelz
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link href="/counselling" className="pill-btn-outline">
              book counselling
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
