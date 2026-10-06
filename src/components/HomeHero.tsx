"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { JourneyStrip } from "@/components/hero/JourneyStrip";
import { HeroCarousel } from "@/components/feelz/HeroCarousel";

// Light, product-forward homepage hero — replaces the previous dark
// cinematic-artwork treatment (pointer-parallax, Ken Burns, SVG light
// sparkles, drifting emotion words) with the same real marketing-creative
// carousel /feelz uses (see HeroCarousel), in the spirit of
// neurogumindia.com's staged-product hero banner. Same headline/subhead/
// CTA copy as before — this hero speaks for the whole company (it still
// links out to counselling), so only the product-visual half switches to
// the Feelz creative direction, not the copy. The entrance stagger timing
// (motion's rise/fade-up) is preserved since it's background-agnostic.
const EASE = [0.22, 0.61, 0.36, 1] as const;

export function HomeHero() {
  const prefersReduced = useReducedMotion();
  const reduced = !!prefersReduced;
  const router = useRouter();

  const rise = (delay: number, y = 14) => ({
    initial: reduced ? false : { opacity: 0, y, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-2 lg:gap-16 lg:pt-24">
        <div>
          <motion.p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand" {...rise(0.05, 8)}>
            For your mind. For your everyday.
          </motion.p>

          <h1 className="font-display mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            <motion.span className="block" {...rise(0.16)}>
              Better days begin
            </motion.span>
            <motion.span className="block" {...rise(0.26)}>
              with a healthier
            </motion.span>
            <motion.span className="block" {...rise(0.36)}>
              <span className="font-tagline italic text-brand">mind.</span>
            </motion.span>
          </h1>

          <motion.p className="mt-6 max-w-md text-base leading-relaxed text-ink/60" {...rise(0.5, 12)}>
            Science-backed wellness, human support, and everyday tools to help you understand,
            care for, and strengthen your mental wellbeing.
          </motion.p>

          <motion.div className="mt-8 flex flex-wrap items-center gap-3" {...rise(0.62, 10)}>
            <Link href="/feelz" className="pill-btn group">
              Shop Feelz
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link href="/book-appointment" className="pill-btn-outline group">
              Talk to an Expert
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="relative overflow-hidden rounded-[2rem] border border-ink/10 shadow-lg"
          initial={reduced ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        >
          <HeroCarousel
            onShopClick={() => router.push("/feelz#mood-picks")}
            onZostelClick={() => router.push("/feelz#zostel-locations")}
            showButtons={false}
          />
        </motion.div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-ink/10 px-5 py-8 sm:px-8">
        <JourneyStrip reduced={reduced} delay={0.1} />
      </div>
    </section>
  );
}
