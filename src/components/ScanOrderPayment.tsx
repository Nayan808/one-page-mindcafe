"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { createClient } from "@/lib/supabase/client";
import { checkout, validateCoupon, type CouponPreview } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { formatInr } from "@/lib/utils";

// Locked-down sibling of FulfillmentAndPayment for the scan-and-order
// flow: always takeaway at the Zostel already picked earlier in the
// wizard, always logged in (the wizard only ever renders this once `user`
// exists), so there's no delivery mode and no guest name/phone/email form
// to show. Goes through the same real checkout()/create-order Edge
// Function as every other order — nothing here is a parallel/mocked path.
export function ScanOrderPayment({
  locationId,
  onBack,
  onOrderPlaced,
}: {
  locationId: string;
  onBack: () => void;
  onOrderPlaced: (orderId: string) => void;
}) {
  const { user, profile } = useAuth();
  const { cartId, items, subtotal, updateQuantity, removeItem } = useCartContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  // Only trust the applied preview while the input still matches what was
  // checked — editing the code after applying shouldn't silently keep
  // discounting at the old value. Same rule FulfillmentAndPayment uses.
  const discountAmount = appliedCoupon?.code === couponCode.trim().toUpperCase() ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal - discountAmount);

  async function handleApplyCoupon() {
    setIsCheckingCoupon(true);
    setCouponError(null);
    try {
      const sb = createClient();
      const result = await validateCoupon(sb, couponCode, subtotal);
      setAppliedCoupon(result);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : "Couldn't apply coupon");
    } finally {
      setIsCheckingCoupon(false);
    }
  }

  async function handlePlaceOrder() {
    if (!cartId || items.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    const sb = createClient();

    try {
      const result = await checkout(sb, {
        cartId,
        items: items.map((item) => ({ variantId: item.variant_id, quantity: item.quantity })),
        fulfillment: { type: "takeaway", locationId },
        couponCode: couponCode.trim() || undefined,
        guest: undefined,
      });

      if (result.free) {
        onOrderPlaced(result.order_id);
        return;
      }

      await openRazorpayCheckout({
        keyId: result.key_id,
        amount: result.amount,
        currency: result.currency,
        razorpayOrderId: result.razorpay_order_id,
        name: "Mindcafe",
        prefill: {
          name: profile?.full_name ?? undefined,
          email: user?.email ?? undefined,
          contact: profile?.phone ?? undefined,
        },
        onSuccess: () => onOrderPlaced(result.order_id),
        onDismiss: () => {
          setError("Payment was cancelled. Your order is saved as pending.");
          setIsSubmitting(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong placing your order.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Pay for your order</h1>
        <p className="mt-1 text-sm text-ink/60">Pickup at the Zostel you selected.</p>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const price = item.product_variants.price_override ?? item.product_variants.products.price;
          return (
            <li key={item.id} className="rounded-xl border border-ink/15 bg-white p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink">{item.product_variants.products.name}</span>
                <span className="text-ink/60">{formatInr(price * item.quantity)}</span>
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
                    aria-label={`Decrease ${item.product_variants.products.name} quantity`}
                  >
                    −
                  </button>
                  <span className="min-w-[1.5rem] text-center text-sm font-semibold text-ink">{item.quantity}</span>
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
                  className="text-xs font-medium text-ink/50 underline hover:text-ink"
                >
                  remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div>
        <label className="mb-1 block text-sm text-ink/70">Coupon code (optional)</label>
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(event) => {
              setCouponCode(event.target.value);
              setAppliedCoupon(null);
              setCouponError(null);
            }}
            onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), handleApplyCoupon())}
            placeholder="Enter coupon code"
            className="input uppercase"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={!couponCode.trim() || isCheckingCoupon || discountAmount > 0}
            className="pill-btn-outline shrink-0 !py-2 text-xs normal-case tracking-normal"
          >
            {isCheckingCoupon ? "Checking…" : discountAmount > 0 ? "Applied" : "Apply"}
          </button>
        </div>
        {couponError && <p className="mt-1.5 text-sm text-red-600">{couponError}</p>}
        {discountAmount > 0 && (
          <p className="mt-1.5 text-sm text-emerald-700">
            &ldquo;{appliedCoupon!.code}&rdquo; applied, {formatInr(discountAmount)} off
          </p>
        )}
      </div>

      <div className="rounded-xl border border-ink/15 bg-white p-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatInr(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Coupon ({appliedCoupon!.code})</span>
            <span>−{formatInr(discountAmount)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 font-medium">
          <span>Total</span>
          <span>{formatInr(total)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={onBack} disabled={isSubmitting} className="pill-btn-outline flex-1">
          back
        </button>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={!cartId || items.length === 0 || isSubmitting}
          className="pill-btn flex-1"
        >
          {isSubmitting ? "Processing…" : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
