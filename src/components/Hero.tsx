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
import { TimelineContent } from "@/components/ui/timeline-animation";
import { moodStyleFor } from "@/lib/moodStyles";
import { formatInr } from "@/lib/utils";
import type { ProductWithVariants } from "@/types/domain";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const MOOD_GRID = [
  { key: "extrovert", label: "extrovert", src: "/products/extrovert.png" },
  { key: "focus", label: "focus", src: "/products/focus.png" },
  { key: "joy", label: "joy", src: "/products/joy.png" },
  { key: "rest", label: "rest", src: "/products/rest.png" },
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
  const { user, openLoginModal } = useAuth();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [addedKey, setAddedKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const catalogQuery = useQuery({
    queryKey: queryKeys.feelzCatalog(),
    queryFn: () => getFeelzCatalog(createClient()),
  });

  async function handleAddToCart(moodKey: string, product: ProductWithVariants | undefined) {
    const variant = product?.product_variants[0];
    if (!variant || !isReady || !cartId) return;

    if (!user) {
      openLoginModal();
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
      setAddedKey(moodKey);
      openDrawer();
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
    <section ref={timelineRef} className="bg-cream">
      <div className="mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-5xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <TimelineContent
          as="button"
          animationNum={1}
          timelineRef={timelineRef}
          customVariants={revealVariants}
          onClick={() => scrollTo("products")}
          className="mx-auto flex w-fit items-center gap-1 rounded-full border-4 border-ink/10 bg-ink py-0.5 pl-0.5 pr-3 text-xs"
        >
          <span className="rounded-full bg-cream px-2 py-1 text-[11px] font-semibold uppercase tracking-label text-ink">
            new
          </span>
          <span className="inline-block px-1 text-cream sm:text-sm">
            incubated at zo world <span className="font-semibold">· distributed by zostel</span>
          </span>
          <ArrowRight className="h-3 w-3 text-cream" aria-hidden />
        </TimelineContent>

        <TimelineContent
          as="h1"
          animationNum={2}
          timelineRef={timelineRef}
          customVariants={revealVariants}
          className="font-display mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] font-bold lowercase tracking-tight text-ink sm:text-6xl xl:text-7xl"
        >
          tear it. place it.{" "}
          <span className="bg-gradient-to-r from-[#f0405f] to-[#ff8a3d] bg-clip-text text-transparent">feel</span> it
          in{" "}
          <span className="bg-gradient-to-r from-[#2461e0] to-[#17b88b] bg-clip-text text-transparent">
            sixty seconds
          </span>
          .
        </TimelineContent>

        <TimelineContent
          as="p"
          animationNum={3}
          timelineRef={timelineRef}
          customVariants={revealVariants}
          className="font-tagline mx-auto mt-6 max-w-xl text-lg italic text-ink/70 sm:text-xl"
        >
          fast-dissolving mood strips — focus, extrovert, joy &amp; rest, on demand. no water, no sugar, made in
          india.
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={4}
          timelineRef={timelineRef}
          customVariants={revealVariants}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <button onClick={() => scrollTo("mood-picks")} className="pill-btn">
            shop feelz ↓
          </button>
          <button onClick={() => scrollTo("mood-picks")} className="pill-btn-outline">
            find at zostel
          </button>
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={5}
          timelineRef={timelineRef}
          customVariants={revealVariants}
          className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-center gap-2"
        >
          {["fssai ✓", "no sugar", "no water needed", "made in india"].map((tag) => (
            <span key={tag} className="badge-pill">
              {tag}
            </span>
          ))}
        </TimelineContent>
      </div>

      <div id="mood-picks" className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="text-center">
          <div className="mx-auto flex w-fit items-center gap-3">
            <span className="h-px w-10 bg-ink/20" aria-hidden />
            <span className="h-1.5 w-1.5 rounded-full bg-ink/40" aria-hidden />
            <span className="h-px w-10 bg-ink/20" aria-hidden />
          </div>
          <h2 className="font-display mt-4 text-2xl font-bold uppercase tracking-[0.3em] text-ink sm:text-3xl">
            — our strips —
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
                animationNum={index + 6}
                timelineRef={timelineRef}
                customVariants={revealVariants}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_1px_2px_rgba(17,17,16,0.04),0_16px_32px_-16px_rgba(17,17,16,0.25)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(17,17,16,0.06),0_20px_40px_-16px_rgba(17,17,16,0.3)]"
              >
                <button
                  type="button"
                  onClick={() => scrollTo("products")}
                  className="relative block aspect-[4/5] w-full overflow-hidden"
                  aria-label={`View feelz ${mood.label}`}
                >
                  <Image
                    src={mood.src}
                    alt={`feelz ${mood.label} mood strip box`}
                    fill
                    sizes="(min-width: 768px) 22vw, 45vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/95 via-ink/75 to-ink/10 p-4 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <p className="text-[10px] font-semibold uppercase tracking-label text-cream/60">what it does</p>
                    <p className="mt-1 text-xs leading-snug text-cream/95 sm:text-[13px]">{style.description}</p>
                    <p className="mt-2 text-[10px] leading-snug text-cream/55">{style.ingredients.join(" · ")}</p>
                  </div>
                </button>

                <div className="flex flex-1 flex-col justify-between gap-3 p-4 text-left">
                  <div>
                    <h3 className="font-display text-lg font-bold lowercase leading-none text-ink sm:text-xl">
                      {mood.label}
                    </h3>
                    <p className="font-tagline mt-1 text-xs italic text-ink/60 sm:text-sm">{style.tagline}</p>
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
                    {hasError && <p className="mt-1.5 text-[10px] font-medium text-red-700/80">couldn&apos;t add — try again</p>}
                  </div>
                </div>
              </TimelineContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
