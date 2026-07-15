"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFeelzTeaser } from "@/lib/api";
import { moodStyleFor } from "@/lib/moodStyles";
import { Reveal } from "@/components/Reveal";

// Homepage teaser — name + image only, no pricing/add-to-cart (spec 4.1).
// Every card links to /feelz, where the real shopping experience lives.
export function FeelzTeaserSection() {
  const teaserQuery = useQuery({
    queryKey: ["products", "feelz-teaser"],
    queryFn: () => getFeelzTeaser(createClient()),
  });
  const products = teaserQuery.data ?? [];

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
              <Reveal key={product.id} delayMs={index * 80}>
                <Link
                  href="/feelz"
                  className="group block overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden" style={{ background: style.gradient }}>
                    {product.image_url && (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="(min-width: 768px) 22vw, 45vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    )}
                  </div>
                  <p className="font-display px-3 py-3.5 text-center text-sm font-bold lowercase text-ink">{product.name}</p>
                </Link>
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
    </section>
  );
}
