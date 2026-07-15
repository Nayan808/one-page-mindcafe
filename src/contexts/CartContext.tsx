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
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
} & ReturnType<typeof useCart>;

const CartContext = createContext<CartContextValue | null>(null);

// Owns cart *identity* (guest session or the logged-in user's cart) and the
// cart-drawer's open/closed UI state — line items themselves are TanStack
// Query data, sourced via useCart(cartId). Drawer state lives here rather
// than in page.tsx so any component (header cart button, an "add to cart"
// success) can open it without prop-drilling.
export function CartProvider({ children }: { children: ReactNode }) {
  const sb = useMemo(() => createClient(), []);
  const { status, user } = useAuth();
  const [cartId, setCartId] = useState<string | null>(null);
  // True until the *identity* resolution (getOrCreateCart) itself has
  // settled — separate from useCart's own isLoading, which is only about
  // the items query and reports false (not loading) while cartId is still
  // null, since a query with enabled: false is idle, not loading. Without
  // this, a fresh full page load of /checkout (refresh, direct link, new
  // tab — not a client-side <Link> nav that keeps CartProvider mounted)
  // would see isLoading: false + items: [] for a tick and redirect away
  // before the real cart ever loads.
  const [isResolvingCartId, setIsResolvingCartId] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;
    setIsResolvingCartId(true);
    const identity = user
      ? { userId: user.id, sessionId: null }
      : { userId: null, sessionId: getOrCreateGuestSessionId() };

    getOrCreateCart(sb, identity)
      .then((cart) => {
        if (!cancelled) setCartId(cart.id);
      })
      .catch(() => {
        if (!cancelled) setCartId(null);
      })
      .finally(() => {
        if (!cancelled) setIsResolvingCartId(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sb, status, user]);

  const cart = useCart(cartId);

  const value: CartContextValue = {
    cartId,
    isReady: status !== "loading",
    isDrawerOpen,
    openDrawer: () => setIsDrawerOpen(true),
    closeDrawer: () => setIsDrawerOpen(false),
    ...cart,
    isLoading: isResolvingCartId || cart.isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used within CartProvider");
  return ctx;
}
