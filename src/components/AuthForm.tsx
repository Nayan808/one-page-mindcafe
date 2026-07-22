"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Supabase's built-in mailer (used until a custom SMTP/Send Email Hook is
// wired up) caps out at a handful of emails/hour — swap that raw error for
// an actionable nudge toward the one auth path that isn't rate-limited.
function friendlyError(error: string): string {
  if (error.toLowerCase().includes("rate limit")) {
    return "too many email codes requested — try log in with google instead.";
  }
  return error;
}

// Shared by the login/signup popup and the standalone /login and /signup
// pages (the latter still used for hard-gate redirects like /admin,
// /account, /book-appointment) so the Google + email-OTP flow only lives
// in one place. Email sign-in is OTP-only — there is no password step —
// so this same component covers both "log in" and "create account": if
// the email is new, sendOtp creates the account and the code that comes
// back confirms it in one step.
export function AuthForm({ returnTo, onSuccess }: { returnTo?: string; onSuccess?: () => void }) {
  const { signInWithGoogle, sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

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
    if (!email.trim()) return;
    setFormError(null);
    setIsSending(true);
    const { error } = await sendOtp(email.trim(), name.trim() || undefined);
    setIsSending(false);
    if (error) {
      setFormError(error);
      return;
    }
    setStep("code");
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setFormError(null);
    setIsVerifying(true);
    const { error } = await verifyOtp(email.trim(), code.trim());
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
    const { error } = await sendOtp(email.trim(), name.trim() || undefined);
    setIsSending(false);
    if (error) setFormError(error);
  }

  return (
    <div>
      <button type="button" onClick={handleGoogle} disabled={isGoogleLoading} className="pill-btn w-full">
        {isGoogleLoading ? "redirecting…" : "continue with google"}
      </button>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-label text-ink/40">
        <span className="h-px flex-1 bg-ink/10" />
        or
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      {step === "email" ? (
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

          {formError && <p className="text-sm text-red-600">{friendlyError(formError)}</p>}

          <button type="submit" disabled={isSending} className="pill-btn w-full">
            {isSending ? "sending code…" : "send code"}
          </button>
          <p className="text-center text-xs text-ink/50">
            We&apos;ll email you a one-time code — no password needed.
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-3">
          <p className="text-sm text-ink/70">
            Enter the code we sent to <span className="font-medium text-ink">{email}</span>.
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
            {isVerifying ? "verifying…" : "verify & continue"}
          </button>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setFormError(null);
              }}
              className="text-ink/60 underline"
            >
              change email
            </button>
            <button type="button" onClick={handleResend} disabled={isSending} className="text-ink/60 underline">
              {isSending ? "resending…" : "resend code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
