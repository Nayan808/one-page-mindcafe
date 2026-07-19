"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/AuthForm";

function safeReturnTo(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function SignupContent() {
  const { status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  useEffect(() => {
    if (status === "authenticated") router.replace(returnTo);
  }, [status, returnTo, router]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold lowercase text-ink">create account</h1>
      <p className="mt-2 text-sm text-ink/60">Save addresses, track orders, and book counselling sessions.</p>

      <div className="mt-6">
        <AuthForm returnTo={returnTo} onSuccess={() => router.replace(returnTo)} />
      </div>
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
