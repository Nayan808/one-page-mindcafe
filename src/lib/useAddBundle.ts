"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getAvailableStock, getFeelzCatalog } from "@/lib/api";
import { queryKeys } from "@/lib/query/hooks";
import { useCartContext } from "@/contexts/CartContext";
import { MOOD_GRID, FEELZ_BUNDLE_PRICE } from "@/lib/moodStyles";
import type { ProductWithVariants } from "@/types/domain";

function priceOf(product: ProductWithVariants) {
  return product.product_variants[0].price_override ?? product.price;
}

// "Add the Feelz Bundle" for every bundle entry point — the /feelz grid
// card (Hero.tsx), the cart upsell (CartDrawer.tsx) and the product pages
// (FeelzProductPageContent.tsx). The bundle is its own product
// (products.is_bundle) with its own stock, so this adds one cart line, not
// four packs. Like every add-to-cart entry point, it needs no sign-in:
// guests shop on a guest cart and sign in at "Pay Now".
export function useAddBundle() {
  const { items, addItem, isReady, cartId, notifyAdded } = useCartContext();
  const [isPending, setIsPending] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const catalogQuery = useQuery({
    queryKey: queryKeys.feelzCatalog(),
    queryFn: () => getFeelzCatalog(createClient()),
  });

  const product = catalogQuery.data?.find((p) => p.is_bundle && p.product_variants[0]);
  const variant = product?.product_variants[0];

  const stockQuery = useQuery({
    queryKey: ["available-stock", variant?.id ?? null],
    queryFn: () => getAvailableStock(createClient(), variant!.id),
    enabled: !!variant,
  });
  const inStock = stockQuery.data === undefined ? true : stockQuery.data > 0;

  const price = product ? priceOf(product) : FEELZ_BUNDLE_PRICE;
  // What the four moods would cost bought separately — shown struck
  // through next to the bundle price so the saving is visible.
  const moods = MOOD_GRID.map((m) => catalogQuery.data?.find((p) => p.name.trim().toLowerCase() === m.key));
  const regularPrice = moods.every((p): p is ProductWithVariants => !!p?.product_variants[0])
    ? moods.reduce((sum, p) => sum + priceOf(p), 0)
    : null;
  const savings = regularPrice !== null ? Math.max(0, regularPrice - price) : 0;

  const cartItem = variant ? items.find((item) => item.variant_id === variant.id) : undefined;

  async function performAdd() {
    if (!product || !variant || !isReady || !cartId) return;
    setIsPending(true);
    setHasError(false);
    try {
      await addItem.mutateAsync({
        variant,
        product: { id: product.id, name: product.name, image_url: product.image_url, price: product.price, is_bundle: true },
        quantity: 1,
      });
      notifyAdded(product.name, 1);
      setIsAdded(true);
      window.setTimeout(() => setIsAdded(false), 1800);
    } catch (error) {
      console.error("Failed to add bundle to cart", error);
      setHasError(true);
      window.setTimeout(() => setHasError(false), 2400);
    } finally {
      setIsPending(false);
    }
  }

  async function addBundle() {
    await performAdd();
  }

  return {
    addBundle,
    /** The bundle product exists in the catalog. */
    isAvailable: !!variant,
    inStock,
    canAdd: !!variant && inStock && isReady && !!cartId && !isPending,
    cartItem,
    price,
    regularPrice,
    savings,
    isPending,
    isAdded,
    hasError,
  };
}
