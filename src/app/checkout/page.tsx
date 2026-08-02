"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import { FulfillmentAndPayment } from "@/components/FulfillmentAndPayment";
import { OrderConfirmation } from "@/components/OrderConfirmation";
import { formatInr } from "@/lib/utils";

// Real checkout route — cart summary + fulfillment/payment, or (once
// ?order= is set after a successful payment) the tracking/confirmation
// view. Both used to live inside the CartDrawer modal; this is a direct
// relocation, not a redesign. Guest checkout is fully supported here —
// this route must never require sign-in.
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const { items, subtotal, isLoading, updateQuantity, removeItem } = useCartContext();

  useEffect(() => {
    if (orderId || isLoading || items.length > 0) return;
    router.replace("/feelz");
  }, [orderId, isLoading, items.length, router]);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      {orderId ? (
        <OrderConfirmation orderId={orderId} onStartNewOrder={() => router.push("/feelz")} />
      ) : isLoading ? (
        <p className="text-sm text-ink/60">Loading cart…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink/60">Your cart is empty. Redirecting…</p>
      ) : (
        <div className="space-y-6">
          <h1 className="font-display text-4xl font-bold">Checkout</h1>

          <ul className="space-y-2">
            {items.map((item) => {
              const price = item.product_variants.price_override ?? item.product_variants.products.price;
              return (
                <li key={item.id} className="rounded-xl border border-ink/15 bg-cream p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink">{item.product_variants.products.name}</span>
                    <span className="text-ink/60">{formatInr(price * item.quantity)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-ink/15 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          item.quantity <= 1
                            ? removeItem.mutate(item.id)
                            : updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })
                        }
                        className="px-3 py-1.5 text-sm font-bold text-ink"
                        aria-label={`Decrease ${item.product_variants.products.name} quantity`}
                      >
                        −
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold text-ink">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
                        className="px-3 py-1.5 text-sm font-bold text-ink"
                        aria-label={`Increase ${item.product_variants.products.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem.mutate(item.id)}
                      aria-label={`Remove ${item.product_variants.products.name}`}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between border-t border-ink/10 pt-3 text-sm font-medium">
            <span>Subtotal</span>
            <span>{formatInr(subtotal)}</span>
          </div>

          <FulfillmentAndPayment onOrderPlaced={(id) => router.push(`/checkout?order=${id}`)} />
        </div>
      )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white">
          <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 text-sm text-ink/60">Loading…</div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
