"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().min(1, "Required").email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});
type LoginValues = z.infer<typeof loginSchema>;

function safeReturnTo(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function LoginContent() {
  const { status, signInWithGoogle, signInWithPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const oauthError = searchParams.get("error");

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  // Covers both password sign-in (resolves in-page) and landing here after
  // a completed Google round trip while already authenticated.
  useEffect(() => {
    if (status === "authenticated") router.replace(returnTo);
  }, [status, returnTo, router]);

  async function handleGoogle() {
    setIsGoogleLoading(true);
    setFormError(null);
    const { error } = await signInWithGoogle(returnTo);
    if (error) {
      setFormError(error);
      setIsGoogleLoading(false);
    }
    // On success the browser navigates away to Google — no further state
    // change happens here.
  }

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const { error } = await signInWithPassword(values.email, values.password);
    if (error) setFormError(error);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold lowercase text-ink">sign in</h1>
      <p className="mt-2 text-sm text-ink/60">Sign in to shop feelz, book counselling, and track your orders.</p>

      {oauthError && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Google sign-in didn&apos;t go through — try again, or use email below.
        </p>
      )}

      <button type="button" onClick={handleGoogle} disabled={isGoogleLoading} className="pill-btn mt-6 w-full">
        {isGoogleLoading ? "redirecting…" : "continue with google"}
      </button>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-label text-ink/40">
        <span className="h-px flex-1 bg-ink/10" />
        or
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-ink/70">Email</label>
          <input type="email" {...register("email")} className="input" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Password</label>
          <input type="password" {...register("password")} className="input" />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button type="submit" disabled={isSubmitting} className="pill-btn w-full">
          {isSubmitting ? "signing in…" : "sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Don&apos;t have an account?{" "}
        <Link href={`/signup?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-ink underline">
          sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
