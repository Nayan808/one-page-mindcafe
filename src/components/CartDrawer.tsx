"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import { FulfillmentAndPayment } from "@/components/FulfillmentAndPayment";
import { OrderConfirmation } from "@/components/OrderConfirmation";
import { formatInr } from "@/lib/utils";

function goToProducts(closeDrawer: () => void) {
  closeDrawer();
  document.getElementById("mood-picks")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Cart + checkout as a centered popup rather than a page section — opened
// from the header cart button or right after an "add to cart". Always
// mounted (not conditionally rendered) so the open/close transition can
// actually animate instead of popping in and out.
export function CartDrawer() {
  const { isDrawerOpen, closeDrawer, items, subtotal, updateQuantity, removeItem, isLoading } = useCartContext();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!isDrawerOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen, closeDrawer]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDrawerOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isDrawerOpen}
    >
      <button
        type="button"
        aria-label="Close cart"
        tabIndex={isDrawerOpen ? 0 : -1}
        onClick={closeDrawer}
        className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`relative flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl bg-cream shadow-2xl transition-all duration-300 ${isDrawerOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"}`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-xl font-bold lowercase">{orderId ? "order placed" : "your cart"}</h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="scrollbar-hide flex-1 overflow-y-auto px-5 py-4">
          {orderId ? (
            <OrderConfirmation
              orderId={orderId}
              onStartNewOrder={() => {
                setOrderId(null);
                closeDrawer();
              }}
            />
          ) : isLoading ? (
            <p className="text-sm text-ink/60">Loading cart…</p>
          ) : items.length === 0 ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-ink/60">Your cart is empty — add a mood strip to get started.</p>
              <button type="button" onClick={() => goToProducts(closeDrawer)} className="pill-btn">
                buy feelz
              </button>
            </div>
          ) : (
            <div className="space-y-6">
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
                          className="text-red-600 hover:text-red-700"
                          aria-label={`Remove ${item.product_variants.products.name} from cart`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-ink/15">
                          <button
                            type="button"
                            onClick={() =>
                              item.quantity <= 1
                                ? removeItem.mutate(item.id)
                                : updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })
                            }
                            className="px-3 py-1.5 text-sm font-bold text-ink"
                            aria-label="Decrease quantity"
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
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-ink/60">{formatInr(price * item.quantity)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-between border-t border-ink/10 pt-3 text-sm font-medium">
                <span>Subtotal</span>
                <span>{formatInr(subtotal)}</span>
              </div>

              <FulfillmentAndPayment onOrderPlaced={setOrderId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
