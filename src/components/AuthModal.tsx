"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { AuthForm } from "@/components/AuthForm";

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Google sign-in redirects away to Google and back — without returnTo it
  // falls back to "/" (see /auth/callback), so the popup would silently
  // bounce someone browsing e.g. /counselling back to the homepage after
  // they sign in. Passing the current path keeps them where they were,
  // matching how the email/OTP step already behaves (onSuccess just closes
  // the modal in place, no navigation at all).
  //
  // usePathname() alone drops the hash (e.g. /feelz#extrovert) — Next's
  // router doesn't track fragments — so a product-section anchor would be
  // lost on the round trip through Google, landing back at the top of the
  // page instead of the section the customer was actually browsing.
  // window.location.hash fills that gap; captured fresh on every open (not
  // at mount) since it can only be read client-side.
  const pathname = usePathname();
  const [returnTo, setReturnTo] = useState(pathname);

  useEffect(() => {
    if (!isOpen) return;
    setReturnTo(pathname + window.location.hash);
    // Home-page sections (e.g. the mood-picking grid in Hero.tsx) scroll
    // via a plain scrollIntoView() call, never touching the URL — no hash
    // exists there to round-trip through Google at all. Stashing the raw
    // scroll position covers that case too: restored by
    // ScrollRestoreOnAuthReturn after the page reloads post-login. Only
    // meaningful for the Google path (a real navigate-away-and-back); the
    // email/OTP step never leaves the page, so scroll position is already
    // untouched there regardless.
    sessionStorage.setItem("authReturnScrollY", String(window.scrollY));
  }, [isOpen, pathname]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign in" panelClassName="!bg-white">
      <div className="mb-4 flex flex-col items-center text-center">
        <Image src="/mindcafe-icon.png" alt="Mindcafe" width={40} height={40} />
        <p className="mt-3 text-sm text-ink/60">Sign in to shop Feelz, book counselling, and track your orders.</p>
      </div>
      {/* Remount on every open so a half-finished code step from a previous
          visit doesn't linger — Modal keeps children mounted and just
          toggles aria-hidden rather than unmounting on close. */}
      <AuthForm key={String(isOpen)} returnTo={returnTo} onSuccess={onClose} />
    </Modal>
  );
}
