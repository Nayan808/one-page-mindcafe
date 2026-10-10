"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Gift, Loader2, Plus, Trash2, X } from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import { formatInr } from "@/lib/utils";
import { moodStyleFor } from "@/lib/moodStyles";
import { useAddBundle } from "@/lib/useAddBundle";
import { AUTO_DISCOUNT_MIN_SUBTOTAL, autoDiscountFor, discountableSubtotal, isBundleLine, unitPriceOf } from "@/lib/pricing";
import type { CartItemWithVariant } from "@/types/domain";

// Mini-cart popup — line items + qty + subtotal, then a single "go to
// checkout" that navigates to /checkout. Fulfillment/payment/tracking all
// live on that route now, not here; this stays a lightweight, always-
// mounted popup so the header cart button and "add to cart" success both
// keep their instant open/close animation.
//
// The Feelz Bundle is its own product/line (products.is_bundle) at a fixed
// price; the 10% shown here is the same automatic rule create-order
// charges (lib/pricing.ts): 10% off the non-bundle items once they alone
// reach ₹300. Checkout may still swap it for a bigger coupon.
export function CartDrawer() {
  const { isDrawerOpen, closeDrawer, items, subtotal, isLoading } = useCartContext();
  const router = useRouter();
  const bundle = useAddBundle({ onAuthRequired: closeDrawer });

  const singlesSubtotal = discountableSubtotal(items);
  const autoDiscount = autoDiscountFor(items);
  const hasBundle = items.some(isBundleLine);

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
              <BundleUpsell bundle={bundle} />
            </div>
          ) : (
            <div className="space-y-6">
              <ul className="space-y-3">
                {items.map((item) =>
                  isBundleLine(item) ? (
                    <li key={item.id} className="overflow-hidden rounded-2xl border-2 border-feelz-berry/40 bg-feelz-paper">
                      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-feelz-orange/15 via-feelz-berry/15 to-feelz-rest/15 px-4 py-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-feelz-ink">
                          <Gift className="h-3.5 w-3.5 text-feelz-berry" aria-hidden />
                          All 4 moods · 40 strips
                        </p>
                        {bundle.savings > 0 && (
                          <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                            Save {formatInr(bundle.savings * item.quantity)}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <CartLine
                          item={item}
                          strikePrice={bundle.regularPrice !== null ? bundle.regularPrice * item.quantity : null}
                        />
                      </div>
                    </li>
                  ) : (
                    <li key={item.id} className="rounded-2xl border border-feelz-ink/10 bg-feelz-paper p-3">
                      <CartLine item={item} />
                    </li>
                  ),
                )}
              </ul>

              {!hasBundle && <BundleUpsell bundle={bundle} />}

              <div className="space-y-2 border-t border-feelz-ink/10 pt-3 text-sm text-feelz-ink">
                <div className={`flex items-center justify-between ${autoDiscount > 0 ? "text-feelz-ink/60" : "font-semibold"}`}>
                  <span>Subtotal</span>
                  <span>{formatInr(subtotal)}</span>
                </div>
                {autoDiscount > 0 ? (
                  <>
                    <div className="flex items-center justify-between font-semibold text-emerald-700">
                      <span>10% off{hasBundle ? " (excl. bundle)" : ""}</span>
                      <span>−{formatInr(autoDiscount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-bold">
                      <span>You pay</span>
                      <span>{formatInr(subtotal - autoDiscount)}</span>
                    </div>
                  </>
                ) : (
                  singlesSubtotal > 0 && (
                    <p className="text-xs text-feelz-ink/50">
                      Add {formatInr(AUTO_DISCOUNT_MIN_SUBTOTAL - singlesSubtotal)} more
                      {hasBundle ? " (besides the bundle)" : ""} to get 10% off.
                    </p>
                  )
                )}
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

// One cart line — thumbnail, name, remove, qty stepper, line total.
// `strikePrice` (bundle lines) shows the separately-bought price crossed out.
function CartLine({ item, strikePrice = null }: { item: CartItemWithVariant; strikePrice?: number | null }) {
  const { updateQuantity, removeItem } = useCartContext();
  const name = item.product_variants.products.name;
  const lineTotal = unitPriceOf(item) * item.quantity;

  return (
    <div className="flex gap-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
        <Image src={moodStyleFor(name).catalogueSrc} alt={name} fill sizes="64px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-feelz-ink">{name}</span>
          <button
            type="button"
            onClick={() => removeItem.mutate(item.id)}
            className="shrink-0 text-red-600 hover:text-red-700"
            aria-label={`Remove ${name} from cart`}
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
            <span className="min-w-[1.5rem] text-center text-sm font-semibold text-feelz-ink">{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
              className="px-3 py-1 text-sm font-bold text-feelz-ink"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <span className="flex items-baseline gap-1.5">
            {strikePrice !== null && strikePrice > lineTotal && (
              <span className="text-xs font-semibold text-feelz-ink/40 line-through">{formatInr(strikePrice)}</span>
            )}
            <span className="font-semibold text-feelz-ink/70">{formatInr(lineTotal)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// Offered whenever the cart has no bundle yet (and it's in stock): one tap
// adds the Feelz Bundle product. Signed-out shoppers get the drawer closed
// first (see useAddBundle's onAuthRequired) so the sign-in modal isn't
// stacked underneath it; the add resumes after sign-in.
function BundleUpsell({ bundle }: { bundle: ReturnType<typeof useAddBundle> }) {
  if (!bundle.isAvailable || !bundle.inStock || bundle.savings <= 0) return null;

  return (
    <div className="rounded-2xl border-2 border-dashed border-feelz-berry/40 bg-gradient-to-r from-feelz-orange/10 via-feelz-berry/10 to-feelz-rest/10 p-4 text-left">
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
          <Image src={moodStyleFor("feelz bundle").catalogueSrc} alt="" fill sizes="48px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1 text-sm text-feelz-ink">
          <p className="flex items-center gap-1.5 font-semibold">
            <Gift className="h-4 w-4 shrink-0 text-feelz-berry" aria-hidden />
            Get the Feelz Bundle
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-feelz-ink/60">
            All 4 moods, 40 strips —{" "}
            {bundle.regularPrice !== null && <span className="line-through">{formatInr(bundle.regularPrice)}</span>}{" "}
            <span className="font-semibold text-feelz-ink">{formatInr(bundle.price)}</span>.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={bundle.addBundle}
        disabled={!bundle.canAdd}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-600 py-2.5 text-xs font-bold uppercase tracking-label text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {bundle.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
        Add bundle · save {formatInr(bundle.savings)}
      </button>
      {bundle.hasError && <p className="mt-1.5 text-center text-xs font-medium text-red-600">Couldn&apos;t add, try again</p>}
    </div>
  );
}
