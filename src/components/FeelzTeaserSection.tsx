"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFeelzTeaser } from "@/lib/api";
import { moodStyleFor } from "@/lib/moodStyles";
import { Modal } from "@/components/Modal";
import type { Product } from "@/types/domain";

type TeaserProduct = Pick<Product, "id" | "name" | "image_url">;

// CHAPTER 2 — the breath after the hero.
//
// The hero is untouched. The seam works from this side only: this section
// OPENS on the hero's exact background (#150c1c) and dissolves it down
// through dusty lavender and mauve into warm ivory over ~34rem. There is no
// divider, no wipe and no wave — the darkness simply runs out of itself, so
// the eye never finds an edge to call "where the hero ended".
//
// Everything visual here is CSS colour, light, type and whitespace. No
// photography, no illustration, no canvas.
const EASE = [0.22, 0.61, 0.36, 1] as const;

/** Hero's background, repeated exactly. Any drift here reopens the seam. */
const HERO_DARK = "#150c1c";
/** The page cream, read from the token so it can never drift out of step. */
// Tracks the site token rather than hardcoding a tone. The palette moved
// to a cooler, pinker cream (#faf4f7) and this section was left painting a
// warm yellowish ivory, which showed as a visible colour step against the
// body at both of its edges.
const IVORY = "var(--cream)";

