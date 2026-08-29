"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFeelzTeaser } from "@/lib/api";
import { moodStyleFor } from "@/lib/moodStyles";
import { Modal } from "@/components/Modal";
import type { Product } from "@/types/domain";

type TeaserProduct = Pick<Product, "id" | "name" | "image_url">;

// CHAPTER 2 — the breath after the hero.
//
// A plain white section. It previously carried a tinted dissolve, three
// ambient colour fields, a drifting thread and a grain texture; all of that
// was removed on request, leaving only content and its scroll reveals.
//
// The single remaining background element is a short, entirely neutral
// dark-to-white blend at the very top — without it the hero's near-black
// would meet white as a hard horizontal line.
const EASE = [0.22, 0.61, 0.36, 1] as const;

export function FeelzTeaserSection() {
  const teaserQuery = useQuery({
    queryKey: ["products", "feelz-teaser"],
    queryFn: () => getFeelzTeaser(createClient()),
  });
  const products = teaserQuery.data ?? [];
  const [lightboxProduct, setLightboxProduct] = useState<TeaserProduct | null>(null);

  const reduced = !!useReducedMotion();

  // The scroll-linked ambient drift that used to live here (two glow fields
  // and the thread) is gone along with the layers it moved, so the section
  // no longer runs any scroll listener at all.

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
    <section id="feelz-teaser" className="relative isolate overflow-hidden bg-white">
      {/* Plain white section. The tinted dissolve, the three ambient colour
          fields, the drifting thread, the grain texture, and the dark-to-white
          blend at the top have all been removed — the only thing behind the
          content is white, full stop. */}

      <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-16 sm:px-8 sm:pb-28 sm:pt-20">
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
                Elevate your Mood
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className="font-tagline block italic text-[#8a5f7d]"
                variants={reduced ? undefined : maskLine}
              >
                with Feelz
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
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-ink/[0.09] bg-white transition-all duration-500 ease-out hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_14px_34px_-22px_rgba(17,17,16,0.35)]"
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
