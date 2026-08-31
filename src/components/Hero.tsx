"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Loader2, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getFeelzCatalog } from "@/lib/api";
import { queryKeys } from "@/lib/query/hooks";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useGuestPhone } from "@/contexts/GuestPhoneContext";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { Modal } from "@/components/Modal";
import { moodStyleFor } from "@/lib/moodStyles";
import { formatInr } from "@/lib/utils";
import type { ProductWithVariants } from "@/types/domain";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const MOOD_GRID = [
  { key: "extrovert", label: "Extrovert", src: "/products/extrovert.png" },
  { key: "focus", label: "Focus", src: "/products/focus.png" },
  { key: "joy", label: "Joy", src: "/products/joy.png" },
  { key: "rest", label: "Rest", src: "/products/rest.png" },
];

const revealVariants = {
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.15,
      duration: 0.5,
    },
  }),
  hidden: {
    filter: "blur(10px)",
    y: -20,
    opacity: 0,
  },
};

export function Hero() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { items, addItem, isReady, cartId, openDrawer } = useCartContext();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { guestPhone } = useGuestPhone();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [addedKey, setAddedKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);

  const catalogQuery = useQuery({
    queryKey: queryKeys.feelzCatalog(),
    queryFn: () => getFeelzCatalog(createClient()),
  });

  async function handleAddToCart(moodKey: string, product: ProductWithVariants | undefined) {
    const variant = product?.product_variants[0];
    if (!variant || !isReady || !cartId) return;

    // Feelz doesn't require a real account — a guest who's already given
    // their phone number this session (via AuthModal's Feelz-only
    // FeelzPhoneForm, opened below) skips straight through. Only someone
    // with neither a logged-in account nor a captured guest phone gets
    // stopped here.
    if (!user && !guestPhone) {
      openAuthModal();
      return;
    }

    setPendingKey(moodKey);
    setErrorKey(null);
    try {
      await addItem.mutateAsync({
        variant,
        product: { id: product!.id, name: product!.name, image_url: product!.image_url, price: product!.price },
        quantity: 1,
      });
      // Not auto-opening the drawer here — the "added" checkmark plus the
      // existing "cart · N" button (shown below once cartItem is truthy)
      // already surfaces this without interrupting someone still comparing
      // other moods.
      setAddedKey(moodKey);
      window.setTimeout(() => setAddedKey((current) => (current === moodKey ? null : current)), 1800);
    } catch (error) {
      console.error("Failed to add item to cart", error);
      setErrorKey(moodKey);
      window.setTimeout(() => setErrorKey((current) => (current === moodKey ? null : current)), 2400);
    } finally {
      setPendingKey((current) => (current === moodKey ? null : current));
    }
  }

  return (
    <section ref={timelineRef} className="relative overflow-hidden bg-white">
      {/* This wrapper — not the outer <section> — owns the background image.
          The section also contains the "Our Strips" grid below, so an
          absolutely-positioned image/overlay placed directly on the section
          would stretch to cover the section's full height (hero + grid
          combined) instead of just the hero banner. Scoping it to a div
          sized by just the hero content keeps the photo confined to this
          banner only. */}
      <div className="relative overflow-hidden text-[#f6efe4]" style={{ backgroundColor: "#150c1c" }}>
        <Image src="/feelz-hero.png" alt="" fill priority sizes="100vw" className="object-cover opacity-70" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(21,12,28,0.55) 0%, rgba(21,12,28,0.72) 55%, rgba(21,12,28,0.92) 100%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 py-12 text-center sm:px-6">
        <TimelineContent
          as="div"
          animationNum={0}
          timelineRef={timelineRef}
          customVariants={revealVariants}
          className="relative mb-4 flex h-20 w-20 flex-col items-center justify-center gap-1 overflow-hidden rounded-full border border-white/40 bg-white/30 shadow-lg backdrop-blur-md"
        >
          <span className="relative h-8 w-8 shrink-0">
            <Image src="/press/zostel-star.png" alt="" fill className="object-contain" />
          </span>
          <span className="text-[8px] font-semibold uppercase tracking-widest text-ink/70">Zostel</span>
        </TimelineContent>

        <TimelineContent
          as="button"
          animationNum={1}
          timelineRef={timelineRef}
          customVariants={revealVariants}
          onClick={() => scrollTo("products")}
          className="mx-auto flex w-fit items-center gap-1 rounded-full border-4 border-ink/5 bg-white py-0.5 pl-0.5 pr-3 text-xs"
        >
          <span className="rounded-full bg-ink px-2 py-1 text-[11px] font-semibold uppercase tracking-label text-cream">
            new
          </span>
          <span className="inline-flex items-center px-1 text-ink sm:text-sm">
            incubated at Zo World
            <span className="ml-1 inline-flex items-center gap-1 font-semibold">
              · distributed by Zostel
            </span>
          </span>
          <ArrowRight className="h-3 w-3 text-ink" aria-hidden />
        </TimelineContent>

        <TimelineContent
          as="h1"
          animationNum={2}
          timelineRef={timelineRef}
          customVariants={revealVariants}
          className="font-display mx-auto mt-6 max-w-3xl text-5xl leading-[1.05] font-bold tracking-tight text-[#f6efe4] sm:text-7xl xl:text-8xl"
        >
          <span className="block text-center">Feelz better.</span>
          <span className="block text-center">
            Wherever{" "}
            <span className="bg-gradient-to-r from-brand via-brand-blush to-brand-navy bg-clip-text text-transparent">
              the day takes you
            </span>
            .
          </span>
        </TimelineContent>

        <TimelineContent
          as="p"
          animationNum={3}
          timelineRef={timelineRef}
          customVariants={revealVariants}
          className="font-tagline mx-auto mt-6 max-w-xl text-lg italic text-[#f4ead9]/70 sm:text-xl"
        >
          Fast-dissolving Nutraceutical strips designed to support focus, confidence, inner happiness, and rest —
          anytime, anywhere.
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={4}
          timelineRef={timelineRef}
          customVariants={revealVariants}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <button onClick={() => scrollTo("mood-picks")} className="btn-cine-primary">
            Shop Feelz ↓
          </button>
          <button onClick={() => scrollTo("zostel-locations")} className="btn-cine-secondary">
            <span className="relative h-5 w-5 shrink-0">
              <Image src="/press/zostel-star.png" alt="" fill className="object-contain" />
            </span>
            Find at Zostel
          </button>
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={5}
          timelineRef={timelineRef}
          customVariants={revealVariants}
          className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-center gap-2"
        >
          {["FSSAI ✓", "No Sugar", "No Water Needed", "Made in India"].map((tag) => (
            <span key={tag} className="badge-pill">
              {tag}
            </span>
          ))}
        </TimelineContent>
        </div>
      </div>

      <div className="bg-white">
      <div id="mood-picks" className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="text-center">
          <div className="mx-auto flex w-fit items-center gap-3">
            <span className="h-px w-10 bg-ink/20" aria-hidden />
            <span className="h-1.5 w-1.5 rounded-full bg-ink/40" aria-hidden />
            <span className="h-px w-10 bg-ink/20" aria-hidden />
          </div>
          <h2 className="font-display mt-4 text-3xl font-bold uppercase tracking-[0.3em] text-ink sm:text-4xl">
            Our Strips
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {MOOD_GRID.map((mood, index) => {
            const style = moodStyleFor(mood.key);
            const product = catalogQuery.data?.find((p) => p.name.trim().toLowerCase() === mood.key);
            const variant = product?.product_variants[0];
            const price = variant ? (variant.price_override ?? product.price) : null;
            const isPending = pendingKey === mood.key;
            const isAdded = addedKey === mood.key;
            const hasError = errorKey === mood.key;
            const cartItem = variant ? items.find((item) => item.variant_id === variant.id) : undefined;

            return (
              <TimelineContent
                as="div"
                key={mood.key}
                id={mood.key}
                animationNum={index + 6}
                timelineRef={timelineRef}
                customVariants={revealVariants}
                className="group flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_1px_2px_rgba(17,17,16,0.04),0_16px_32px_-16px_rgba(17,17,16,0.25)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(17,17,16,0.06),0_20px_40px_-16px_rgba(17,17,16,0.3)]"
              >
                <button
                  type="button"
                  onClick={() => setDetailKey(mood.key)}
                  className="relative block aspect-[4/5] w-full overflow-hidden"
                  aria-label={`View details for Feelz ${mood.label}`}
                >
                  <Image
                    src={mood.src}
                    alt={`Feelz ${mood.label} mood strip box`}
                    fill
                    sizes="(min-width: 768px) 22vw, 45vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/95 via-ink/75 to-ink/10 p-4 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <p className="text-[10px] font-semibold uppercase tracking-label text-cream/60">For:</p>
                    <p className="mt-1 text-xs leading-snug text-cream/95 sm:text-[13px]">{style.description}</p>
                    <p className="mt-2 text-[10px] leading-snug text-cream/55">{style.ingredients.join(" · ")}</p>
                  </div>
                </button>

                <div className="flex flex-1 flex-col justify-between gap-3 p-4 text-left">
                  <div>
                    <h3 className="font-display text-lg font-bold leading-none text-ink sm:text-xl">
                      {mood.label}
                    </h3>
                    <p className="font-tagline mt-1 text-xs italic text-ink/60 sm:text-sm">{style.tagline}</p>
                    <button
                      type="button"
                      onClick={() => setDetailKey(mood.key)}
                      className="mt-1.5 text-[11px] font-semibold uppercase tracking-label text-ink/50 underline underline-offset-2 transition hover:text-ink"
                    >
                      view details
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {price !== null ? formatInr(price) : catalogQuery.isLoading ? "…" : "—"}
                      </span>

                      {cartItem ? (
                        <button
                          type="button"
                          onClick={openDrawer}
                          className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-label text-ink transition hover:bg-ink/15"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                          cart · {cartItem.quantity}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(mood.key, product)}
                          disabled={!variant || !isReady || !cartId || isPending}
                          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[11px] font-semibold uppercase tracking-label text-cream transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          ) : isAdded ? (
                            <Check className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                          )}
                          {isAdded ? "added" : "add"}
                        </button>
                      )}
                    </div>
                    {hasError && <p className="mt-1.5 text-[10px] font-medium text-red-700/80">couldn&apos;t add, try again</p>}
                  </div>
                </div>
              </TimelineContent>
            );
          })}
        </div>

        {items.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={openDrawer}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-label text-cream transition hover:bg-ink/85"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Proceed to Cart · {items.reduce((sum, item) => sum + item.quantity, 0)}
            </button>
          </div>
        )}
      </div>
      </div>

      {(() => {
        const mood = MOOD_GRID.find((m) => m.key === detailKey);
        if (!mood) return null;
        const style = moodStyleFor(mood.key);
        const product = catalogQuery.data?.find((p) => p.name.trim().toLowerCase() === mood.key);
        const variant = product?.product_variants[0];
        const price = variant ? (variant.price_override ?? product.price) : null;
        const cartItem = variant ? items.find((item) => item.variant_id === variant.id) : undefined;
        const isPending = pendingKey === mood.key;
        const isAdded = addedKey === mood.key;

        return (
          <Modal isOpen={!!detailKey} onClose={() => setDetailKey(null)} title={mood.label} panelClassName="max-w-md">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
              <Image src={mood.src} alt={`Feelz ${mood.label} mood strip box`} fill sizes="28rem" className="object-cover" />
            </div>

            <p className="font-tagline mt-3 text-sm italic text-ink/60">{style.tagline}</p>

            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">For:</p>
              <p className="mt-1 text-sm text-ink/80">{style.description}</p>
            </div>

            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">Ingredients</p>
              <p className="mt-1 text-sm text-ink/70">{style.ingredients.join(" · ")}</p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-ink/10 pt-4">
              <span className="text-base font-semibold text-ink">
                {price !== null ? formatInr(price) : catalogQuery.isLoading ? "…" : "—"}
              </span>
              {cartItem ? (
                <button type="button" onClick={openDrawer} className="pill-btn gap-1.5 !py-2 text-xs">
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                  Cart · {cartItem.quantity}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAddToCart(mood.key, product)}
                  disabled={!variant || !isReady || !cartId || isPending}
                  className="pill-btn gap-1.5 !py-2 text-xs disabled:opacity-40"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : isAdded ? <Check className="h-3.5 w-3.5" aria-hidden /> : <ShoppingBag className="h-3.5 w-3.5" aria-hidden />}
                  {isAdded ? "Added" : "Add to Cart"}
                </button>
              )}
            </div>
          </Modal>
        );
      })()}
    </section>
  );
}
