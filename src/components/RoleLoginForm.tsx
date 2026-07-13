"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const schema = z.object({
  email: z.string().min(1, "Required").email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});
type Values = z.infer<typeof schema>;

type RoleLoginFormProps = {
  role: "expert" | "employer";
  roleLabel: string;
  dashboardHref: string;
  loginHref: string;
};

// Same email/password *and* Google auth as the customer /login (there's
// only one Supabase Auth, spec 5.4) — the only difference is what happens
// after: role is checked against profiles.role and only a matching role
// gets through to the dashboard.
//
// Google is safe to offer here even though a brand-new Google sign-in
// always lands as role='customer' (handle_new_user(), setup.sql) and
// there's no self-service path to expert/employer: this form never trusts
// that outcome as success. Wrong-role or freshly-created customer
// accounts are signed back out immediately with an explicit "permissions
// aren't assigned to this account" message, the same as a wrong password
// would produce — no dashboard access is ever granted without an admin
// having provisioned the role first.
function RoleLoginFormInner({ role, roleLabel, dashboardHref, loginHref }: RoleLoginFormProps) {
  const { status, profile, signInWithGoogle, signInWithPassword, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  const [formError, setFormError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // Guards against re-running the check (and re-calling signOut) on every
  // re-render while status/profile stay "authenticated" — resets once
  // signed out so the next sign-in attempt gets checked fresh.
  const [hasChecked, setHasChecked] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  // Covers both password sign-in (resolves in-page) and landing back here
  // after a completed Google round trip — either way, once a session and
  // profile exist, the role gate is the same.
  useEffect(() => {
    if (status !== "authenticated" || !profile || hasChecked) return;
    setHasChecked(true);
    if (profile.role === role) {
      router.replace(dashboardHref);
    } else {
      setFormError(
        `This account isn't registered as a mindcafé ${roleLabel} — permissions haven't been assigned to it. Ask an admin to set your account up, or sign in with a different account.`,
      );
      void signOut();
    }
  }, [status, profile, hasChecked, role, roleLabel, dashboardHref, router, signOut]);

  useEffect(() => {
    if (status === "unauthenticated") setHasChecked(false);
  }, [status]);

  async function handleGoogle() {
    setIsGoogleLoading(true);
    setFormError(null);
    const { error } = await signInWithGoogle(loginHref);
    if (error) {
      setFormError(error);
      setIsGoogleLoading(false);
    }
    // On success the browser navigates away to Google — no further state
    // change happens here.
  }

  async function onSubmit(values: Values) {
    setFormError(null);
    const { error } = await signInWithPassword(values.email, values.password);
    if (error) setFormError(error);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold lowercase text-ink">{roleLabel} sign in</h1>
      <p className="mt-2 text-sm text-ink/60">
        Accounts are set up by mindcafé — reach out if you don&apos;t have credentials yet.
      </p>

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
    </div>
  );
}

export function RoleLoginForm(props: RoleLoginFormProps) {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>}>
      <RoleLoginFormInner {...props} />
    </Suspense>
  );
}
