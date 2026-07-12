"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFeelzTeaser } from "@/lib/api";
import { moodStyleFor } from "@/lib/moodStyles";

// Homepage teaser — name + image only, no pricing/add-to-cart (spec 4.1).
// Every card links to /feelz, where the real shopping experience lives.
export function FeelzTeaserSection() {
  const teaserQuery = useQuery({
    queryKey: ["products", "feelz-teaser"],
    queryFn: () => getFeelzTeaser(createClient()),
  });
  const products = teaserQuery.data ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">feelz</p>
        <h2 className="font-display mt-2 text-3xl font-bold lowercase text-ink sm:text-4xl">mood strips, on demand</h2>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {products.map((product) => {
          const style = moodStyleFor(product.name);
          return (
            <Link
              key={product.id}
              href="/feelz"
              className="group block overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition-shadow hover:shadow-md"
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
              <p className="font-display px-3 py-3 text-center text-sm font-bold lowercase text-ink">{product.name}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Link href="/feelz" className="pill-btn-outline">
          shop all feelz
        </Link>
      </div>
    </section>
  );
}
