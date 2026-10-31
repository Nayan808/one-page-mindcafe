"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateCart, mergeGuestCart } from "@/lib/api";
import { clearGuestSessionId, getOrCreateGuestSessionId, readGuestSessionId } from "@/lib/guestSession";
import { useCart } from "@/lib/query/hooks";
import { useAuth } from "@/contexts/AuthContext";

type CartContextValue = {
  cartId: string | null;
  /** Whose cart `cartId` is: the signed-in user's id, or null for the guest
   * cart. Lags `user` for a moment after sign-in, while the guest cart is
   * merged in, so anything that must act on the account cart (paying right
   * after signing in) waits for this to match. */
  cartUserId: string | null;
  isReady: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** The most recent add-to-cart, for the "added" pop-up (CartAddedToast).
   * `key` changes on every add so the pop-up replays even for the same item. */
  lastAdded: { key: number; name: string; quantity: number } | null;
  notifyAdded: (name: string, quantity: number) => void;
  dismissAdded: () => void;
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
  const [cartUserId, setCartUserId] = useState<string | null>(null);
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
  const [lastAdded, setLastAdded] = useState<CartContextValue["lastAdded"]>(null);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;
    setIsResolvingCartId(true);
    const identity = user
      ? { userId: user.id, sessionId: null }
      : { userId: null, sessionId: getOrCreateGuestSessionId() };

    // Guests shop signed out and only sign in at "Pay Now", so their guest
    // cart has to be folded into the account cart *before* the account
    // cart is loaded. Merging in the background instead would show the
    // account cart without the guest's items (and race merge-guest-cart
    // into creating a second active cart). Best-effort: a failed merge
    // still loads the account cart.
    const guestSessionId = user ? readGuestSessionId() : null;
    const merged = guestSessionId
      ? mergeGuestCart(sb, guestSessionId).then(() => clearGuestSessionId())
      : Promise.resolve();

    merged
      .then(() => getOrCreateCart(sb, identity))
      .then((cart) => {
        if (cancelled) return;
        setCartId(cart.id);
        setCartUserId(identity.userId);
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
    cartUserId,
    isReady: status !== "loading",
    isDrawerOpen,
    openDrawer: () => {
      setLastAdded(null);
      setIsDrawerOpen(true);
    },
    closeDrawer: () => setIsDrawerOpen(false),
    lastAdded,
    // Skipped while the cart panel is already open (e.g. the bundle upsell
    // inside it) — the panel itself shows the change there.
    notifyAdded: (name, quantity) => {
      if (!isDrawerOpen) setLastAdded({ key: Date.now(), name, quantity });
    },
    dismissAdded: () => setLastAdded(null),
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
