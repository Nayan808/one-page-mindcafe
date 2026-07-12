"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const signupSchema = z.object({
  full_name: z.string().min(1, "Required"),
  email: z.string().min(1, "Required").email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type SignupValues = z.infer<typeof signupSchema>;

function safeReturnTo(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function SignupContent() {
  const { status, signInWithGoogle, signUpWithPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  // If signUp returns a session immediately (email confirmation disabled on
  // this project), this fires and takes the user straight to returnTo;
  // otherwise checkEmail's message covers the confirmation-required case.
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
  }

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    const { error } = await signUpWithPassword(values.email, values.password, values.full_name);
    if (error) {
      setFormError(error);
      return;
    }
    setCheckEmail(true);
  }

  if (checkEmail) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold lowercase text-ink">check your email</h1>
        <p className="mt-2 text-sm text-ink/60">
          We&apos;ve sent a confirmation link — if you&apos;re signed in already, this page will redirect you shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold lowercase text-ink">create account</h1>
      <p className="mt-2 text-sm text-ink/60">Save addresses, track orders, and book counselling sessions.</p>

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
          <label className="mb-1 block text-sm text-ink/70">Full Name</label>
          <input {...register("full_name")} className="input" />
          {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
        </div>
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
          {isSubmitting ? "creating account…" : "sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-ink underline">
          sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>}>
      <SignupContent />
    </Suspense>
  );
}
