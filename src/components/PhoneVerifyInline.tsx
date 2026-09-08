"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";

const PHONE_DIGITS = /^[6-9]\d{9}$/;

// Inline replacement for free-text "guest" contact fields on checkout/
// booking — collects a name + phone, sends a WhatsApp OTP (MSG91 via the
// Send SMS hook), and verifies it right in the same form. On success
// verifyPhoneOtp() establishes a real Supabase session, so useAuth().user
// becomes populated in the parent automatically (via onAuthStateChange) —
// callers don't need an onSuccess callback, they just render their
// authenticated-user UI once `user` is truthy.
export function PhoneVerifyInline({ label = "Verify your phone number" }: { label?: string }) {
  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const e164Phone = `+91${phone.trim()}`;

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!PHONE_DIGITS.test(phone.trim())) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError(null);
    setIsSending(true);
    const { error } = await sendPhoneOtp(e164Phone, name.trim() || undefined);
    setIsSending(false);
    if (error) {
      setError(error);
      return;
    }
    setStep("code");
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setIsVerifying(true);
    const { error } = await verifyPhoneOtp(e164Phone, code.trim());
    setIsVerifying(false);
    if (error) setError(error);
    // On success useAuth().user updates on its own — nothing else to do here.
  }

  async function handleResend() {
    setError(null);
    setIsSending(true);
    const { error } = await sendPhoneOtp(e164Phone, name.trim() || undefined);
    setIsSending(false);
    if (error) setError(error);
  }

  return (
    <div className="rounded-xl border border-ink/15 bg-cream p-4">
      <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">{label}</h2>
      <p className="mt-1 text-xs text-ink/50">We&apos;ll send a one-time code on WhatsApp to confirm it&apos;s really you.</p>

      {step === "phone" ? (
        <form onSubmit={handleSend} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="input" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink/60">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/[^0-9]/g, ""))}
                placeholder="10-digit mobile number"
                className="input w-full"
              />
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-600 sm:col-span-2">{error}</p>}

          <button type="submit" disabled={isSending} className="pill-btn sm:col-span-2">
            {isSending ? "Sending Code…" : "Send WhatsApp Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mt-3 space-y-3">
          <p className="text-sm text-ink/70">
            Enter the code sent to <span className="font-medium text-ink">+91 {phone}</span>.
          </p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={10}
            className="input text-center text-lg tracking-[0.4em]"
          />

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={isVerifying} className="pill-btn w-full">
            {isVerifying ? "Verifying…" : "Verify"}
          </button>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="text-ink/60 underline"
            >
              Change Number
            </button>
            <button type="button" onClick={handleResend} disabled={isSending} className="text-ink/60 underline">
              {isSending ? "Resending…" : "Resend Code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
