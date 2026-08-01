"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/Modal";
import { AuthForm } from "@/components/AuthForm";

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Google sign-in redirects away to Google and back — without returnTo it
  // falls back to "/" (see /auth/callback), so the popup would silently
  // bounce someone browsing e.g. /counselling back to the homepage after
  // they sign in. Passing the current path keeps them where they were,
  // matching how the email/OTP step already behaves (onSuccess just closes
  // the modal in place, no navigation at all).
  const pathname = usePathname();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign in" panelClassName="!bg-white">
      <div className="mb-4 flex flex-col items-center text-center">
        <Image src="/mindcafe-icon.png" alt="Mindcafe" width={40} height={40} />
        <p className="mt-3 text-sm text-ink/60">Sign in to shop Feelz, book counselling, and track your orders.</p>
      </div>
      {/* Remount on every open so a half-finished code step from a previous
          visit doesn't linger — Modal keeps children mounted and just
          toggles aria-hidden rather than unmounting on close. */}
      <AuthForm key={String(isOpen)} returnTo={pathname} onSuccess={onClose} />
    </Modal>
  );
}
