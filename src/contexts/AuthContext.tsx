"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { fetchProfile, mergeGuestCart } from "@/lib/api";
import { readGuestSessionId, clearGuestSessionId } from "@/lib/guestSession";
import type { Profile } from "@/types/domain";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  profile: Profile | null;
  signInWithGoogle: (returnTo?: string) => Promise<{ error: string | null }>;
  sendOtp: (email: string, fullName?: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  // Still used by role-based staff sign-in (expert/employer login,
  // RoleLoginForm.tsx) and the admin re-auth check on pickup-locations —
  // those accounts are provisioned by an admin, not self-serve, so they
  // intentionally stay password-based rather than moving to email OTP.
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const sb = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(
    async (userId: string) => {
      try {
        setProfile(await fetchProfile(sb, userId));
      } catch {
        // Blank/unreachable Supabase env — degrade gracefully, don't crash.
        setProfile(null);
      }
    },
    [sb],
  );

  useEffect(() => {
    let isMounted = true;

    sb.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      setUser(data.user);
      setStatus(data.user ? "authenticated" : "unauthenticated");
      if (data.user) void loadProfile(data.user.id);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setStatus(session?.user ? "authenticated" : "unauthenticated");

      if (event === "SIGNED_IN" && session?.user) {
        void loadProfile(session.user.id);

        const guestSessionId = readGuestSessionId();
        if (guestSessionId) {
          void mergeGuestCart(sb, guestSessionId).then(() => clearGuestSessionId());
        }
      }

      if (event === "SIGNED_OUT") setProfile(null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [sb, loadProfile]);

  const signInWithGoogle = useCallback(
    async (returnTo?: string) => {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      if (returnTo) callbackUrl.searchParams.set("returnTo", returnTo);
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl.toString() },
      });
      return { error: error?.message ?? null };
    },
    [sb],
  );

  // Email auth is OTP-only (no password) — sendOtp both creates a new user
  // (if the email is unrecognized) and signs an existing one in; Supabase's
  // handle_new_user() trigger picks fullName up from raw_user_meta_data the
  // same way signUpWithPassword used to. Email delivery uses Supabase's
  // built-in mailer out of the box (rate-limited); once a custom SMTP
  // provider is wired up in the Supabase dashboard, these same calls start
  // sending through that instead — no code change needed here.
  const sendOtp = useCallback(
    async (email: string, fullName?: string) => {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: fullName ? { full_name: fullName } : undefined,
        },
      });
      return { error: error?.message ?? null };
    },
    [sb],
  );

  const verifyOtp = useCallback(
    async (email: string, token: string) => {
      const { error } = await sb.auth.verifyOtp({ email, token, type: "email" });
      return { error: error?.message ?? null };
    },
    [sb],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [sb],
  );

  const signOut = useCallback(async () => {
    await sb.auth.signOut();
  }, [sb]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const value: AuthContextValue = {
    status,
    user,
    profile,
    signInWithGoogle,
    sendOtp,
    verifyOtp,
    signInWithPassword,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
