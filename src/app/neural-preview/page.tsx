import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NeuralBand } from "@/components/NeuralBand";

// Tuning harness for the neural field. Three bands at different intensity
// and scrim settings so bloom, depth of field, density and dispersal can
// be judged against real site typography rather than in isolation — the
// middle band is the text-heavy case the scrim exists for.
export default function NeuralPreview() {
  return (
    <>
      <NeuralBand className="flex min-h-screen items-center justify-center px-6" scrim={0.28} intensity={1.15}>
        <div className="mx-auto max-w-2xl py-24 text-center">
          <p className="text-[11px] uppercase tracking-label text-cream/50">Mindcafe</p>
          <h2 className="font-display mt-4 text-4xl font-bold text-cream sm:text-6xl">
            Your mind is a network
          </h2>
          <p className="font-tagline mt-5 text-lg italic text-cream/70 sm:text-xl">
            Every thought a signal, travelling somewhere new.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/feelz" className="pill-btn">
              Shop Feelz
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link href="/book-appointment" className="pill-btn-outline !border-cream/40 !text-cream hover:!bg-cream/10">
              Book Consultation
            </Link>
          </div>
        </div>
      </NeuralBand>

      <NeuralBand className="px-6" scrim={0.72} intensity={0.75} signature={false}>
        <div className="mx-auto max-w-2xl space-y-4 py-28 text-cream/80">
          <h2 className="font-display text-3xl font-bold text-cream">Readability check</h2>
          <p>
            This band carries the heavier scrim used behind long copy. The field stays visible
            through the middle of the composition while the gradient lifts contrast at the top and
            bottom edges, where paragraphs usually sit.
          </p>
          <p>
            Body text here is Inter at weight 500, the same as the rest of the site, rendered on the
            darkened field rather than on cream. Contrast is checked against the darkest point of
            the field, not its average.
          </p>
        </div>
      </NeuralBand>

      <NeuralBand className="flex min-h-screen items-center justify-center px-6" scrim={0.4} density={400} signature={false}>
        <div className="mx-auto max-w-xl py-24 text-center">
          <h2 className="font-display text-3xl font-bold text-cream sm:text-5xl">Dispersed field</h2>
          <p className="mt-4 text-sm text-cream/60">
            Maximum density, default intensity — the ambient state after the silhouette dissolves.
          </p>
        </div>
      </NeuralBand>
    </>
  );
}
