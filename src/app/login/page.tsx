"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/AuthForm";

function safeReturnTo(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function LoginContent() {
  const { status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const oauthError = searchParams.get("error");

  // Covers both OTP sign-in (resolves in-page) and landing here after a
  // completed Google round trip while already authenticated.
  useEffect(() => {
    if (status === "authenticated") router.replace(returnTo);
  }, [status, returnTo, router]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold lowercase text-ink">sign in</h1>
      <p className="mt-2 text-sm text-ink/60">Sign in to shop feelz, book counselling, and track your orders.</p>

      {oauthError && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Google sign-in didn&apos;t go through — try again, or use email below.
        </p>
      )}

      <div className="mt-6">
        <AuthForm returnTo={returnTo} onSuccess={() => router.replace(returnTo)} />
      </div>
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
