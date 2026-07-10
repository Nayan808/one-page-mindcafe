"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFeelzCatalog } from "@/lib/api";
import { queryKeys } from "@/lib/query/hooks";
import { useCartContext } from "@/contexts/CartContext";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MoodProductCard } from "@/components/MoodProductCard";
import { StatsBar } from "@/components/StatsBar";
import { ZostelNetworkSection } from "@/components/ZostelNetworkSection";
import { HeadsUpSection } from "@/components/HeadsUpSection";
import { Footer } from "@/components/Footer";
import { FulfillmentAndPayment } from "@/components/FulfillmentAndPayment";
import { OrderConfirmation } from "@/components/OrderConfirmation";
import { formatInr } from "@/lib/utils";

const MOOD_ORDER = ["focus", "extrovert", "joy", "rest", "sleep"];

export default function Home() {
  const { items, subtotal, updateQuantity, removeItem, isLoading: cartLoading } = useCartContext();

  const [orderId, setOrderId] = useState<string | null>(null);

  const catalogQuery = useQuery({
    queryKey: queryKeys.feelzCatalog(),
    queryFn: () => getFeelzCatalog(createClient()),
  });
  // Brand order (focus, extrovert, joy, rest/sleep) rather than the
  // alphabetical order the DB query returns — matches the numbered
  // "no. 01 · feelz" labels on each card.
  const products = [...(catalogQuery.data ?? [])].sort(
    (a, b) => MOOD_ORDER.indexOf(a.name.toLowerCase()) - MOOD_ORDER.indexOf(b.name.toLowerCase()),
  );

  return (
    <>
      <Header />
      <Hero />

      <section id="products" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {catalogQuery.isLoading ? (
          <p className="text-center text-sm text-ink/60">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="text-center text-sm text-ink/60">No products available right now.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {products.map((product, index) => (
              <MoodProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </section>

      <StatsBar />
      <ZostelNetworkSection />

      <section id="checkout" className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        {orderId ? (
          <OrderConfirmation
            orderId={orderId}
            onStartNewOrder={() => setOrderId(null)}
          />
        ) : (
          <div>
            <h2 className="font-display mb-6 text-center text-3xl font-bold lowercase">your cart</h2>

            {cartLoading ? (
              <p className="text-center text-sm text-ink/60">Loading cart…</p>
            ) : items.length === 0 ? (
              <p className="text-center text-sm text-ink/60">
                Your cart is empty — add a mood strip above to get started.
              </p>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <ul className="space-y-3">
                    {items.map((item) => {
                      const price = item.product_variants.price_override ?? item.product_variants.products.price;
                      return (
                        <li key={item.id} className="rounded-xl border border-ink/15 bg-white p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-ink">{item.product_variants.products.name}</span>
                            <button
                              type="button"
                              onClick={() => removeItem.mutate(item.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              remove
                            </button>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-ink/60">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(event) =>
                                updateQuantity.mutate({
                                  cartItemId: item.id,
                                  quantity: Math.max(1, Number(event.target.value)),
                                })
                              }
                              className="input w-16"
                            />
                            <span>{formatInr(price * item.quantity)}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex items-center justify-between border-t border-ink/10 pt-3 text-sm font-medium">
                    <span>Subtotal</span>
                    <span>{formatInr(subtotal)}</span>
                  </div>
                </div>

                <div>
                  <FulfillmentAndPayment onOrderPlaced={setOrderId} />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <HeadsUpSection />
      <Footer />
    </>
  );
}
