"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const schema = z.object({
  email: z.string().min(1, "Required").email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});
type Values = z.infer<typeof schema>;

// Same email/password auth as the customer /login (there's only one
// Supabase Auth, spec 5.4) — the only difference is what happens after:
// role is checked against profiles.role and only a matching role gets
// through to the dashboard. Wrong-role or customer accounts are signed
// back out immediately rather than left in a half-logged-in state.
export function RoleLoginForm({
  role,
  roleLabel,
  dashboardHref,
}: {
  role: "expert" | "employer";
  roleLabel: string;
  dashboardHref: string;
}) {
  const { status, profile, signInWithPassword, signOut } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (status !== "authenticated" || !profile || !checkingRole) return;
    if (profile.role === role) {
      router.replace(dashboardHref);
    } else {
      setFormError(`This account isn't registered as a mindcafé ${roleLabel}.`);
      setCheckingRole(false);
      void signOut();
    }
  }, [status, profile, checkingRole, role, roleLabel, dashboardHref, router, signOut]);

  async function onSubmit(values: Values) {
    setFormError(null);
    const { error } = await signInWithPassword(values.email, values.password);
    if (error) {
      setFormError(error);
      return;
    }
    setCheckingRole(true);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold lowercase text-ink">{roleLabel} sign in</h1>
      <p className="mt-2 text-sm text-ink/60">
        Accounts are set up by mindcafé — reach out if you don&apos;t have credentials yet.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
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

        <button type="submit" disabled={isSubmitting || checkingRole} className="pill-btn w-full">
          {isSubmitting || checkingRole ? "signing in…" : "sign in"}
        </button>
      </form>
    </div>
  );
}
