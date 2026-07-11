"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { createClient } from "@/lib/supabase/client";
import { checkPincodeServiceability, checkout, getActivePickupLocations, validateCoupon, type CouponPreview } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useAddresses } from "@/lib/query/hooks";
import { AddressForm, type AddressFormValues } from "@/components/AddressForm";
import { formatInr } from "@/lib/utils";
import type { PickupLocation } from "@/types/domain";

type Mode = "delivery" | "takeaway";

// Delivery or takeaway pickup at a listed Zostel — payment is Razorpay
// only in both cases (pay-online, no cash-on-pickup). No account is
// required: a guest supplies name/phone(/email) instead, and the actual
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
  const [guestAddress, setGuestAddress] = useState<AddressFormValues | null>(null);
  const [serviceability, setServiceability] = useState<{ ok: boolean; fee: number } | "unchecked" | "checking">(
    "unchecked",
  );

  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [pickupSlot, setPickupSlot] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

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
    const sb = createClient();
    const result = await checkPincodeServiceability(sb, pincode).catch(() => null);
    setServiceability(result ? { ok: true, fee: Number(result.delivery_fee) } : { ok: false, fee: 0 });
  }

  async function handleAddAddress(values: AddressFormValues) {
    if (user) {
      const created = await addAddress.mutateAsync({ ...values, user_id: user.id });
      setSelectedAddressId(created.id);
      setShowNewAddressForm(false);
    } else {
      setGuestAddress(values);
    }
    await handleCheckServiceability(values.pincode);
  }

  const deliveryFee =
    mode === "delivery" && serviceability !== "unchecked" && serviceability !== "checking" && serviceability.ok
      ? serviceability.fee
      : 0;
  // Only trust the applied preview while the input still matches what was
  // checked — editing the code after applying shouldn't silently keep
  // discounting at the old value.
  const discountAmount = appliedCoupon?.code === couponCode.trim().toUpperCase() ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

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

  const serviceabilityOk = serviceability !== "unchecked" && serviceability !== "checking" && serviceability.ok;
  const hasDeliveryTarget = user ? Boolean(selectedAddressId) || Boolean(guestAddress) : Boolean(guestAddress);
  const hasGuestContact = user || (guestName.trim() && guestPhone.trim() && guestEmail.trim());

  const canPay =
    items.length > 0 &&
    Boolean(hasGuestContact) &&
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
            ? user && selectedAddressId && !guestAddress
              ? { type: "delivery", addressId: selectedAddressId }
              : { type: "delivery", address: guestAddress! }
            : { type: "takeaway", locationId: locationId!, pickupSlot: pickupSlot || undefined },
        couponCode: couponCode.trim() || undefined,
        guest: user
          ? undefined
          : mode === "takeaway"
            ? { name: guestName.trim(), phone: guestPhone.trim(), email: guestEmail.trim() || undefined }
            : { name: guestAddress!.full_name, phone: guestAddress!.phone, email: guestEmail.trim() || undefined },
      });

      await openRazorpayCheckout({
        keyId: result.key_id,
        amount: result.amount,
        currency: result.currency,
        razorpayOrderId: result.razorpay_order_id,
        name: "MindCafe",
        prefill: {
          name: profile?.full_name ?? guestName ?? undefined,
          email: user?.email ?? guestEmail ?? undefined,
          contact: profile?.phone ?? guestPhone ?? undefined,
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
          delivery
        </button>
        <button
          type="button"
          onClick={() => setMode("takeaway")}
          className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium ${mode === "takeaway" ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/70"}`}
        >
          takeaway at a zostel
        </button>
      </div>

      {!user && mode === "takeaway" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="Full name"
            className="input"
          />
          <input
            value={guestPhone}
            onChange={(event) => setGuestPhone(event.target.value)}
            placeholder="Phone"
            className="input"
          />
          <input
            value={guestEmail}
            onChange={(event) => setGuestEmail(event.target.value)}
            placeholder="Email — for your pickup code"
            className="input sm:col-span-2"
          />
        </div>
      )}

      {mode === "delivery" ? (
        <div className="space-y-4">
          {!user && (
            <input
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
              placeholder="Email — for your order confirmation"
              className="input"
            />
          )}

          {user && addresses.length > 0 && !showNewAddressForm && (
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
                      setGuestAddress(null);
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
                + use a new address
              </button>
            </div>
          )}

          {(!user || addresses.length === 0 || showNewAddressForm) &&
            (guestAddress ? (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-ink/15 bg-white p-3 text-sm">
                <span>
                  <span className="block font-medium text-ink">{guestAddress.full_name}</span>
                  <span className="block text-ink/60">
                    {guestAddress.line1}, {guestAddress.city}, {guestAddress.state} {guestAddress.pincode}
                  </span>
                </span>
                <button type="button" onClick={() => setGuestAddress(null)} className="text-xs text-ink underline">
                  edit
                </button>
              </div>
            ) : (
              <AddressForm onSubmit={handleAddAddress} isSubmitting={addAddress.isPending} />
            ))}

          {serviceability === "checking" && <p className="text-sm text-ink/60">Checking serviceability…</p>}
          {serviceability !== "unchecked" && serviceability !== "checking" && !serviceability.ok && (
            <p className="text-sm text-amber-700">This pincode isn&apos;t serviceable yet — try takeaway instead.</p>
          )}
          {serviceability !== "unchecked" && serviceability !== "checking" && serviceability.ok && (
            <p className="text-sm text-emerald-700">
              Deliverable — fee {serviceability.fee === 0 ? "free" : formatInr(serviceability.fee)}
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
            }}
            onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), handleApplyCoupon())}
            placeholder="e.g. FEELZ10"
            className="input uppercase"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={!couponCode.trim() || isCheckingCoupon || discountAmount > 0}
            className="pill-btn-outline shrink-0 !py-2 text-xs normal-case tracking-normal"
          >
            {isCheckingCoupon ? "checking…" : discountAmount > 0 ? "applied" : "apply"}
          </button>
        </div>
        {couponError && <p className="mt-1.5 text-sm text-red-600">{couponError}</p>}
        {discountAmount > 0 && (
          <p className="mt-1.5 text-sm text-emerald-700">
            &ldquo;{appliedCoupon!.code}&rdquo; applied — {formatInr(discountAmount)} off
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
          <span>{deliveryFee === 0 ? "Free" : formatInr(deliveryFee)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 font-medium">
          <span>Total</span>
          <span>{formatInr(total)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="button" onClick={handlePlaceOrder} disabled={!canPay || isSubmitting} className="pill-btn w-full">
        {isSubmitting ? "processing…" : "pay now"}
      </button>
    </div>
  );
}
