"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAvailableStock } from "@/lib/api";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatInr } from "@/lib/utils";
import { moodStyleFor } from "@/lib/moodStyles";
import type { ProductWithVariants } from "@/types/domain";

const TEXT_COLOR: Record<string, string> = {
  focus: "#f6f1e6",
  extrovert: "#111110",
  joy: "#111110",
  rest: "#f6f1e6",
  sleep: "#f6f1e6",
};

export function MoodProductCard({ product, index }: { product: ProductWithVariants; index: number }) {
  const key = product.name.trim().toLowerCase();
  const mood = moodStyleFor(product.name);
  const textColor = TEXT_COLOR[key] ?? "#f6f1e6";

  const [variantId, setVariantId] = useState(product.product_variants[0]?.id ?? "");
  const variant = product.product_variants.find((v) => v.id === variantId);
  const [quantity, setQuantity] = useState(1);
  const [available, setAvailable] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { addItem, isReady, openDrawer } = useCartContext();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!variantId) return;
    let cancelled = false;
    const sb = createClient();
    getAvailableStock(sb, variantId)
      .then((stock) => {
        if (!cancelled) setAvailable(stock);
      })
      .catch(() => {
        if (!cancelled) setAvailable(null);
      });
    return () => {
      cancelled = true;
    };
  }, [variantId]);

  const isOutOfStock = available !== null && available <= 0;
  const price = variant?.price_override ?? product.price;

  async function handleAddToCart() {
    if (!variant) return;
    if (!user) {
      router.push("/login?returnTo=%2Ffeelz");
      return;
    }
    await addItem.mutateAsync({
      variant,
      product: { id: product.id, name: product.name, image_url: product.image_url, price: product.price },
      quantity,
    });
    openDrawer();
  }

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] p-6 shadow-lg sm:p-7"
      style={{ background: mood.gradient, color: textColor }}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-label opacity-80">
          no. 0{index + 1} · feelz
        </span>
        <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold backdrop-blur">
          {formatInr(price)}
        </span>
      </div>

      <h3 className="font-display mt-3 text-4xl font-bold lowercase leading-none sm:text-5xl">{product.name}</h3>
      <p className="font-tagline mt-1 text-base italic opacity-90">{mood.tagline}</p>

      <div className="mt-5 flex items-start gap-4">
        <div
          className="hidden h-24 w-16 shrink-0 -rotate-6 rounded-lg border-2 border-white/40 shadow-md sm:flex sm:flex-col sm:items-center sm:justify-center"
          style={{ background: mood.badgeBg }}
          aria-hidden
        >
          <span className="text-[9px] font-semibold uppercase text-white/90">feelz</span>
          <span className="text-[10px] font-bold lowercase text-white">{key}</span>
        </div>

        <ul className="space-y-1 text-sm opacity-90">
          {mood.useCases.map((useCase) => (
            <li key={useCase}>— {useCase}</li>
          ))}
        </ul>
      </div>

      {product.product_variants.length > 1 && (
        <select
          value={variantId}
          onChange={(event) => setVariantId(event.target.value)}
          className="mt-4 w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-inherit"
        >
          {product.product_variants.map((v) => (
            <option key={v.id} value={v.id} className="text-ink">
              {v.variant_label}
            </option>
          ))}
        </select>
      )}

      <p className="mt-4 text-xs font-medium opacity-80">
        {available === null
          ? "checking stock…"
          : isOutOfStock
            ? "out of stock"
            : available <= 5
              ? `only ${available} left`
              : "in stock"}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center rounded-full bg-white/15">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-sm font-bold"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="min-w-[1.5rem] text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-2 text-sm font-bold"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isReady || isOutOfStock || addItem.isPending || !variant}
          className="flex-1 rounded-full bg-black/85 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
        >
          {addItem.isPending ? "adding…" : user ? "add to cart" : "sign in to add"}
        </button>
      </div>

      {product.description && (
        <div className="mt-4 border-t border-white/20 pt-3">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs font-semibold uppercase tracking-label opacity-80"
          >
            what&apos;s inside {showDetails ? "↑" : "↓"}
          </button>
          {showDetails && <p className="mt-2 text-sm opacity-90">{product.description}</p>}
        </div>
      )}
    </div>
  );
}
