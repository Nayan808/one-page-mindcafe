"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, MapPin, Search, ShoppingBag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getActivePickupLocations, getFeelzCatalog } from "@/lib/api";
import { queryKeys } from "@/lib/query/hooks";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { OrderConfirmation } from "@/components/OrderConfirmation";
import { ScanOrderPayment } from "@/components/ScanOrderPayment";
import { formatInr } from "@/lib/utils";
import type { ProductWithVariants } from "@/types/domain";

type Step = "location" | "products" | "cart" | "payment";

const PICKUP_LOCATIONS_QUERY_KEY = ["pickup-locations", "scan-order"];

function LocationStep({ onSelect }: { onSelect: (id: string) => void }) {
  const locationsQuery = useQuery({
    queryKey: PICKUP_LOCATIONS_QUERY_KEY,
    queryFn: () => getActivePickupLocations(createClient()),
  });
  const locations = locationsQuery.data ?? [];
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!trimmedQuery) return locations;
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(trimmedQuery) || location.city.toLowerCase().includes(trimmedQuery),
    );
  }, [locations, trimmedQuery]);

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Where are you?</h1>
      <p className="mt-1 text-sm text-ink/60">Pick the Zostel you&apos;re ordering from.</p>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your city or Zostel…"
          inputMode="search"
          className="input !pl-10 !pr-9 !text-base sm:!text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-ink/40 hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {locationsQuery.isLoading ? (
        <p className="mt-6 text-sm text-ink/60">Loading Zostel pickup points…</p>
      ) : locations.length === 0 ? (
        <p className="mt-6 text-sm text-ink/60">No pickup points available right now.</p>
      ) : results.length === 0 ? (
        <p className="mt-6 text-sm text-ink/60">No Zostel matches &ldquo;{query.trim()}&rdquo;.</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {results.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => onSelect(location.id)}
              className="flex w-full items-start gap-3 rounded-xl border border-ink/15 bg-white p-4 text-left text-sm shadow-sm transition active:scale-[0.99] active:border-ink sm:p-3 sm:hover:border-ink"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink/40" aria-hidden />
              <span className="min-w-0">
                <span className="block font-medium text-ink">{location.name}</span>
                <span className="mt-0.5 block text-ink/60">
                  {location.address}, {location.city}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductsStep({ onViewCart }: { onViewCart: () => void }) {
  const { items, addItem, updateQuantity, removeItem, isReady, cartId } = useCartContext();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const catalogQuery = useQuery({
    queryKey: queryKeys.feelzCatalog(),
    queryFn: () => getFeelzCatalog(createClient()),
  });

  // Deliberately no `if (!user)` gate here, unlike Hero.tsx's product
  // cards — this flow is guest-friendly by design, login is only required
  // once the wizard reaches the payment step.
  async function handleAdd(product: ProductWithVariants) {
    const variant = product.product_variants[0];
    if (!variant || !isReady || !cartId) return;
    setPendingId(product.id);
    setErrorId(null);
    try {
      await addItem.mutateAsync({
        variant,
        product: { id: product.id, name: product.name, image_url: product.image_url, price: product.price },
        quantity: 1,
      });
      setAddedId(product.id);
      window.setTimeout(() => setAddedId((current) => (current === product.id ? null : current)), 1800);
    } catch {
      setErrorId(product.id);
      window.setTimeout(() => setErrorId((current) => (current === product.id ? null : current)), 2400);
    } finally {
      setPendingId((current) => (current === product.id ? null : current));
    }
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Pick your strips</h1>
          <p className="mt-1 text-sm text-ink/60">Add as many as you like.</p>
        </div>
        {itemCount > 0 && (
          <button
            type="button"
            onClick={onViewCart}
            className="pill-btn shrink-0 gap-1.5 !py-2 text-xs"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            cart · {itemCount}
          </button>
        )}
      </div>

      {catalogQuery.isLoading ? (
        <p className="mt-6 text-sm text-ink/60">Loading strips…</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
          {(catalogQuery.data ?? []).map((product) => {
            const variant = product.product_variants[0];
            const price = variant ? (variant.price_override ?? product.price) : product.price;
            const cartItem = variant ? items.find((item) => item.variant_id === variant.id) : undefined;
            const isPending = pendingId === product.id;
            const isAdded = addedId === product.id;
            const hasError = errorId === product.id;

            return (
              <div key={product.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
                <div className="relative aspect-square w-full bg-cream">
                  {product.image_url && (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(min-width: 640px) 12rem, 45vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-display text-base font-bold capitalize text-ink">{product.name}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{formatInr(price)}</span>
                    {cartItem ? (
                      <div className="flex items-center rounded-full bg-ink/10">
                        <button
                          type="button"
                          onClick={() =>
                            cartItem.quantity <= 1
                              ? removeItem.mutate(cartItem.id)
                              : updateQuantity.mutate({ cartItemId: cartItem.id, quantity: cartItem.quantity - 1 })
                          }
                          className="px-2.5 py-1.5 text-sm font-bold text-ink"
                          aria-label={`Decrease ${product.name} quantity`}
                        >
                          −
                        </button>
                        <span className="min-w-[1.25rem] text-center text-xs font-semibold text-ink">
                          {cartItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity.mutate({ cartItemId: cartItem.id, quantity: cartItem.quantity + 1 })}
                          className="px-2.5 py-1.5 text-sm font-bold text-ink"
                          aria-label={`Increase ${product.name} quantity`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAdd(product)}
                        disabled={!variant || !isReady || !cartId || isPending}
                        className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold uppercase tracking-label text-cream disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        ) : isAdded ? (
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                        )}
                        add
                      </button>
                    )}
                  </div>
                  {hasError && <p className="mt-1 text-[10px] font-medium text-red-700/80">couldn&apos;t add, try again</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CartStep({ onBack, onCheckout }: { onBack: () => void; onCheckout: () => void }) {
  const { items, subtotal, updateQuantity, removeItem } = useCartContext();

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Your cart</h1>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-ink/60">Your cart is empty.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((item) => {
            const price = item.product_variants.price_override ?? item.product_variants.products.price;
            return (
              <li key={item.id} className="rounded-xl border border-ink/15 bg-cream p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink">{item.product_variants.products.name}</span>
                  <span className="text-ink/60">{formatInr(price * item.quantity)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-ink/15 bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        item.quantity <= 1
                          ? removeItem.mutate(item.id)
                          : updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })
                      }
                      className="px-3 py-1.5 text-sm font-bold text-ink"
                      aria-label={`Decrease ${item.product_variants.products.name} quantity`}
                    >
                      −
                    </button>
                    <span className="min-w-[1.5rem] text-center text-sm font-semibold text-ink">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
                      className="px-3 py-1.5 text-sm font-bold text-ink"
                      aria-label={`Increase ${item.product_variants.products.name} quantity`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem.mutate(item.id)}
                    className="text-xs font-medium text-ink/50 underline hover:text-ink"
                  >
                    remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-sm font-medium">
        <span>Subtotal</span>
        <span>{formatInr(subtotal)}</span>
      </div>

      <div className="mt-6 flex gap-2">
        <button type="button" onClick={onBack} className="pill-btn-outline flex-1">
          add more
        </button>
        <button type="button" onClick={onCheckout} disabled={items.length === 0} className="pill-btn flex-1 disabled:opacity-40">
          proceed to pay
        </button>
      </div>
    </div>
  );
}

function ScanOrderInner() {
  const searchParams = useSearchParams();
  const prefillLocation = searchParams.get("location");

  const [locationId, setLocationId] = useState<string | null>(prefillLocation);
  const [step, setStep] = useState<Step>(prefillLocation ? "products" : "location");
  const [orderId, setOrderId] = useState<string | null>(null);

  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  // Validates a prefilled ?location= once the real list has loaded — an
  // outdated/inactive/mistyped location falls back to the manual picker
  // instead of silently letting an order attach to a bad location id.
  const locationsQuery = useQuery({
    queryKey: PICKUP_LOCATIONS_QUERY_KEY,
    queryFn: () => getActivePickupLocations(createClient()),
  });
  useEffect(() => {
    if (!prefillLocation || locationsQuery.isLoading) return;
    const locations = locationsQuery.data ?? [];
    if (!locations.some((location) => location.id === prefillLocation)) {
      setLocationId(null);
      setStep("location");
    }
  }, [prefillLocation, locationsQuery.isLoading, locationsQuery.data]);

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      {step === "location" && (
        <LocationStep
          onSelect={(id) => {
            setLocationId(id);
            setStep("products");
          }}
        />
      )}

      {step === "products" && <ProductsStep onViewCart={() => setStep("cart")} />}

      {step === "cart" && (
        <CartStep onBack={() => setStep("products")} onCheckout={() => setStep("payment")} />
      )}

      {step === "payment" &&
        (orderId ? (
          <OrderConfirmation
            orderId={orderId}
            onStartNewOrder={() => {
              setOrderId(null);
              setStep("location");
            }}
            backLabel="Start a new order"
          />
        ) : !user ? (
          <div className="text-center">
            <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Log in to pay</h1>
            <p className="mt-2 text-sm text-ink/60">Your cart is saved — sign in to complete payment.</p>
            <button type="button" onClick={openAuthModal} className="pill-btn mt-6">
              Log In
            </button>
          </div>
        ) : locationId ? (
          <ScanOrderPayment locationId={locationId} onBack={() => setStep("cart")} onOrderPlaced={setOrderId} />
        ) : (
          <p className="text-center text-sm text-ink/60">Pick a Zostel location first.</p>
        ))}
    </div>
  );
}

export function ScanOrderContent() {
  return (
    <div className="min-h-[calc(100svh-4.5rem)] bg-white">
      <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>}>
        <ScanOrderInner />
      </Suspense>
    </div>
  );
}
