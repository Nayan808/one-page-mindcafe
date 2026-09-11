"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { createClient } from "@/lib/supabase/client";
import {
  checkPincodeServiceability,
  checkout,
  getActivePickupLocations,
  validateCoupon,
  type CouponPreview,
  type PincodeServiceability,
} from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useAddresses } from "@/lib/query/hooks";
import { AddressForm, type AddressFormValues } from "@/components/AddressForm";
import { PhoneVerifyInline } from "@/components/PhoneVerifyInline";
import { formatInr } from "@/lib/utils";
import type { PickupLocation } from "@/types/domain";

type Mode = "delivery" | "takeaway";

// Auto-applied once the cart crosses this subtotal — delivery/takeaway
// checkout only. Scan-and-order uses its own separate payment component
// (ScanOrderPayment.tsx) that never runs this file's logic at all, so it's
// naturally excluded rather than special-cased here. The ₹300 minimum is
// also enforced server-side via the coupon row's own min_order_amount, so
// this constant is just what triggers the auto-fill — the actual gate
// lives in the database.
const AUTO_COUPON_CODE = "FEELZ10";
const AUTO_COUPON_MIN_SUBTOTAL = 300;

// Delivery or takeaway pickup at a listed Zostel — payment is Razorpay
// only in both cases (pay-online, no cash-on-pickup). No pre-existing
// account is required, but an unverified guest is no longer allowed
// either: anyone not already signed in verifies their phone inline
// (PhoneVerifyInline) before the rest of this form appears. The actual
// order — real prices, coupon, stock, Razorpay order — is all created
// server-side by the create-order Edge Function (lib/api.ts `checkout`),
// never trusting anything computed here.
export function FulfillmentAndPayment({ onOrderPlaced }: { onOrderPlaced: (orderId: string) => void }) {
  const { user, profile } = useAuth();
  const { cartId, items, subtotal } = useCartContext();
  const { addresses, addAddress } = useAddresses(user?.id ?? null);

  const [mode, setMode] = useState<Mode>("delivery");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [serviceability, setServiceability] = useState<PincodeServiceability | "unchecked" | "checking" | "error">(
    "unchecked",
  );
  const [serviceabilityError, setServiceabilityError] = useState<string | null>(null);

  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [pickupSlot, setPickupSlot] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  // Tracks whether the current coupon code came from the auto-apply effect
  // below rather than the customer typing it in themselves — lets the
  // effect clean up after its own discount (e.g. cart drops back under
  // ₹300) without ever touching one the customer applied on purpose.
  const [isAutoCoupon, setIsAutoCoupon] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "takeaway" || locations.length > 0) return;
    const sb = createClient();
    getActivePickupLocations(sb)
      .then(setLocations)
      .catch(() => setLocations([]));
  }, [mode, locations.length]);

  async function handleCheckServiceability(pincode: string) {
    setServiceability("checking");
    setServiceabilityError(null);
    const sb = createClient();
    const cartItems = items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity }));
    try {
      const result = await checkPincodeServiceability(sb, pincode, cartItems);
      setServiceability(result);
    } catch (err) {
      // A failed check (network issue, Shiprocket auth/config problem) is
      // NOT the same as Shiprocket genuinely not covering this pincode —
      // collapsing both into "not serviceable" hides real integration
      // breakage behind what looks like a normal coverage gap.
      setServiceability("error");
      setServiceabilityError(err instanceof Error ? err.message : "Couldn't check delivery availability");
    }
  }

  // Only reachable once `user` is set — the address step is gated behind
  // phone verification below, so there's no guest branch here any more.
  async function handleAddAddress(values: AddressFormValues) {
    const created = await addAddress.mutateAsync({ ...values, user_id: user!.id });
    setSelectedAddressId(created.id);
    setShowNewAddressForm(false);
    await handleCheckServiceability(values.pincode);
  }

  const deliveryFee =
    mode === "delivery" &&
    serviceability !== "unchecked" &&
    serviceability !== "checking" &&
    serviceability !== "error" &&
    serviceability.serviceable
      ? serviceability.deliveryFee
      : 0;
  // Only trust the applied preview while the input still matches what was
  // checked — editing the code after applying shouldn't silently keep
  // discounting at the old value.
  const discountAmount = appliedCoupon?.code === couponCode.trim().toUpperCase() ? appliedCoupon.discountAmount : 0;
  // Delivery is free for every customer right now — create-order applies
  // this server-side too (the FREESHIP coupon, looked up automatically,
  // no code entry from the customer), so the total shown here has to
  // exclude it the same way or this estimate would be wrong.
  const total = Math.max(0, subtotal - discountAmount);

  async function applyCoupon(code: string) {
    setIsCheckingCoupon(true);
    setCouponError(null);
    try {
      const sb = createClient();
      const result = await validateCoupon(sb, code, subtotal);
      setAppliedCoupon(result);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : "Couldn't apply coupon");
    } finally {
      setIsCheckingCoupon(false);
    }
  }

  async function handleApplyCoupon() {
    await applyCoupon(couponCode);
  }

  // Auto-apply: fills in and validates AUTO_COUPON_CODE the moment the
  // cart crosses the threshold, as long as the customer hasn't already
  // typed a code of their own (empty field + nothing applied yet).
  useEffect(() => {
    if (subtotal >= AUTO_COUPON_MIN_SUBTOTAL && !couponCode.trim() && !appliedCoupon && !isCheckingCoupon) {
      setCouponCode(AUTO_COUPON_CODE);
      setIsAutoCoupon(true);
      void applyCoupon(AUTO_COUPON_CODE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, couponCode, appliedCoupon, isCheckingCoupon]);

  // Auto-remove: if the cart drops back under the threshold (item removed
  // etc.), clear the discount this effect applied — but only if it's the
  // one that's still active, so a customer's own valid coupon is never
  // touched here.
  useEffect(() => {
    if (isAutoCoupon && subtotal < AUTO_COUPON_MIN_SUBTOTAL) {
      setCouponCode("");
      setAppliedCoupon(null);
      setIsAutoCoupon(false);
    }
  }, [isAutoCoupon, subtotal]);

  const serviceabilityOk =
    serviceability !== "unchecked" &&
    serviceability !== "checking" &&
    serviceability !== "error" &&
    serviceability.serviceable;
  const hasDeliveryTarget = Boolean(selectedAddressId);

  const canPay =
    items.length > 0 &&
    Boolean(user) &&
    (mode === "delivery" ? hasDeliveryTarget && serviceabilityOk : Boolean(locationId));

  async function handlePlaceOrder() {
    if (!cartId || !canPay) return;
    setIsSubmitting(true);
    setError(null);

    const sb = createClient();

    try {
      const result = await checkout(sb, {
        cartId,
        items: items.map((item) => ({ variantId: item.variant_id, quantity: item.quantity })),
        fulfillment:
          mode === "delivery"
            ? { type: "delivery", addressId: selectedAddressId! }
            : { type: "takeaway", locationId: locationId!, pickupSlot: pickupSlot || undefined },
        couponCode: couponCode.trim() || undefined,
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
          contact: profile?.phone ?? user?.phone ?? undefined,
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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("delivery")}
          className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium ${mode === "delivery" ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/70"}`}
        >
          DIRECT DELIVERY
        </button>
        <button
          type="button"
          onClick={() => setMode("takeaway")}
          className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium ${mode === "takeaway" ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/70"}`}
        >
          TAKEAWAY FROM A ZOSTEL
        </button>
      </div>

      {!user && <PhoneVerifyInline label="Verify your phone to continue" />}

      {user && (user.phone || profile?.phone) && (
        <p className="text-sm text-ink/60">
          We&apos;ll reach you about this order at{" "}
          <span className="font-medium text-ink">{user.phone ? `+${user.phone}` : profile?.phone}</span>.
        </p>
      )}

      {user && (
      <>
      {mode === "delivery" ? (
        <div className="space-y-4">
          {addresses.length > 0 && !showNewAddressForm && (
            <div className="space-y-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className="flex items-start gap-3 rounded-xl border border-ink/15 bg-white p-3 text-sm has-[:checked]:border-ink"
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === address.id}
                    onChange={() => {
                      setSelectedAddressId(address.id);
                      void handleCheckServiceability(address.pincode);
                    }}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-ink">{address.full_name}</span>
                    <span className="block text-ink/60">
                      {address.line1}, {address.city}, {address.state} {address.pincode}
                    </span>
                  </span>
                </label>
              ))}
              <button
                type="button"
                onClick={() => setShowNewAddressForm(true)}
                className="text-sm font-medium text-ink underline"
              >
                + Use a New Address
              </button>
            </div>
          )}

          {(addresses.length === 0 || showNewAddressForm) && (
            <AddressForm onSubmit={handleAddAddress} isSubmitting={addAddress.isPending} />
          )}

          {serviceability === "checking" && <p className="text-sm text-ink/60">Checking serviceability…</p>}
          {serviceability === "error" && (
            <p className="text-sm text-red-700">
              {serviceabilityError ?? "Couldn't check delivery availability"} — please try again.
            </p>
          )}
          {serviceability !== "unchecked" &&
            serviceability !== "checking" &&
            serviceability !== "error" &&
            !serviceability.serviceable && (
              <p className="text-sm text-amber-700">This pincode isn&apos;t serviceable yet. Try takeaway instead.</p>
            )}
          {serviceability !== "unchecked" &&
            serviceability !== "checking" &&
            serviceability !== "error" &&
            serviceability.serviceable && (
              <p className="text-sm text-emerald-700">
                Deliverable —{" "}
                {serviceability.deliveryFee === 0 ? (
                  "free"
                ) : (
                  <>
                    <span className="text-ink/40 line-through">{formatInr(serviceability.deliveryFee)}</span>{" "}
                    <span className="font-semibold">FREE</span>
                  </>
                )}
              </p>
            )}
        </div>
      ) : (
        <div className="space-y-4">
          {locations.length === 0 ? (
            <p className="text-sm text-ink/60">Loading Zostel pickup points…</p>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <label
                  key={location.id}
                  className="flex items-start gap-3 rounded-xl border border-ink/15 bg-white p-3 text-sm has-[:checked]:border-ink"
                >
                  <input
                    type="radio"
                    name="pickup-location"
                    checked={locationId === location.id}
                    onChange={() => setLocationId(location.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-ink">{location.name}</span>
                    <span className="block text-ink/60">
                      {location.address}, {location.city}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-ink/70">Pickup slot (optional)</label>
            <input
              value={pickupSlot}
              onChange={(event) => setPickupSlot(event.target.value)}
              placeholder="e.g. Ready in 2 hours"
              className="input"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm text-ink/70">Coupon code (optional)</label>
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(event) => {
              setCouponCode(event.target.value);
              setAppliedCoupon(null);
              setCouponError(null);
              setIsAutoCoupon(false);
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
            &ldquo;{appliedCoupon!.code}&rdquo; {isAutoCoupon ? "applied automatically" : "applied"}, {formatInr(discountAmount)} off
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
        <div className="flex justify-between">
          <span>{mode === "delivery" ? "Delivery fee" : "Pickup"}</span>
          {mode === "delivery" && deliveryFee > 0 ? (
            <span>
              <span className="text-ink/40 line-through">{formatInr(deliveryFee)}</span>{" "}
              <span className="font-semibold text-emerald-700">FREE</span>
            </span>
          ) : (
            <span>Free</span>
          )}
        </div>
        <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 font-medium">
          <span>Total</span>
          <span>{formatInr(total)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="button" onClick={handlePlaceOrder} disabled={!canPay || isSubmitting} className="pill-btn w-full">
        {isSubmitting ? "Processing…" : "Pay Now"}
      </button>
      </>
      )}
    </div>
  );
}
