"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateCart } from "@/lib/api";
import { getOrCreateGuestSessionId } from "@/lib/guestSession";
import { useCart } from "@/lib/query/hooks";
import { useAuth } from "@/contexts/AuthContext";

type CartContextValue = {
  cartId: string | null;
  isReady: boolean;
} & ReturnType<typeof useCart>;

const CartContext = createContext<CartContextValue | null>(null);

// Owns cart *identity* only (guest session or the logged-in user's cart).
// Line items are TanStack Query data, sourced via useCart(cartId).
export function CartProvider({ children }: { children: ReactNode }) {
  const sb = useMemo(() => createClient(), []);
  const { status, user } = useAuth();
  const [cartId, setCartId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;
    const identity = user
      ? { userId: user.id, sessionId: null }
      : { userId: null, sessionId: getOrCreateGuestSessionId() };

    getOrCreateCart(sb, identity)
      .then((cart) => {
        if (!cancelled) setCartId(cart.id);
      })
      .catch(() => {
        if (!cancelled) setCartId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [sb, status, user]);

  const cart = useCart(cartId);

  const value: CartContextValue = { cartId, isReady: status !== "loading", ...cart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used within CartProvider");
  return ctx;
}
