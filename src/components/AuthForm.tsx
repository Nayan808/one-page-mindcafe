"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";

// WhatsApp delivery (MSG91) doesn't share Supabase's built-in-mailer rate
// limit, but the email fallback still can — swap that raw error for a nudge
// toward the two paths that aren't rate-limited.
function friendlyError(error: string): string {
  if (error.toLowerCase().includes("rate limit")) {
    return "Too many codes requested. Try Google or WhatsApp instead.";
  }
  return error;
}

const PHONE_DIGITS = /^[6-9]\d{9}$/;

// Shared by the login/signup popup and the standalone /login and /signup
// pages (the latter still used for hard-gate redirects like /admin,
// /account, /book-appointment) so the Google + OTP flows only live in one
// place. Phone (WhatsApp) OTP is the primary non-Google path; email OTP
// stays as a fallback link, not removed, because orders/appointments link
// to a fixed auth.users id — an account that signed up by email has no
// phone attached to it, so a returning customer typing their number in
// would otherwise land on a brand-new, empty account instead of the one
// with their order history (see AuthContext.tsx's sendEmailOtp comment).
export function AuthForm({ returnTo, onSuccess }: { returnTo?: string; onSuccess?: () => void }) {
  const { signInWithGoogle, sendPhoneOtp, verifyPhoneOtp, sendEmailOtp, verifyEmailOtp } = useAuth();

  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"input" | "code">("input");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const e164Phone = `+91${phone.trim()}`;
  const identifierLabel = method === "phone" ? `+91 ${phone}` : email;

  async function handleGoogle() {
    setIsGoogleLoading(true);
    setFormError(null);
    const { error } = await signInWithGoogle(returnTo);
    if (error) {
      setFormError(error);
      setIsGoogleLoading(false);
    }
    // On success the browser navigates away to Google — nothing else to do here.
  }

  async function handleSendCode(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (method === "phone") {
      if (!PHONE_DIGITS.test(phone.trim())) {
        setFormError("Enter a valid 10-digit mobile number");
        return;
      }
      setIsSending(true);
      const { error } = await sendPhoneOtp(e164Phone, name.trim() || undefined);
      setIsSending(false);
      if (error) {
        setFormError(error);
        return;
      }
    } else {
      if (!email.trim()) return;
      setIsSending(true);
      const { error } = await sendEmailOtp(email.trim(), name.trim() || undefined);
      setIsSending(false);
      if (error) {
        setFormError(error);
        return;
      }
    }
    setStep("code");
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setFormError(null);
    setIsVerifying(true);
    const { error } =
      method === "phone" ? await verifyPhoneOtp(e164Phone, code.trim()) : await verifyEmailOtp(email.trim(), code.trim());
    setIsVerifying(false);
    if (error) {
      setFormError(error);
      return;
    }
    onSuccess?.();
  }

  async function handleResend() {
    setFormError(null);
    setIsSending(true);
    const { error } =
      method === "phone"
        ? await sendPhoneOtp(e164Phone, name.trim() || undefined)
        : await sendEmailOtp(email.trim(), name.trim() || undefined);
    setIsSending(false);
    if (error) setFormError(error);
  }

  function switchMethod(next: "phone" | "email") {
    setMethod(next);
    setStep("input");
    setCode("");
    setFormError(null);
  }

  return (
    <div>
      <button type="button" onClick={handleGoogle} disabled={isGoogleLoading} className="pill-btn w-full">
        {isGoogleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-label text-ink/40">
        <span className="h-px flex-1 bg-ink/10" />
        or
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      {step === "input" ? (
        <form onSubmit={handleSendCode} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-ink/70">Name (optional)</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="only needed for a new account"
              className="input"
            />
          </div>

          {method === "phone" ? (
            <div>
              <label className="mb-1 block text-sm text-ink/70">WhatsApp number</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink/60">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="10-digit mobile number"
                  className="input"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm text-ink/70">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input"
              />
            </div>
          )}

          {formError && <p className="text-sm text-red-600">{friendlyError(formError)}</p>}

          <button type="submit" disabled={isSending} className="pill-btn w-full">
            {isSending ? "Sending Code…" : "Send Code"}
          </button>
          <p className="text-center text-xs text-ink/50">
            {method === "phone"
              ? "We'll send a one-time code on WhatsApp, no password needed."
              : "We'll email you a one-time code, no password needed."}
          </p>
          <p className="text-center text-xs">
            {method === "phone" ? (
              <button type="button" onClick={() => switchMethod("email")} className="text-ink/60 underline">
                Signed up with email before? Use email instead
              </button>
            ) : (
              <button type="button" onClick={() => switchMethod("phone")} className="text-ink/60 underline">
                Use WhatsApp instead
              </button>
            )}
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-3">
          <p className="text-sm text-ink/70">
            Enter the code we sent {method === "phone" ? "on WhatsApp" : "by email"} to{" "}
            <span className="font-medium text-ink">{identifierLabel}</span>.
          </p>
          <div>
            <label className="mb-1 block text-sm text-ink/70">verification code</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="input text-center text-lg tracking-[0.4em]"
              maxLength={10}
            />
          </div>

          {formError && <p className="text-sm text-red-600">{friendlyError(formError)}</p>}

          <button type="submit" disabled={isVerifying} className="pill-btn w-full">
            {isVerifying ? "Verifying…" : "Verify & Continue"}
          </button>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setCode("");
                setFormError(null);
              }}
              className="text-ink/60 underline"
            >
              {method === "phone" ? "Change Number" : "Change Email"}
            </button>
            <button type="button" onClick={handleResend} disabled={isSending} className="text-ink/60 underline">
              {isSending ? "Resending…" : "Resend Code"}
            </button>
          </div>

          {method === "phone" && (
            <p className="text-center text-xs text-ink/50">
              Not receiving it? Use <span className="font-medium text-ink">Continue with Google</span> above instead.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