export function FeelzTeaserSection() {
  const teaserQuery = useQuery({
    queryKey: ["products", "feelz-teaser"],
    queryFn: () => getFeelzTeaser(createClient()),
  });
  const products = teaserQuery.data ?? [];
  const [lightboxProduct, setLightboxProduct] = useState<TeaserProduct | null>(null);

  const reduced = !!useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll-linked ambient drift. Ranges are tiny on purpose — the section
  // should feel alive, never busy.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const glowA = useTransform(scrollYProgress, [0, 1], [0, -46]);
  const glowB = useTransform(scrollYProgress, [0, 1], [0, 34]);
  const threadY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const headingStagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.16, delayChildren: 0.05 } },
  };

  /** Rises from behind a clipping mask — the line's own overflow-hidden
   *  parent is what makes it read as revealed rather than faded in. */
  const maskLine = {
    hidden: { y: "112%" },
    show: { y: "0%", transition: { duration: 1.05, ease: EASE } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.985 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.85, ease: EASE, delay: i * 0.11 },
    }),
  };

  return (
    <section
      ref={sectionRef}
      className="grain-fine relative isolate overflow-hidden"
      style={{ backgroundColor: IVORY }}
    >
      {/* LAYER 2 — the dissolve. Starts as the hero's own colour and loses
          itself through lavender and mauve into the ivory base. Multi-stop
          with a long tail so there is no perceptible banding or edge. */}
      <div
        // Shorter on phones: at 34rem the dissolve alone filled most of a
        // mobile viewport, so the section opened on a long empty gradient.
        className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[21rem] sm:h-[28rem] lg:h-[34rem]"
        style={{
          // The tail fades to TRANSPARENT ivory, not opaque ivory. Ending
          // opaque made this layer occlude the ambient glows sitting behind
          // it, so they popped into view in a straight line at its bottom
          // edge — a visible seam, which is the one thing this gradient
          // exists to prevent.
          background: `linear-gradient(to bottom,
            ${HERO_DARK} 0%,
            #1d1327 12%,
            #322243 28%,
            #5b4468 44%,
            #93789b 60%,
            #c3a9bd 73%,
            rgba(230,214,226,0.72) 86%,
            rgba(250,244,247,0) 100%)`,
        }}
        aria-hidden
      />

      {/* LAYER 3 — ambient light fields. Enormous, heavily feathered radial
          gradients rather than shapes: at this size and softness they read
          as light in the room, and never resolve into blobs. */}
      <motion.div
        className="pointer-events-none absolute -z-30"
        style={{
          left: "-18%",
          top: "22%",
          width: "68%",
          height: "60%",
          y: reduced ? 0 : glowA,
          background:
            "radial-gradient(closest-side, rgba(166,108,152,0.13) 0%, rgba(166,108,152,0.05) 46%, rgba(250,244,247,0) 100%)",
        }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -z-30"
        style={{
          right: "-14%",
          top: "44%",
          width: "62%",
          height: "56%",
          y: reduced ? 0 : glowB,
          background:
            "radial-gradient(closest-side, rgba(227,195,155,0.16) 0%, rgba(227,195,155,0.06) 44%, rgba(250,244,247,0) 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -z-30"
        style={{
          left: "34%",
          bottom: "-10%",
          width: "44%",
          height: "38%",
          background:
            "radial-gradient(closest-side, rgba(152,97,120,0.07) 0%, rgba(250,244,247,0) 100%)",
        }}
        aria-hidden
      />

      {/* THE THREAD — one thin line continuing the hero's flow downward, then
          giving out. Deliberately singular: a second one would become a
          pattern, and a thicker one would become a divider. */}
      <motion.svg
        className="pointer-events-none absolute -z-20 hidden md:block"
        style={{ left: "58%", top: 0, width: 320, height: "82%", y: reduced ? 0 : threadY }}
        viewBox="0 0 320 900"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="threadFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a6d8" stopOpacity="0" />
            <stop offset="14%" stopColor="#c9a6d8" stopOpacity="0.5" />
            <stop offset="58%" stopColor="#c9a0b4" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#e3c39b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 176 0 C 232 150, 96 268, 148 420 C 196 560, 74 664, 128 812 C 152 872, 140 886, 136 900"
          stroke="url(#threadFade)"
          strokeWidth="1.1"
          strokeLinecap="round"
          className={reduced ? undefined : "thread-line"}
          style={{ strokeDasharray: "200 1500", strokeDashoffset: 1700 }}
        />
      </motion.svg>

      {/* Content. The top padding is doing real work: it is the breathing
          space the dissolve needs in order to finish before any type starts. */}
      <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-[15rem] sm:px-8 sm:pb-28 sm:pt-[22rem] lg:pt-[30rem]">
        <motion.div
          className="text-center"
          variants={headingStagger}
          initial={reduced ? undefined : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          {/* Label: opens tight and settles outward. */}
          <motion.p
            className="text-[10.5px] font-semibold uppercase text-ink/45"
            initial={reduced ? undefined : { opacity: 0, letterSpacing: "0.05em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.34em" }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.3, ease: EASE }}
          >
            Feelz
          </motion.p>

          {/* Two masked lines, revealed in sequence so the second lands as a
              beat rather than as more of the same. */}
          <h2 className="font-display mt-7 text-[2.4rem] font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-[4.1rem]">
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span className="block" variants={reduced ? undefined : maskLine}>
                Mood strips,
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className="font-tagline block italic text-[#8a5f7d]"
                variants={reduced ? undefined : maskLine}
              >
                on demand
              </motion.span>
            </span>
          </h2>

          <motion.div
            className="mx-auto mt-9 h-px w-14 bg-ink/15"
            initial={reduced ? undefined : { scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5, ease: EASE }}
          />
        </motion.div>

        {/* Cards. Editorial objects: hairline border, soft ivory surface,
            generous internal rhythm, and no drop shadow at rest. */}
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4 lg:gap-7">
          {products.map((product, index) => {
            const style = moodStyleFor(product.name);
            return (
              <motion.div
                key={product.id}
                custom={index}
                variants={reduced ? undefined : cardVariants}
                initial={reduced ? undefined : "hidden"}
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-ink/[0.09] bg-[#fdfaf5] transition-all duration-500 ease-out hover:-translate-y-1 hover:border-ink/20 hover:bg-white"
              >
                {/* Accent hairline that only surfaces on hover — the card's
                    one piece of colour, drawn from its own mood gradient. */}
                <span
                  className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: style.badgeBg }}
                  aria-hidden
                />

                <button
                  type="button"
                  onClick={() => setLightboxProduct(product)}
                  aria-label={`View larger image of ${product.name}`}
                  className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden"
                >
                  {product.image_url && (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                      className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                    />
                  )}
                </button>

                <Link href="/feelz" className="flex flex-1 flex-col px-5 pb-6 pt-5">
                  <p className="font-display text-[15px] font-bold tracking-tight text-ink">
                    {product.name}
                  </p>
                  <p className="font-tagline mt-1 text-[12.5px] italic text-ink/55">
                    {style.tagline}
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-ink/[0.07] pt-4 text-left text-[12px] leading-snug text-ink/70">
                    {style.useCases.slice(0, 3).map((useCase) => (
                      <li key={useCase} className="flex items-start gap-2">
                        <span
                          className="mt-[6px] h-1 w-1 shrink-0 rounded-full"
                          style={{ background: style.badgeBg }}
                          aria-hidden
                        />
                        <span>{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-16 text-center"
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
        >
          <Link
            href="/feelz"
            className="group inline-flex items-center gap-2 rounded-full border border-ink/20 px-7 py-3 text-[13px] font-medium text-ink transition-all duration-300 hover:-translate-y-px hover:border-ink/40 hover:bg-white"
          >
            Shop All Feelz
          </Link>
        </motion.div>
      </div>

      <Modal
        isOpen={!!lightboxProduct}
        onClose={() => setLightboxProduct(null)}
        title={lightboxProduct?.name ?? ""}
        panelClassName="max-w-lg"
        bgClassName="bg-white"
      >
        {lightboxProduct?.image_url && (
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
            <Image
              src={lightboxProduct.image_url}
              alt={lightboxProduct.name}
              fill
              sizes="32rem"
              className="object-contain"
            />
          </div>
        )}
        <Link href="/feelz" className="pill-btn mt-4 w-full text-center">
          Shop Feelz
        </Link>
      </Modal>
    </section>
  );
}
