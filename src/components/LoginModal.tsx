"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/Modal";

// Shown when a signed-out visitor tries to add something to their cart —
// an account is required before anything can be added (see
// MoodProductCard/Hero's handleAddToCart), so this is the only sign-in
// entry point on the page besides the header.
export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    const { error: authError } = await signInWithGoogle();
    if (authError) {
      setError(authError);
      setIsLoading(false);
    }
    // On success the browser redirects to Google, so no further state
    // change happens here.
  }

  return (
    <Modal isOpen={isLoginModalOpen} onClose={closeLoginModal} title="sign in">
      <div className="space-y-4 text-center">
        <p className="text-sm text-ink/70">Sign in to add items to your cart and check out.</p>

        <button type="button" onClick={handleClick} disabled={isLoading} className="pill-btn w-full">
          {isLoading ? "redirecting…" : "continue with google"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
