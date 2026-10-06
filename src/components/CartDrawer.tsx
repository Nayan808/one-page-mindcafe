"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2, X } from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import { formatInr } from "@/lib/utils";
import { moodStyleFor } from "@/lib/moodStyles";

// Mini-cart popup — line items + qty + subtotal, then a single "go to
// checkout" that navigates to /checkout. Fulfillment/payment/tracking all
// live on that route now, not here; this stays a lightweight, always-
// mounted popup so the header cart button and "add to cart" success both
// keep their instant open/close animation.
export function CartDrawer() {
  const { isDrawerOpen, closeDrawer, items, subtotal, updateQuantity, removeItem, isLoading } = useCartContext();
  const router = useRouter();

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

  function goToProducts() {
    closeDrawer();
    router.push("/feelz");
  }

  function handleCheckout() {
    closeDrawer();
    router.push("/checkout");
  }

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
        className={`relative flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl bg-feelz-cream shadow-2xl transition-all duration-300 ${isDrawerOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"}`}
      >
        <div className="flex items-center justify-between border-b border-feelz-ink/10 px-5 py-4">
          <h2 className="font-display text-xl font-bold text-feelz-ink">Your cart</h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-feelz-ink/15 text-feelz-ink transition hover:bg-feelz-ink/5"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="scrollbar-hide flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <p className="text-sm text-feelz-ink/60">Loading cart…</p>
          ) : items.length === 0 ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-feelz-ink/60">Your cart is empty. Add a mood strip to get started.</p>
              <button type="button" onClick={goToProducts} className="pill-btn">
                Buy Feelz
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <ul className="space-y-3">
                {items.map((item) => {
                  const price = item.product_variants.price_override ?? item.product_variants.products.price;
                  return (
                    <li key={item.id} className="flex gap-3 rounded-2xl border border-feelz-ink/10 bg-feelz-paper p-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                        <Image
                          src={moodStyleFor(item.product_variants.products.name).catalogueSrc}
                          alt={item.product_variants.products.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-feelz-ink">{item.product_variants.products.name}</span>
                          <button
                            type="button"
                            onClick={() => removeItem.mutate(item.id)}
                            className="shrink-0 text-red-600 hover:text-red-700"
                            aria-label={`Remove ${item.product_variants.products.name} from cart`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-feelz-ink/15">
                            <button
                              type="button"
                              onClick={() =>
                                item.quantity <= 1
                                  ? removeItem.mutate(item.id)
                                  : updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })
                              }
                              className="px-3 py-1 text-sm font-bold text-feelz-ink"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="min-w-[1.5rem] text-center text-sm font-semibold text-feelz-ink">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
                              className="px-3 py-1 text-sm font-bold text-feelz-ink"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-semibold text-feelz-ink/70">{formatInr(price * item.quantity)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-between border-t border-feelz-ink/10 pt-3 text-sm font-semibold text-feelz-ink">
                <span>Subtotal</span>
                <span>{formatInr(subtotal)}</span>
              </div>

              <button type="button" onClick={handleCheckout} className="pill-btn w-full">
                Go to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
