"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getFeelzCatalog } from "@/lib/api";
import { queryKeys } from "@/lib/query/hooks";
import { useCartContext } from "@/contexts/CartContext";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { HeroCarousel } from "@/components/feelz/HeroCarousel";
import { MeetFeelzSection } from "@/components/feelz/MeetFeelzSection";
import { MOOD_GRID, MOOD_STYLES, FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";
import { useAddBundle } from "@/lib/useAddBundle";
import { FEELZ_PRODUCT_PAGES } from "@/lib/feelzProductPages";
import type { FeelzMoodKey } from "@/lib/feelzIngredients";
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
  const { items, addItem, isReady, cartId, openDrawer, notifyAdded } = useCartContext();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [addedKey, setAddedKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  // Which product card in the grid below is currently hovered — fed down
  // to MeetFeelzSection above so its "Your brain needs" word jumps to
  // match whatever's being hovered, instead of only auto-cycling.
  const [hoveredMoodKey, setHoveredMoodKey] = useState<string | null>(null);

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
      // Small "added" pop-up by the cart button — the cart itself stays closed.
      notifyAdded(product!.name, 1);
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

  // Older links (bookmarks, anything not yet updated) may still point at
  // /feelz#focus from before each mood got its own real page — redirect
  // those straight to /feelz/focus instead of scrolling to a hash that no
  // longer opens anything here.
  useEffect(() => {
    const key = window.location.hash.replace("#", "");
    if (MOOD_GRID.some((mood) => mood.key === key)) router.replace(`/feelz/${key}`);
  }, [router]);

  // No sign-in needed to shop: signed-out visitors fill a guest cart
  // (CartProvider), and sign-in is only asked for at "Pay Now"
  // (FulfillmentAndPayment.tsx).
  async function handleAddToCart(moodKey: string, product: ProductWithVariants | undefined) {
    await performAddToCart(moodKey, product);
  }

  return (
    <section ref={timelineRef} className="relative mt-2 overflow-hidden sm:-mt-[76px]">
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
        <HeroCarousel onShopClick={() => scrollTo("mood-picks")} onZostelClick={() => scrollTo("zostel-locations")}
          onBundleClick={() => scrollTo("bundle")}
        />
      </TimelineContent>

      <MeetFeelzSection hoveredKey={hoveredMoodKey} />

      <div className="bg-brand-blush/15">
      <div id="mood-picks" className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-feelz-berry/[0.2] px-4 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-feelz-berry sm:text-xs sm:tracking-label">
            Get 10% off orders of ₹300 or more
          </span>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          {MOOD_GRID.map((mood, index) => {
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
                className="group flex scroll-mt-24 flex-col overflow-hidden bg-feelz-paper shadow-[0_1px_2px_rgba(16,35,63,0.08),0_16px_32px_-16px_rgba(16,35,63,0.35)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(16,35,63,0.1),0_20px_40px_-16px_rgba(16,35,63,0.4)]"
              >
                <Link
                  href={`/feelz/${mood.key}`}
                  className="relative block aspect-square w-full overflow-hidden"
                  aria-label={`View Feelz ${mood.label}`}
                >
                  <span className="absolute right-3 top-3 z-10 rounded-full bg-feelz-cream px-3 py-1 text-[10px] font-bold uppercase tracking-label text-feelz-ink shadow-sm">
                    Strip
                  </span>
                  <Image
                    src={hoveredMoodKey === mood.key ? FEELZ_PRODUCT_PAGES[mood.key as FeelzMoodKey].images[1] : feelzStyle.catalogueSrc}
                    alt={`Feelz ${mood.label} mood strip box`}
                    fill
                    sizes="(min-width: 768px) 22vw, 45vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </Link>

                <div className="flex flex-1 flex-col gap-4 p-5 text-center text-feelz-ink">
                  <Link href={`/feelz/${mood.key}`}>
                    <h3 className="font-display text-lg font-bold leading-tight sm:text-xl">{mood.label}</h3>
                    <p className="mt-1 text-xs leading-none text-feelz-ink/50">(Pack of 10)</p>
                    <p className="mt-1.5 text-lg font-bold leading-tight text-feelz-ink/70">
                      {price !== null ? formatInr(price) : catalogQuery.isLoading ? "…" : "-"}
                    </p>
                  </Link>

                  {cartItem ? (
                    <button
                      type="button"
                      onClick={openDrawer}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full ${colors.bgCard} py-3 text-xs font-bold uppercase tracking-label text-feelz-cream transition hover:opacity-90`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                      cart · {cartItem.quantity}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddToCart(mood.key, product)}
                      disabled={!variant || !isReady || !cartId || isPending}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full ${colors.bgCard} py-3 text-xs font-bold uppercase tracking-label text-feelz-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : isAdded ? (
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                      )}
                      {isAdded ? "Added" : "Add to Cart"}
                    </button>
                  )}
                  {hasError && <p className="text-[10px] font-medium text-red-600">Couldn&apos;t add, try again</p>}
                </div>
              </TimelineContent>
            );
          })}

          <BundleCard />
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

// Full-width tile for the Feelz Bundle product under the single-mood grid
// — the same bundle the product pages sell, so it's buyable straight from
// the shop grid too (useAddBundle adds the one bundle line).
function BundleCard() {
  const { openDrawer } = useCartContext();
  const bundle = useAddBundle();

  return (
    <div id="bundle" className="col-span-2 flex scroll-mt-24 flex-col overflow-hidden bg-feelz-paper shadow-[0_1px_2px_rgba(16,35,63,0.08),0_16px_32px_-16px_rgba(16,35,63,0.35)] md:col-span-4 md:flex-row">
      <div className="relative aspect-[1774/887] w-full md:w-1/2">
        <Image
          src="/feelz-creative/bundle-banner-949.webp"
          alt={`FEELZ bundle: all four moods for ${formatInr(bundle.price)}`}
          fill
          sizes="(min-width: 768px) 45vw, 90vw"
          className="object-cover"
        />
        {bundle.savings > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold uppercase tracking-label text-white shadow-sm">
            Save {formatInr(bundle.savings)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5 text-center text-feelz-ink sm:p-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-label text-feelz-berry">Best value</p>
          <h3 className="font-display mt-1 text-xl font-bold leading-tight sm:text-2xl">Feelz Bundle</h3>
          <p className="mt-1 text-xs text-feelz-ink/50">Extrovert · Focus · Joy · Rest (40 strips)</p>
          <p className="mt-2 flex items-baseline justify-center gap-2">
            {bundle.regularPrice !== null && (
              <span className="text-sm font-semibold text-feelz-ink/40 line-through">{formatInr(bundle.regularPrice)}</span>
            )}
            <span className="text-2xl font-bold">{formatInr(bundle.price)}</span>
          </p>
        </div>

        {bundle.cartItem ? (
          <button
            type="button"
            onClick={openDrawer}
            className="inline-flex w-full max-w-xs items-center justify-center gap-1.5 rounded-full bg-feelz-ink py-3 text-xs font-bold uppercase tracking-label text-feelz-cream transition hover:opacity-90"
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
            Bundle in cart · {bundle.cartItem.quantity}
          </button>
        ) : (
          <button
            type="button"
            onClick={bundle.addBundle}
            disabled={!bundle.canAdd}
            className="inline-flex w-full max-w-xs items-center justify-center gap-1.5 rounded-full bg-feelz-ink py-3 text-xs font-bold uppercase tracking-label text-feelz-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {bundle.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            )}
            {bundle.isAdded ? "Added" : bundle.inStock ? "Add bundle to cart" : "Out of stock"}
          </button>
        )}
        {bundle.hasError && <p className="text-[10px] font-medium text-red-600">Couldn&apos;t add, try again</p>}
      </div>
    </div>
  );
}
