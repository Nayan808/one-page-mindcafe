"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AuthModal } from "@/components/AuthModal";

type AuthModalContextValue = {
  openAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openAuthModal = useCallback(() => setIsOpen(true), []);
  const closeAuthModal = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ openAuthModal }), [openAuthModal]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal isOpen={isOpen} onClose={closeAuthModal} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
