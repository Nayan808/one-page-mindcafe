"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  addCartItem,
  createAddress,
  getCartItems,
  getOrder,
  getUserAddresses,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/api";
import type { Database } from "@/types/supabase";

export const queryKeys = {
  cart: (cartId: string | null) => ["cart", cartId] as const,
  feelzCatalog: () => ["products", "feelz-catalog"] as const,
  order: (orderId: string) => ["orders", orderId] as const,
  addresses: (userId: string) => ["addresses", userId] as const,
};

// Cart *identity* (which cart) lives in CartContext; this hook owns the
// line-item data so it stays reactive and cache-invalidatable.
export function useCart(cartId: string | null) {
  const queryClient = useQueryClient();
  const sb = createClient();

  const itemsQuery = useQuery({
    queryKey: queryKeys.cart(cartId),
    queryFn: () => getCartItems(sb, cartId!),
    enabled: Boolean(cartId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.cart(cartId) });

  const addItem = useMutation({
    mutationFn: (args: { variantId: string; quantity: number }) =>
      addCartItem(sb, cartId!, args.variantId, args.quantity),
    onSuccess: invalidate,
  });

  const updateQuantity = useMutation({
    mutationFn: (args: { cartItemId: string; quantity: number }) =>
      updateCartItemQuantity(sb, args.cartItemId, args.quantity),
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: (cartItemId: string) => removeCartItem(sb, cartItemId),
    onSuccess: invalidate,
  });

  const items = itemsQuery.data ?? [];
  const subtotal = items.reduce((sum, item) => {
    const price = item.product_variants.price_override ?? item.product_variants.products.price;
    return sum + price * item.quantity;
  }, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, subtotal, itemCount, isLoading: itemsQuery.isLoading, addItem, updateQuantity, removeItem };
}

export function useAddresses(userId: string | null) {
  const queryClient = useQueryClient();
  const sb = createClient();
  const queryKey = queryKeys.addresses(userId ?? "");

  const addressesQuery = useQuery({
    queryKey,
    queryFn: () => getUserAddresses(sb, userId!),
    enabled: Boolean(userId),
  });

  const addAddress = useMutation({
    mutationFn: (input: Database["public"]["Tables"]["addresses"]["Insert"]) => createAddress(sb, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { addresses: addressesQuery.data ?? [], isLoading: addressesQuery.isLoading, addAddress };
}

// Order confirmation / tracking: subscribes to this order's status so it
// flips placed -> confirmed -> shipped -> delivered live. Degrades to the
// last fetched snapshot if the Realtime channel disconnects.
export function useOrderTracking(orderId: string | null) {
  const queryClient = useQueryClient();
  const sb = createClient();
  const queryKey = queryKeys.order(orderId ?? "");

  const orderQuery = useQuery({
    queryKey,
    queryFn: () => getOrder(sb, orderId!),
    enabled: Boolean(orderId),
    refetchInterval: (query) => (query.state.data?.status === "delivered" ? false : 15_000),
  });

  useEffect(() => {
    if (!orderId) return;
    const channel = sb
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        () => queryClient.invalidateQueries({ queryKey }),
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return orderQuery;
}
