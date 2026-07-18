import Image from "next/image";
import { Award, Medal, Trophy } from "lucide-react";
import { Reveal } from "@/components/Reveal";

// Quote, bio, and award badges sourced verbatim from mindcafe.app/about
// (the same company's live founder section) rather than invented.
const BADGES = [
  { Icon: Trophy, label: "Women Faces of the Year, Fox Story" },
  { Icon: Award, label: "Women Entrepreneur of the Year 2024" },
  { Icon: Medal, label: "Startup of the Year 2022, MIT WPU" },
];

export function FounderSection() {
  return (
    <section className="bg-white">
      <Reveal className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">the person behind mindcafé</p>
        <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
          meet our <span className="font-tagline italic">founder.</span>
        </h2>

        <div className="mt-10 flex flex-col gap-8 rounded-3xl border border-ink/25 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-ink sm:mx-0 sm:h-48 sm:w-48">
            <Image src="/about/founder.webp" alt="Sneh Nigam" fill className="object-cover" />
          </div>

          <div className="text-center sm:text-left">
            <p className="font-tagline text-lg italic leading-snug text-ink sm:text-xl">
              &ldquo;I built Mindcafé because I believe the mind deserves the same care as the body — and that every
              Indian should have access to that care, regardless of where they are or what they can afford.&rdquo;
            </p>

            <p className="font-display mt-4 text-base font-bold text-ink">Sneh Nigam</p>
            <p className="text-sm text-ink/50">Founder, Mindcafé</p>

            <p className="mt-4 text-sm leading-relaxed text-ink/60">
              At Mindcafé, we provide a safe, anonymous platform to share your feelings and connect with expert
              advice. Alongside, our transformational programs — crafted by psychologists, neurologists, yoga
              practitioners, and more — are here to guide you toward healing and growth.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              {BADGES.map((badge) => (
                <span key={badge.label} className="badge-pill inline-flex items-center gap-1.5">
                  <badge.Icon className="h-3 w-3" aria-hidden />
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
