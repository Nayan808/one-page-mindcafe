"use client";

import Image from "next/image";
import { Modal } from "@/components/Modal";
import { AuthForm } from "@/components/AuthForm";

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="sign in" panelClassName="!bg-white">
      <div className="mb-4 flex flex-col items-center text-center">
        <Image src="/mindcafe-icon.png" alt="Mindcafe" width={40} height={40} />
        <p className="mt-3 text-sm text-ink/60">Sign in to shop feelz, book counselling, and track your orders.</p>
      </div>
      {/* Remount on every open so a half-finished code step from a previous
          visit doesn't linger — Modal keeps children mounted and just
          toggles aria-hidden rather than unmounting on close. */}
      <AuthForm key={String(isOpen)} onSuccess={onClose} />
    </Modal>
  );
}
