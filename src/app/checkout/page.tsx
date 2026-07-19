"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const { items, subtotal, isLoading } = useCartContext();

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
        <p className="text-sm text-ink/60">Your cart is empty — redirecting…</p>
      ) : (
        <div className="space-y-6">
          <h1 className="font-display text-3xl font-bold lowercase">checkout</h1>

          <ul className="space-y-2">
            {items.map((item) => {
              const price = item.product_variants.price_override ?? item.product_variants.products.price;
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-ink/15 bg-cream p-3 text-sm"
                >
                  <span className="font-medium text-ink">
                    {item.product_variants.products.name} × {item.quantity}
                  </span>
                  <span className="text-ink/60">{formatInr(price * item.quantity)}</span>
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
