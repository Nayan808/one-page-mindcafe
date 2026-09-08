"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";

const PHONE_DIGITS = /^[6-9]\d{9}$/;

// Shown on /account only when the signed-in account (Google or email) has
// no phone attached yet. Uses Supabase's phone-change flow (linkPhone/
// verifyPhoneLink in AuthContext.tsx) — attaches the number to *this*
// account rather than the sign-in flow, which would instead create a
// brand-new account the next time this phone is used to log in.
export function LinkPhoneSection() {
  const { user, linkPhone, verifyPhoneLink } = useAuth();

  const [step, setStep] = useState<"phone" | "code" | "done">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already has a phone (signed up with one, or linked one previously) —
  // nothing to do here.
  if (user?.phone) return null;

  const e164Phone = `+91${phone.trim()}`;

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!PHONE_DIGITS.test(phone.trim())) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError(null);
    setIsSending(true);
    const { error } = await linkPhone(e164Phone);
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
    const { error } = await verifyPhoneLink(e164Phone, code.trim());
    setIsVerifying(false);
    if (error) {
      setError(error);
      return;
    }
    setStep("done");
  }

  async function handleResend() {
    setError(null);
    setIsSending(true);
    const { error } = await linkPhone(e164Phone);
    setIsSending(false);
    if (error) setError(error);
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-xl font-bold text-ink">Link a phone number</h2>
      <p className="mt-1 text-sm text-ink/60">
        Add and verify a WhatsApp number so you can sign in with it too, and reach this same account.
      </p>

      {step === "done" ? (
        <p className="mt-4 text-sm text-emerald-700">Phone number linked — you can now sign in with it too.</p>
      ) : step === "phone" ? (
        <form onSubmit={handleSend} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm text-ink/70">WhatsApp number</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink/60">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/[^0-9]/g, ""))}
                placeholder="10-digit mobile number"
                className="input"
              />
            </div>
          </div>
          <button type="submit" disabled={isSending} className="pill-btn">
            {isSending ? "Sending Code…" : "Send Code"}
          </button>
          {error && <p className="w-full text-xs font-medium text-red-600">{error}</p>}
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mt-4 space-y-3">
          <p className="text-sm text-ink/70">
            Enter the code sent to <span className="font-medium text-ink">+91 {phone}</span>.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={10}
              className="input w-40 text-center text-lg tracking-[0.4em]"
            />
            <button type="submit" disabled={isVerifying} className="pill-btn">
              {isVerifying ? "Verifying…" : "Verify"}
            </button>
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <div className="flex items-center gap-4 text-xs">
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
    </section>
  );
}
