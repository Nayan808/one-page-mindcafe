"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Check, Loader2, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getFeelzCatalog } from "@/lib/api";
import { queryKeys } from "@/lib/query/hooks";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { HeroCarousel } from "@/components/feelz/HeroCarousel";
import { MeetFeelzSection } from "@/components/feelz/MeetFeelzSection";
import { moodStyleFor, MOOD_GRID, MOOD_STYLES, FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";
import { formatInr } from "@/lib/utils";
import type { ProductWithVariants } from "@/types/domain";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

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
  const router = useRouter();
  const { items, addItem, isReady, cartId, openDrawer } = useCartContext();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [addedKey, setAddedKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  // Which product card in the "Our Strips" grid is currently hovered —
  // fed down to MeetFeelzSection above so its "Your brain needs" word
  // jumps to match whatever's being hovered, instead of only auto-cycling.
  const [hoveredMoodKey, setHoveredMoodKey] = useState<string | null>(null);
  // Which mood was being added when "Add to Cart" was clicked signed out —
  // resumed automatically once sign-in completes (see the effect below).
  // Matches MoodProductCard.tsx's pendingAfterAuth pattern; only actually
  // fires for the phone/email path, not Google (page reload drops it).
  const [pendingAdd, setPendingAdd] = useState<{ moodKey: string; product: ProductWithVariants | undefined } | null>(
    null,
  );

  const catalogQuery = useQuery({
    queryKey: queryKeys.feelzCatalog(),
    queryFn: () => getFeelzCatalog(createClient()),
  });

  async function performAddToCart(moodKey: string, product: ProductWithVariants | undefined) {
    const variant = product?.product_variants[0];
    if (!variant || !isReady || !cartId) return;

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

  useEffect(() => {
    if (pendingAdd && user && isReady && cartId) {
      setPendingAdd(null);
      void performAddToCart(pendingAdd.moodKey, pendingAdd.product);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAdd, user, isReady, cartId]);

  // Older links (bookmarks, anything not yet updated) may still point at
  // /feelz#focus from before each mood got its own real page — redirect
  // those straight to /feelz/focus instead of scrolling to a hash that no
  // longer opens anything here.
  useEffect(() => {
    const key = window.location.hash.replace("#", "");
    if (MOOD_GRID.some((mood) => mood.key === key)) router.replace(`/feelz/${key}`);
  }, [router]);

  async function handleAddToCart(moodKey: string, product: ProductWithVariants | undefined) {
    if (!user) {
      setPendingAdd({ moodKey, product });
      openAuthModal();
      return;
    }
    await performAddToCart(moodKey, product);
  }

  return (
    <section ref={timelineRef} className="relative -mt-16 overflow-hidden sm:-mt-[76px]">
      {/* Real marketing creatives (see public/feelz-creative), not a
          from-scratch CSS hero — per the brief, these photographs ARE the
          design system here. TimelineContent's entrance stagger doesn't
          apply to a carousel the way it did to the old text banner, so the
          carousel just fades in as a single unit.

          The negative top margin pulls the carousel up underneath the
          floating header (which is sticky + z-30, so it stays on top and
          stays clickable) instead of leaving a solid white strip above it —
          the header's "liquid glass" pill is translucent/blurred by design,
          so the hero image now shows through it as originally intended. */}
      <TimelineContent
        as="div"
        animationNum={1}
        timelineRef={timelineRef}
        customVariants={revealVariants}
      >
        <HeroCarousel onShopClick={() => scrollTo("mood-picks")} onZostelClick={() => scrollTo("zostel-locations")} />
      </TimelineContent>

      <MeetFeelzSection hoveredKey={hoveredMoodKey} />

      <div className="bg-feelz-cream">
      <div id="mood-picks" className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-feelz-berry/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-label text-feelz-berry">
            Buy 2 packs, get 10% off — automatically
          </span>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          {MOOD_GRID.map((mood, index) => {
            const style = moodStyleFor(mood.key);
            const feelzStyle = MOOD_STYLES[mood.key];
            const colors = FEELZ_COLOR_CLASSES[feelzStyle.feelzColor];
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
                animationNum={index + 2}
                timelineRef={timelineRef}
                customVariants={revealVariants}
                onMouseEnter={() => setHoveredMoodKey(mood.key)}
                onMouseLeave={() => setHoveredMoodKey((current) => (current === mood.key ? null : current))}
                className="group flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-feelz-ink/10 bg-feelz-paper shadow-[0_1px_2px_rgba(16,35,63,0.04),0_16px_32px_-16px_rgba(16,35,63,0.25)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(16,35,63,0.06),0_20px_40px_-16px_rgba(16,35,63,0.3)]"
              >
                <Link
                  href={`/feelz/${mood.key}`}
                  className="relative block aspect-[4/5] w-full overflow-hidden"
                  aria-label={`View Feelz ${mood.label}`}
                >
                  <Image
                    src={mood.src}
                    alt={`Feelz ${mood.label} mood strip box`}
                    fill
                    sizes="(min-width: 768px) 22vw, 45vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-feelz-ink/95 via-feelz-ink/75 to-feelz-ink/10 p-4 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <p className="text-[10px] font-semibold uppercase tracking-label text-feelz-cream/60">For:</p>
                    <p className="mt-1 text-xs leading-snug text-feelz-cream/95 sm:text-[13px]">{style.description}</p>
                    <p className="mt-2 text-[10px] leading-snug text-feelz-cream/55">{style.ingredients.join(" · ")}</p>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-3 p-4 text-left">
                  <div>
                    <h3 className={`font-display text-lg font-bold leading-none sm:text-xl ${colors.text}`}>
                      {mood.label}
                    </h3>
                    <p className="font-tagline mt-1 text-xs italic text-feelz-ink/60 sm:text-sm">{style.tagline}</p>
                    <Link
                      href={`/feelz/${mood.key}`}
                      className={`mt-2 inline-flex items-center gap-1 rounded-full border ${colors.border} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-label ${colors.text} transition hover:opacity-70`}
                    >
                      View details
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    </Link>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-feelz-ink">
                        {price !== null ? formatInr(price) : catalogQuery.isLoading ? "…" : "—"}
                      </span>

                      {cartItem ? (
                        <button
                          type="button"
                          onClick={openDrawer}
                          className={`inline-flex items-center gap-1.5 rounded-full ${colors.bgTint} px-3.5 py-2 text-[11px] font-semibold uppercase tracking-label ${colors.text} transition hover:brightness-95`}
                        >
                          <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                          cart · {cartItem.quantity}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(mood.key, product)}
                          disabled={!variant || !isReady || !cartId || isPending}
                          className={`inline-flex items-center gap-1.5 rounded-full ${colors.bg} px-3.5 py-2 text-[11px] font-semibold uppercase tracking-label text-feelz-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40`}
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
              className="inline-flex items-center gap-2 rounded-full bg-feelz-ink px-6 py-3 text-sm font-semibold uppercase tracking-label text-feelz-cream transition hover:bg-feelz-ink/85"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Proceed to Cart · {items.reduce((sum, item) => sum + item.quantity, 0)}
            </button>
          </div>
        )}
      </div>
      </div>
    </section>
  );
}
