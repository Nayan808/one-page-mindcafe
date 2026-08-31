"use client";

import { useState } from "react";
import { isValidIndianMobile, normalizePhone } from "@/components/AddressForm";
import { useGuestPhone } from "@/contexts/GuestPhoneContext";

// Feelz-only alternative to the Google/email-OTP AuthForm — no account,
// no OTP, no SMS sent. Just a 10-digit number, validated the same way
// AddressForm already validates one, stored client-side (see
// guestPhone.ts) and reused for the rest of the session so checkout's own
// guest fields (FulfillmentAndPayment.tsx) don't ask for it twice. This
// mirrors the unverified-guest-phone pattern ScanOrderPayment.tsx already
// uses in production for scan-and-order — same trust tradeoff, now
// available on the main Feelz storefront too.
export function FeelzPhoneForm({ onSuccess }: { onSuccess: () => void }) {
  const { setGuestPhone } = useGuestPhone();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const normalized = normalizePhone(value);
  const isValid = isValidIndianMobile(normalized);
  const showError = touched && value.trim().length > 0 && !isValid;
  const showMissing = touched && value.trim().length === 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;
    setGuestPhone(normalized);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="feelz-guest-phone" className="mb-1 block text-sm text-ink/70">
          Mobile number
        </label>
        <input
          id="feelz-guest-phone"
          type="tel"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (touched) setTouched(false);
          }}
          onBlur={() => setTouched(true)}
          placeholder="10-digit mobile number"
          className="input"
          aria-invalid={showError || showMissing}
          aria-describedby={showError || showMissing ? "feelz-guest-phone-error" : undefined}
        />
        {showMissing && (
          <p id="feelz-guest-phone-error" className="mt-1.5 text-xs font-medium text-red-600">
            Enter your mobile number to continue.
          </p>
        )}
        {showError && (
          <p id="feelz-guest-phone-error" className="mt-1.5 text-xs font-medium text-red-600">
            Enter a valid 10-digit mobile number.
          </p>
        )}
      </div>

      <button type="submit" className="pill-btn w-full">
        Continue
      </button>

      <p className="text-center text-xs text-ink/40">
        No OTP, no account needed — just enter your number to order.
      </p>
    </form>
  );
}
