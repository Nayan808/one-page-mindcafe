"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFeelzTeaser } from "@/lib/api";
import { moodStyleFor } from "@/lib/moodStyles";
import { Reveal } from "@/components/Reveal";
import { Modal } from "@/components/Modal";
import type { Product } from "@/types/domain";

type TeaserProduct = Pick<Product, "id" | "name" | "image_url">;

// Homepage teaser — name + image only, no pricing/add-to-cart (spec 4.1).
// Clicking a card's image opens it larger in a lightbox (with a close
// button); clicking the name below still goes to /feelz, where the real
// shopping experience lives.
export function FeelzTeaserSection() {
  const teaserQuery = useQuery({
    queryKey: ["products", "feelz-teaser"],
    queryFn: () => getFeelzTeaser(createClient()),
  });
  const products = teaserQuery.data ?? [];
  const [lightboxProduct, setLightboxProduct] = useState<TeaserProduct | null>(null);

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">feelz</p>
          <h2 className="font-display mt-2 text-4xl font-bold tracking-tight lowercase text-ink sm:text-5xl">
            mood strips, on demand
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {products.map((product, index) => {
            const style = moodStyleFor(product.name);
            return (
              <Reveal key={product.id} delayMs={index * 80} className="h-full">
                <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <button
                    type="button"
                    onClick={() => setLightboxProduct(product)}
                    aria-label={`View larger image of ${product.name}`}
                    className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-white"
                  >
                    {product.image_url && (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="(min-width: 768px) 22vw, 45vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    )}
                  </button>
                  <Link href="/feelz" className="flex flex-1 flex-col px-3 py-3.5 text-center">
                    <p className="font-display text-sm font-bold lowercase text-ink">{product.name}</p>
                    <p className="font-tagline mt-0.5 text-xs italic text-ink/60">{style.tagline}</p>
                    <ul className="mt-2 space-y-1 text-left text-xs leading-snug text-ink/70">
                      {style.useCases.slice(0, 3).map((useCase) => (
                        <li key={useCase}>— {useCase}</li>
                      ))}
                    </ul>
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/feelz" className="pill-btn-outline">
            shop all feelz
          </Link>
        </div>
      </div>

      <Modal isOpen={!!lightboxProduct} onClose={() => setLightboxProduct(null)} title={lightboxProduct?.name ?? ""} panelClassName="max-w-lg">
        {lightboxProduct?.image_url && (
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
            <Image src={lightboxProduct.image_url} alt={lightboxProduct.name} fill sizes="32rem" className="object-contain" />
          </div>
        )}
        <Link href="/feelz" className="pill-btn mt-4 w-full text-center">
          shop feelz
        </Link>
      </Modal>
    </section>
  );
}
