"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, ShoppingBag, ArrowUpRight, X, ChevronDown, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getFeelzCatalog, getRecentReviews, getReviewsSummary } from "@/lib/api";
import { queryKeys } from "@/lib/query/hooks";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { Reveal } from "@/components/Reveal";
import { AccordionFaq } from "@/components/AccordionFaq";
import { MOOD_GRID, MOOD_STYLES, FEELZ_COLOR_CLASSES, FEELZ_BUNDLE_PRICE } from "@/lib/moodStyles";
import { FEELZ_INGREDIENTS, type FeelzMoodKey } from "@/lib/feelzIngredients";
import { FEELZ_PRODUCT_PAGES } from "@/lib/feelzProductPages";
import { formatInr } from "@/lib/utils";
import type { ProductWithVariants } from "@/types/domain";

// Each FEELZ mood only ships in its one real flavour today — not a
// multi-flavour product line — so this renders as a single pre-selected
// pill rather than a real picker with other options to switch between.
const FLAVOR_ICON: Record<string, string> = {
  Mango: "🥭",
  Spearmint: "🌿",
  Ginger: "🫚",
  "Mixedberry + Mint": "🍓",
};

// Scattered positions for the floating sticky-note labels over the
// painPointPhoto banner — cycled by index so any note count (4 or 5) still
// spreads out across the photo instead of stacking in one spot.
const NOTE_POSITIONS = [
  "left-3 top-3 -rotate-6",
  "right-3 top-5 rotate-3",
  "left-4 bottom-16 rotate-2",
  "right-4 bottom-5 -rotate-3",
  "left-1/2 top-1/2 -translate-x-1/2 -rotate-1",
];

const PRODUCT_FAQS: Record<FeelzMoodKey, { question: string; answer: string }[]> = {
  focus: [
    { question: "What is FEELZ Focus?", answer: "A melt-in-mouth wellness strip formulated around cognitive clarity, focus and calm — for work, study and demanding moments when sustained attention matters." },
    { question: "How do I use it?", answer: "Tear open the sachet, place one strip on your tongue, and let it dissolve. No water needed." },
    { question: "How many strips are in one pack?", answer: "10 strips per pack." },
    { question: "Is FEELZ a medicine?", answer: "No. FEELZ is a wellness product and is not intended to diagnose, treat, cure or prevent any disease." },
  ],
  joy: [
    { question: "What is FEELZ Joy?", answer: "A melt-in-mouth wellness strip formulated around mood calm and inner happiness — for the days that need a little more you." },
    { question: "How do I use it?", answer: "Tear open the sachet, place one strip on your tongue, and let it dissolve. No water needed." },
    { question: "How many strips are in one pack?", answer: "10 strips per pack." },
    { question: "Is FEELZ a medicine?", answer: "No. FEELZ is a wellness product and is not intended to diagnose, treat, cure or prevent any disease." },
  ],
  extrovert: [
    { question: "What is FEELZ Extrovert?", answer: "A melt-in-mouth wellness strip formulated around confidence, energy and social vitality — for the moments you want to feel more at ease being yourself." },
    { question: "How do I use it?", answer: "Tear open the sachet, place one strip on your tongue, and let it dissolve. No water needed." },
    { question: "How many strips are in one pack?", answer: "10 strips per pack." },
    { question: "Is FEELZ a medicine?", answer: "No. FEELZ is a wellness product and is not intended to diagnose, treat, cure or prevent any disease." },
  ],
  rest: [
    { question: "What is FEELZ Rest?", answer: "A melt-in-mouth wellness strip formulated around relaxation, sleep readiness and a calmer mind — for when the day is over but your mind is still running." },
    { question: "How do I use it?", answer: "Tear open the sachet, place one strip on your tongue, and let it dissolve. No water needed." },
    { question: "How many strips are in one pack?", answer: "10 strips per pack." },
    { question: "Does FEELZ Rest contain melatonin?", answer: "Yes — one strip every 24 hours is all you need. Skip driving or machinery use right after." },
  ],
};

// Real policy language already used elsewhere on the site (checkout/trust
// copy), not invented for this page — payment-upfront/no-cancellation and
// the pincode-dependent delivery fee are both genuine, existing behavior.
const SHIPPING_RETURNS_FAQS: { question: string; answer: string }[] = [
  {
    question: "How is delivery calculated?",
    answer: "Delivery fees and free-delivery eligibility depend on your pincode, shown at checkout before you pay.",
  },
  {
    question: "Can I cancel or return an order?",
    answer:
      "Every order is paid in full upfront and processed right away, so we're unable to offer refunds or cancellations once it's placed. If something arrives damaged or incorrect, reach out to team@mindcafe.app and we'll help sort it out.",
  },
  {
    question: "Where can I track my order?",
    answer: "Once your order ships, you can check its status any time from your account's order history.",
  },
];

const ADDITIONAL_INFO: { label: string; value: string }[] = [
  { label: "Brand", value: "FEELZ by Mindcafe" },
  { label: "Manufactured for", value: "Sneh Care Club Pvt. Ltd." },
  { label: "Country of origin", value: "India" },
  { label: "Category", value: "Nutraceutical / wellness supplement" },
  { label: "Certifications", value: "FSSAI compliant" },
];

export function FeelzProductPageContent({ mood }: { mood: FeelzMoodKey }) {
  const style = MOOD_STYLES[mood];
  const colors = FEELZ_COLOR_CLASSES[style.feelzColor];
  const copy = FEELZ_PRODUCT_PAGES[mood];
  const ingredients = FEELZ_INGREDIENTS[mood];
  const label = mood.charAt(0).toUpperCase() + mood.slice(1);

  const router = useRouter();
  const { items, addItem, isReady, cartId, openDrawer } = useCartContext();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [quantity, setQuantity] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [bundlePending, setBundlePending] = useState(false);
  const [bundleAdded, setBundleAdded] = useState(false);
  const [bundleError, setBundleError] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<"cart" | "buy" | "bundle" | false>(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [openSection, setOpenSection] = useState<"description" | "benefits" | "info" | null>(null);
  const [faqTab, setFaqTab] = useState<"product" | "shipping">("product");

  // Real client-supplied product photography, in serial order (see
  // copy.images / public/feelz-creative/products/{mood}). Falls back to
  // the two previous placeholder images only if that array is ever empty.
  const boxSrc = MOOD_GRID.find((m) => m.key === mood)!.src;
  const galleryImages =
    copy.images.length > 0
      ? copy.images.map((src, index) => ({ src, alt: `FEELZ ${label} product photo ${index + 1}` }))
      : [
          { src: boxSrc, alt: `FEELZ ${label} box` },
          { src: style.heroSrc, alt: `FEELZ ${label}` },
        ];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryHovered, setGalleryHovered] = useState(false);

  // Auto-advances through the gallery every 2.5s; pauses while the mouse is
  // over the image so a swipe never interrupts someone actually looking at
  // one photo. Clicking a thumbnail or arrow (setActiveImageIndex) just
  // changes which frame this timer is currently on — it doesn't need to
  // know that.
  useEffect(() => {
    if (galleryHovered || lightboxOpen || galleryImages.length < 2) return;
    const id = window.setInterval(() => setActiveImageIndex((i) => (i + 1) % galleryImages.length), 2500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryHovered, lightboxOpen, galleryImages.length]);

  function goToPrevImage() {
    setActiveImageIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  }
  function goToNextImage() {
    setActiveImageIndex((i) => (i + 1) % galleryImages.length);
  }

  // Sticky add-to-cart bar — visible once the main buy panel scrolls out of
  // view, hidden again once it's back on screen (an IntersectionObserver
  // toggle, same mechanism Reveal.tsx already uses for scroll-in reveals).
  const buyPanelRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const node = buyPanelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { rootMargin: "-72px 0px 0px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const catalogQuery = useQuery({
    queryKey: queryKeys.feelzCatalog(),
    queryFn: () => getFeelzCatalog(createClient()),
  });
  const product = catalogQuery.data?.find((p) => p.name.trim().toLowerCase() === mood);
  const variant = product?.product_variants[0];
  const price = variant ? (variant.price_override ?? product.price) : null;
  const cartItem = variant ? items.find((item) => item.variant_id === variant.id) : undefined;

  // The bundle is one sachet of each of the four real moods — not four of
  // this one — so it's built from the full catalog (already fetched above)
  // rather than a separate bundle SKU in Supabase, which doesn't exist.
  const bundleProducts = MOOD_GRID.map((m) => catalogQuery.data?.find((p) => p.name.trim().toLowerCase() === m.key));
  const bundleReady = bundleProducts.every((p): p is ProductWithVariants => !!p?.product_variants[0]);
  // Real sum of the four moods' own prices — shown struck through next to
  // the flat FEELZ_BUNDLE_PRICE so the saving is visible, without this
  // number itself ever being what's charged (BUNDLE20 at checkout is).
  const bundleOriginalPrice = bundleReady
    ? (bundleProducts as ProductWithVariants[]).reduce((sum, p) => sum + (p.product_variants[0].price_override ?? p.price), 0)
    : null;

  const reviewsQuery = useQuery({ queryKey: ["reviews", "recent", "pdp"], queryFn: () => getRecentReviews(createClient(), 3) });
  const summaryQuery = useQuery({ queryKey: ["reviews", "summary", "pdp"], queryFn: () => getReviewsSummary(createClient()) });

  async function performAddToCart(targetProduct: ProductWithVariants | undefined, thenBuy: boolean) {
    const targetVariant = targetProduct?.product_variants[0];
    if (!targetVariant || !isReady || !cartId) return;
    setIsPending(true);
    setHasError(false);
    try {
      await addItem.mutateAsync({
        variant: targetVariant,
        product: { id: targetProduct!.id, name: targetProduct!.name, image_url: targetProduct!.image_url, price: targetProduct!.price },
        quantity,
      });
      if (thenBuy) {
        router.push("/checkout");
        return;
      }
      setIsAdded(true);
      window.setTimeout(() => setIsAdded(false), 1800);
    } catch (error) {
      console.error("Failed to add item to cart", error);
      setHasError(true);
      window.setTimeout(() => setHasError(false), 2400);
    } finally {
      setIsPending(false);
    }
  }

  async function performAddBundle() {
    if (!bundleReady || !isReady || !cartId) return;
    setBundlePending(true);
    setBundleError(false);
    try {
      for (const bundleProduct of bundleProducts as ProductWithVariants[]) {
        const bundleVariant = bundleProduct.product_variants[0];
        await addItem.mutateAsync({
          variant: bundleVariant,
          product: { id: bundleProduct.id, name: bundleProduct.name, image_url: bundleProduct.image_url, price: bundleProduct.price },
          quantity: 1,
        });
      }
      setBundleAdded(true);
      window.setTimeout(() => setBundleAdded(false), 1800);
    } catch (error) {
      console.error("Failed to add bundle to cart", error);
      setBundleError(true);
      window.setTimeout(() => setBundleError(false), 2400);
    } finally {
      setBundlePending(false);
    }
  }

  useEffect(() => {
    if (pendingAdd && user && isReady && cartId) {
      const action = pendingAdd;
      setPendingAdd(false);
      if (action === "bundle") void performAddBundle();
      else void performAddToCart(product, action === "buy");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAdd, user, isReady, cartId]);

  async function handleAddToCart(thenBuy = false) {
    if (!user) {
      setPendingAdd(thenBuy ? "buy" : "cart");
      openAuthModal();
      return;
    }
    await performAddToCart(product, thenBuy);
  }

  async function handleAddBundle() {
    if (!user) {
      setPendingAdd("bundle");
      openAuthModal();
      return;
    }
    await performAddBundle();
  }

  return (
    <div className="bg-feelz-cream">
      {/* 01. Gallery + product info */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* Sticky on desktop — the gallery stays in view while scrolling
              through the right column's (now much longer) content, and
              only scrolls away once the right column itself finishes
              scrolling past it. Off on mobile (no room for two columns
              there anyway, so nothing to stay pinned beside). */}
          <div className="lg:sticky lg:top-24">
            <div className="flex gap-3">
              {/* Vertical thumbnail rail — real product photography
                  (copy.images), stacked beside the main image on desktop
                  instead of only as a horizontal strip underneath. Mobile
                  keeps the horizontal strip below since a tall vertical
                  rail doesn't fit a narrow screen. */}
              {galleryImages.length > 1 && (
                <div className="scrollbar-hide hidden max-h-[32rem] w-16 shrink-0 flex-col gap-3 overflow-y-auto sm:flex">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image.src}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`Show image ${index + 1}`}
                      className={`relative aspect-square w-full shrink-0 overflow-hidden rounded-xl border transition ${
                        index === activeImageIndex ? `${FEELZ_COLOR_CLASSES[style.feelzColor].border} border-2` : "border-feelz-ink/10"
                      }`}
                    >
                      <Image src={image.src} alt="" fill sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="relative flex-1" onMouseEnter={() => setGalleryHovered(true)} onMouseLeave={() => setGalleryHovered(false)}>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="relative block aspect-[4/5] w-full overflow-hidden rounded-3xl border border-feelz-ink/10 bg-feelz-paper shadow-sm"
                  aria-label={`View larger image of FEELZ ${label}`}
                >
                  <Image
                    key={activeImageIndex}
                    src={galleryImages[activeImageIndex].src}
                    alt={galleryImages[activeImageIndex].alt}
                    fill
                    sizes="(min-width: 1024px) 44vw, 92vw"
                    className="animate-[fade-in_0.3s_ease-out] object-contain p-3"
                  />
                </button>
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goToPrevImage}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-feelz-ink/10 bg-white/90 text-feelz-ink shadow-sm backdrop-blur-sm transition hover:bg-white"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextImage}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-feelz-ink/10 bg-white/90 text-feelz-ink shadow-sm backdrop-blur-sm transition hover:bg-white"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </>
                )}
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="scrollbar-hide mt-3 flex gap-3 overflow-x-auto pb-1 sm:hidden">
                {galleryImages.map((image, index) => (
                  <button
                    key={image.src}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`Show image ${index + 1}`}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition ${
                      index === activeImageIndex ? `${FEELZ_COLOR_CLASSES[style.feelzColor].border} border-2` : "border-feelz-ink/10"
                    }`}
                  >
                    <Image src={image.src} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={buyPanelRef}>
            <p className={`text-[11px] font-semibold uppercase tracking-label ${colors.text}`}>FEELZ by mindcafe</p>
            <h1 className="font-display mt-2 text-3xl font-bold leading-tight text-feelz-ink sm:text-4xl">
              FEELZ {label} Wellness Strips (10 Strips: 1 x 10 strip pack)
            </h1>
            {summaryQuery.data && summaryQuery.data.count > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-amber-400"
                      fill={i < Math.round(summaryQuery.data!.average) ? "currentColor" : "none"}
                      aria-hidden
                    />
                  ))}
                </div>
                <span className="text-sm text-feelz-ink/60">
                  {summaryQuery.data.count} review{summaryQuery.data.count === 1 ? "" : "s"}
                </span>
              </div>
            )}
            <p className="mt-3 text-sm font-medium text-feelz-ink/70">{copy.positioning}</p>

            <div className="mt-4">
              <p className="text-xs font-semibold text-feelz-ink">Flavor:</p>
              <div className="mt-2 flex flex-wrap gap-2.5">
                <span className={`flex items-center gap-2 rounded-xl border-2 ${colors.border} ${colors.bgTint} px-4 py-2.5`}>
                  <span className="text-lg" aria-hidden>{FLAVOR_ICON[copy.flavor] ?? "🌿"}</span>
                  <span className="text-sm font-bold text-feelz-ink">{copy.flavor}</span>
                </span>
              </div>
            </div>

            {/* Pack of 1 / Pack of 2 / Feelz Bundle — three option tiles
                in one row instead of a free-form quantity stepper next to
                a single bundle tile. The first two just preset `quantity`
                for the Add to Cart/Buy buttons below; the bundle tile adds
                its own four distinct products immediately (it can't be a
                quantity of the current variant), same as before. Flex
                instead of an equal-width grid — Pack of 1/2's short
                content doesn't need a full third of the row, and forcing
                it there just left a lot of empty space inside those two
                cards while Bundle (which has real extra content) got the
                same width as them instead of the room it actually needs. */}
            <p className="mt-5 text-xs font-semibold text-feelz-ink">Size :</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setQuantity(1)}
                className={`relative flex min-w-[9rem] flex-col rounded-2xl border p-5 pt-6 text-left transition ${
                  quantity === 1 ? `${colors.border} border-2 ${colors.bgTint}` : "border-feelz-ink/10 bg-feelz-paper hover:border-feelz-ink/20"
                }`}
              >
                <span className={`absolute -top-2.5 left-4 rounded-full ${colors.bg} px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-label text-feelz-cream`}>
                  Best Seller
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-ink/40">Pack of 1</p>
                <p className="mt-2 text-xl font-bold text-feelz-ink sm:text-2xl">
                  {price !== null ? formatInr(price) : catalogQuery.isLoading ? "…" : "—"}
                </p>
                <p className="mt-1.5 text-[10px] text-feelz-ink/40">10 strips</p>
              </button>

              <button
                type="button"
                onClick={() => setQuantity(2)}
                className={`relative flex min-w-[9rem] flex-col rounded-2xl border p-5 pt-6 text-left transition ${
                  quantity === 2 ? `${colors.border} border-2 ${colors.bgTint}` : "border-feelz-ink/10 bg-feelz-paper hover:border-feelz-ink/20"
                }`}
              >
                <span className={`absolute -top-2.5 left-4 rounded-full ${colors.bg} px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-label text-feelz-cream`}>
                  Most Popular
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-ink/40">Pack of 2</p>
                <p className="mt-2 text-xl font-bold text-feelz-ink sm:text-2xl">
                  {price !== null ? formatInr(price * 2) : catalogQuery.isLoading ? "…" : "—"}
                </p>
                <p className="mt-1.5 text-[10px] text-feelz-ink/40">20 strips</p>
                <p className={`mt-1.5 text-[10px] font-semibold ${colors.text}`}>10% off at checkout</p>
              </button>

              {/* Variety bundle — one real sachet of each of the four
                  moods (Focus, Joy, Extrovert, Rest), not four of this
                  one. Built from the four existing products already in
                  the catalog (fetched above) rather than a separate
                  bundle SKU, since no such product/variant exists in
                  Supabase. Adds all four to the cart in one tap. */}
              <button
                type="button"
                onClick={handleAddBundle}
                disabled={!bundleReady || !isReady || !cartId || bundlePending}
                className={`relative flex min-w-[14rem] flex-col rounded-2xl border p-5 pt-6 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  bundleAdded ? `${colors.border} border-2 ${colors.bgTint}` : "border-feelz-ink/10 bg-feelz-paper hover:border-feelz-ink/20"
                }`}
              >
                <span className={`absolute -top-2.5 left-4 rounded-full ${colors.bg} px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-label text-feelz-cream`}>
                  Best Value
                </span>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-label text-feelz-ink/40">
                  Feelz Bundle
                  {bundlePending ? (
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
                  ) : bundleAdded ? (
                    <Check className={`h-3 w-3 shrink-0 ${colors.text}`} aria-hidden />
                  ) : null}
                </div>
                <p className="mt-0.5 text-[10px] leading-snug text-feelz-ink/35">Joy + Extrovert + Focus + Rest</p>
                <div className="mt-1 flex items-baseline gap-2">
                  {bundleOriginalPrice !== null && (
                    <span className="text-sm font-bold text-feelz-ink/40 line-through">{formatInr(bundleOriginalPrice)}</span>
                  )}
                  <span className="text-xl font-bold text-feelz-ink sm:text-2xl">{formatInr(FEELZ_BUNDLE_PRICE)}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-feelz-ink/40">40 strips</p>
                {bundleError && <p className="mt-1 text-xs font-medium text-red-600">couldn&apos;t add, try again</p>}
              </button>
            </div>

            {cartItem ? (
              <button
                type="button"
                onClick={openDrawer}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full ${colors.bgTint} px-6 py-3.5 text-sm font-semibold uppercase tracking-label ${colors.text}`}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden />
                In cart · {cartItem.quantity} — view cart
              </button>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  disabled={!variant || !isReady || !cartId || isPending}
                  className={`flex items-center justify-center gap-2 rounded-full border-2 ${colors.border} bg-transparent px-4 py-3.5 text-sm font-semibold uppercase tracking-label ${colors.text} transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : isAdded ? <Check className="h-4 w-4" aria-hidden /> : <ShoppingBag className="h-4 w-4" aria-hidden />}
                  {isAdded ? "Added" : "Add to Cart"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  disabled={!variant || !isReady || !cartId || isPending}
                  className={`flex items-center justify-center gap-2 rounded-full ${colors.bg} px-4 py-3.5 text-sm font-semibold uppercase tracking-label text-feelz-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  Buy it Now
                </button>
              </div>
            )}
            {hasError && <p className="mt-2 text-xs font-medium text-red-700/80">Couldn&apos;t add to cart, please try again.</p>}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-feelz-ink/50">
              <span>Fast-dissolving oral thin film</span>
              <span>Get 10% off on orders ₹300+</span>
              <span>Available at selected Zostel properties</span>
            </div>

            <Link href={`/ingredients#${mood}`} className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-label ${colors.text} hover:underline`}>
              Know your ingredients
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>

            {/* Description / Product Benefits / Additional Information —
                three stacked accordion rows (one open at a time), moved
                into this column right above the bundle banner instead of
                a separate full-width block below the whole two-column
                row. No tinted background here (plain border only), unlike
                the mood-colored cards elsewhere on this page. Description
                and Product Benefits reuse copy that already exists
                elsewhere on this page (painPointBody, benefits) rather
                than new text. */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-feelz-ink/10">
              <button
                type="button"
                onClick={() => setOpenSection((current) => (current === "description" ? null : "description"))}
                aria-expanded={openSection === "description"}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-feelz-ink">Description</span>
                <ChevronDown className={`h-4 w-4 text-feelz-ink/50 transition-transform ${openSection === "description" ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {openSection === "description" && (
                <div className="border-t border-feelz-ink/10 px-5 py-4">
                  <p className="text-xs leading-relaxed text-feelz-ink/80">{copy.painPointBody}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setOpenSection((current) => (current === "benefits" ? null : "benefits"))}
                aria-expanded={openSection === "benefits"}
                className="flex w-full items-center justify-between border-t border-feelz-ink/10 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-feelz-ink">Product Benefits</span>
                <ChevronDown className={`h-4 w-4 text-feelz-ink/50 transition-transform ${openSection === "benefits" ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {openSection === "benefits" && (
                <div className="border-t border-feelz-ink/10 px-5 py-4">
                  <ul className="space-y-3">
                    {copy.benefits.map((benefit) => (
                      <li key={benefit.label} className="text-xs">
                        <span className="font-semibold text-feelz-ink">{benefit.label}</span>
                        <span className="text-feelz-ink/60"> — {benefit.sub}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={() => setOpenSection((current) => (current === "info" ? null : "info"))}
                aria-expanded={openSection === "info"}
                className="flex w-full items-center justify-between border-t border-feelz-ink/10 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-feelz-ink">Additional Information</span>
                <ChevronDown className={`h-4 w-4 text-feelz-ink/50 transition-transform ${openSection === "info" ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {openSection === "info" && (
                <div className="border-t border-feelz-ink/10 px-5 py-4">
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                    {ADDITIONAL_INFO.map((row) => (
                      <div key={row.label} className="text-xs">
                        <dt className="text-feelz-ink/50">{row.label}</dt>
                        <dd className="mt-0.5 font-medium leading-relaxed text-feelz-ink/80">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* Bundle promo banner — sits in this column's own remaining
                space (it's shorter than the gallery beside it), not as a
                separate full-width block below the whole two-column row.
                Same handleAddBundle action as the "Feelz Bundle" tile
                above, just a second, more visible entry point into it. */}
            <button
              type="button"
              onClick={handleAddBundle}
              disabled={!bundleReady || !isReady || !cartId || bundlePending}
              className="relative mt-6 block aspect-[1774/887] w-full overflow-hidden rounded-2xl text-left transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Image src="/feelz-creative/bundle-banner-949.webp" alt={`Get the FEELZ bundle — ${formatInr(FEELZ_BUNDLE_PRICE)}`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </button>
          </div>
        </div>
      </section>

      {/* 02. Pain point — three tiers:
          1. copy.painPointImage: the real exported creative file (Rest
             only — that's the one case the client supplied the actual
             PNG for).
          2. copy.painPointPhoto: the reference creative's LOOK rebuilt
             from real site assets (a real moments photo + real typed
             headline/body/sticky-notes) for moods where only a reference
             screenshot exists — deliberately not a pasted copy of that
             screenshot.
          3. Plain text, for anything with neither yet. */}
      {copy.painPointImage ? (
        <Reveal className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="relative aspect-[1864/466] w-full overflow-hidden rounded-2xl">
            <Image src={copy.painPointImage} alt={copy.painPointHeadline} fill sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
          </div>
        </Reveal>
      ) : copy.painPointPhoto ? (
        <Reveal className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="grid overflow-hidden rounded-2xl border border-feelz-ink/10 bg-feelz-cream sm:grid-cols-2">
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
              <div className="flex items-start gap-3">
                <h2 className={`font-display text-3xl font-bold leading-[1.1] sm:text-4xl ${colors.text}`}>{copy.painPointHeadline}</h2>
                {copy.painPointAnnotation && (
                  <p className="font-tagline mt-1 hidden max-w-[7rem] shrink-0 -rotate-3 text-sm italic text-feelz-ink/50 sm:block">
                    {copy.painPointAnnotation}
                  </p>
                )}
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-feelz-ink/60">{copy.painPointBody}</p>
            </div>
            <div className="relative min-h-[16rem] sm:min-h-[22rem]">
              <Image src={copy.painPointPhoto} alt={copy.painPointHeadline} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
              {copy.painPointNotes?.map((note, index) => (
                <span
                  key={note}
                  className={`absolute rounded-md bg-[#fdf3c7] px-2.5 py-1.5 text-[11px] font-semibold text-feelz-ink shadow-md ${NOTE_POSITIONS[index % NOTE_POSITIONS.length]}`}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      ) : (
        <Reveal className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-feelz-ink sm:text-4xl">{copy.painPointHeadline}</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-feelz-ink/60">{copy.painPointBody}</p>
        </Reveal>
      )}

      {/* 02b. The other three moods — cross-sell straight off the pain
          point, before committing to "Feel the difference" below, so
          someone who isn't sure this is the right mood can switch pages
          here instead of bouncing back to /feelz first. */}
      <Reveal className="mx-auto max-w-7xl px-4 pb-14 text-center sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-ink/40">Not quite your mood?</p>
        <h3 className="font-display mt-1 text-xl font-bold text-feelz-ink sm:text-2xl">Explore the other FEELZ strips.</h3>
        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-3 gap-10 sm:gap-16">
          {MOOD_GRID.filter((m) => m.key !== mood).map((otherMood) => {
            const otherStyle = MOOD_STYLES[otherMood.key];
            const otherColors = FEELZ_COLOR_CLASSES[otherStyle.feelzColor];
            return (
              <Link
                key={otherMood.key}
                href={`/feelz/${otherMood.key}`}
                className="group mx-auto flex w-full max-w-[17rem] flex-col overflow-hidden border border-feelz-ink/10 bg-feelz-paper shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:max-w-[22rem]"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={otherStyle.catalogueSrc}
                    alt={`FEELZ ${otherMood.label}`}
                    fill
                    sizes="(min-width: 640px) 320px, 256px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3 text-center sm:p-4">
                  <p className="font-display text-base font-bold text-feelz-ink sm:text-lg">{otherMood.label}</p>
                  <p className={`mt-1 text-xs font-semibold uppercase tracking-label ${otherColors.text}`}>Shop now →</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Reveal>

      {/* 03. Feel the difference */}
      <section className={`${colors.bg} py-14 text-feelz-cream`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Feel the difference.</h2>
          <p className="mt-3 max-w-lg text-sm text-feelz-cream/75">
            A thoughtfully crafted blend to support your {label.toLowerCase()} — for the moments that matter.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-6">
            {copy.benefits.map((benefit) => (
              <div key={benefit.label} className="text-center">
                <div className="relative mx-auto aspect-square w-full max-w-[8rem] overflow-hidden rounded-2xl border border-feelz-cream/15 shadow-sm sm:max-w-[11rem]">
                  <Image src={benefit.image} alt={benefit.label} fill sizes="176px" className="object-cover" />
                </div>
                <p className="mt-3 text-xs font-semibold sm:text-sm">{benefit.label}</p>
                <p className="text-[11px] text-feelz-cream/70 sm:text-xs">{benefit.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04. Comparison — two standalone cards (the alternative vs FEELZ)
          instead of a paired-row table. The old table forced the two
          lists into a shared row index, which left an ugly empty "—" cell
          whenever FEELZ's pro list (comparisonForPros) ran longer than the
          alternative's con list (comparisonAgainstCons) — every mood's
          data has that mismatch by one item. Two independent cards sidestep
          it entirely, and let the FEELZ card visibly "win" (elevated,
          colored, scaled up on desktop) rather than sitting as a plain
          equal column next to the alternative. */}
      <Reveal className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-center text-2xl font-bold text-feelz-ink sm:text-3xl">{copy.comparisonTitle}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:items-center">
          <div className="rounded-3xl border border-feelz-ink/10 bg-feelz-paper p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-label text-feelz-ink/40">{copy.comparisonAgainst}</p>
            <ul className="mt-5 space-y-3.5">
              {copy.comparisonAgainstCons.map((con) => (
                <li key={con} className="flex items-center gap-3 text-sm text-feelz-ink/55">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50">
                    <X className="h-3.5 w-3.5 text-red-400" aria-hidden />
                  </span>
                  {con}
                </li>
              ))}
            </ul>
          </div>

          <div className={`relative rounded-3xl border-2 ${colors.border} ${colors.bgTint} p-6 shadow-[0_20px_45px_-24px_rgba(16,35,63,0.35)] sm:scale-105 sm:p-7`}>
            <span className={`absolute -top-3 left-6 rounded-full ${colors.bg} px-3 py-1 text-[10px] font-bold uppercase tracking-label text-feelz-cream`}>
              Better choice
            </span>
            <p className={`text-xs font-semibold uppercase tracking-label ${colors.text}`}>FEELZ {label}</p>
            <ul className="mt-5 space-y-3.5">
              {copy.comparisonForPros.map((pro) => (
                <li key={pro} className="flex items-center gap-3 text-sm font-medium text-feelz-ink">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${colors.bg}`}>
                    <Check className="h-3.5 w-3.5 text-feelz-cream" aria-hidden />
                  </span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>

      {/* 05. Ingredients */}
      <section className="border-y border-feelz-ink/10 bg-feelz-paper py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-feelz-ink sm:text-3xl">
            {ingredients.length} ingredients. One {mood === "focus" ? "focused" : mood === "joy" ? "brighter" : mood === "extrovert" ? "bolder" : "calmer"} you.
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ingredients.map((ingredient) => (
              <div key={ingredient.name} className={`overflow-hidden border ${colors.borderSoft} ${colors.bgSoft}`}>
                {ingredient.image && (
                  <div className="relative h-20 w-full bg-white">
                    <Image src={ingredient.image} alt={ingredient.name} fill sizes="200px" className="object-contain p-2" />
                  </div>
                )}
                <div className="p-4">
                  <p className="font-display text-sm font-bold text-feelz-ink">{ingredient.name}</p>
                  <p className="text-xs text-feelz-ink/50">{ingredient.amount}</p>
                  <p className="mt-1.5 text-xs leading-snug text-feelz-ink/60">{ingredient.cardHeadline}</p>
                  <button
                    type="button"
                    onClick={() => buyPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className={`mx-auto mt-3 flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-label ${colors.text} hover:underline`}
                  >
                    View Product
                    <ArrowUpRight className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Link href={`/ingredients#${mood}`} className={`mt-6 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-label ${colors.text} hover:underline`}>
            Explore the research
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>

      {/* 06. How to use */}
      <section className={`${colors.bg} py-14 text-feelz-cream`}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Open. Place. Dissolve. Go.</h2>
          <p className="mt-2 text-sm text-feelz-cream/70">A simple, no-fuss routine. No water. No waiting.</p>
          <div className="mt-8 grid grid-cols-2 gap-12 sm:grid-cols-4 sm:gap-16">
            {[
              { step: "Tear open the sachet", image: "/feelz-creative/steps/open.webp" },
              { step: "Place one strip on your tongue", image: "/feelz-creative/steps/place.webp" },
              { step: "Let it dissolve in seconds", image: "/feelz-creative/steps/dissolve.webp" },
              { step: `Get on with your ${label.toLowerCase()} moment`, image: "/feelz-creative/steps/go.webp" },
            ].map((item, index) => (
              <div key={item.step} className="overflow-hidden rounded-xl">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-feelz-cream/20">
                  <Image src={item.image} alt={item.step} fill sizes="200px" className="object-cover" />
                  <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-feelz-cream text-[11px] font-bold text-feelz-ink shadow">
                    {index + 1}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-snug text-feelz-cream/85">{item.step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 07. Real life moments */}
      <Reveal className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-feelz-ink sm:text-3xl">Real life moments.</h2>
        <p className="mt-2 text-sm text-feelz-ink/60">For the moments that need a little more you.</p>
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-5">
          {copy.realLifeMoments.map((moment) => (
            <div key={moment.label} className="overflow-hidden rounded-xl border border-feelz-ink/10 bg-feelz-paper">
              <div className="relative h-36 w-full sm:h-40">
                <Image src={moment.image} alt={moment.label} fill sizes="240px" className="object-cover" />
              </div>
              <div className="p-4">
                <p className="font-display text-sm font-bold text-feelz-ink">{moment.label}</p>
                <p className="mt-1 text-xs leading-snug text-feelz-ink/55">{moment.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 08. Reviews (real data only — no fabricated testimonials) */}
      {(reviewsQuery.data?.length ?? 0) > 0 && (
        <section className="border-y border-feelz-ink/10 bg-feelz-paper py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-bold text-feelz-ink sm:text-3xl">Real stories. Real moments.</h2>
              {summaryQuery.data && (
                <p className="text-sm text-feelz-ink/60">
                  <span className="font-display font-bold text-feelz-ink">{summaryQuery.data.average.toFixed(1)}/5</span> from{" "}
                  {summaryQuery.data.count} review{summaryQuery.data.count === 1 ? "" : "s"}
                </p>
              )}
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {reviewsQuery.data!.map((review) => (
                <div key={review.id} className="rounded-2xl border border-feelz-ink/10 bg-feelz-cream p-5 text-sm">
                  {review.comment && <p className="text-feelz-ink/75">&ldquo;{review.comment}&rdquo;</p>}
                  <p className="mt-3 text-xs font-medium text-feelz-ink/50">
                    {review.reviewer_name}
                    {review.city ? ` · ${review.city}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 09. FAQ */}
      <div className="mx-auto flex max-w-[52.8rem] justify-center gap-2 px-4 pt-16 sm:px-6">
        <button
          type="button"
          onClick={() => setFaqTab("product")}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-label transition ${
            faqTab === "product" ? `${colors.bg} text-feelz-cream` : "border border-feelz-ink/15 text-feelz-ink/60 hover:border-feelz-ink/30"
          }`}
        >
          This product
        </button>
        <button
          type="button"
          onClick={() => setFaqTab("shipping")}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-label transition ${
            faqTab === "shipping" ? `${colors.bg} text-feelz-cream` : "border border-feelz-ink/15 text-feelz-ink/60 hover:border-feelz-ink/30"
          }`}
        >
          Shipping &amp; returns
        </button>
      </div>
      <AccordionFaq
        id={`${mood}-faq`}
        heading="Questions, answered"
        items={faqTab === "product" ? PRODUCT_FAQS[mood] : SHIPPING_RETURNS_FAQS}
      />

      {/* 10. Closing CTA */}
      <section className={`relative overflow-hidden ${colors.bg} py-16 text-center text-feelz-cream`}>
        {/* Decorative only — several small faded ingredient photos
            scattered around the edges, not a content block, so none of
            them need a caption or need to be individually readable. */}
        {ingredients
          .filter((ingredient) => ingredient.image)
          .slice(0, 4)
          .map((ingredient, index) => {
            const positions = [
              "-left-4 -top-4 h-28 w-28 -rotate-6 sm:h-36 sm:w-36",
              "-right-6 -top-8 h-24 w-24 rotate-12 sm:h-32 sm:w-32",
              "-bottom-8 -left-8 h-32 w-32 rotate-6 sm:h-40 sm:w-40",
              "-bottom-6 -right-4 h-24 w-24 -rotate-12 sm:h-32 sm:w-32",
            ];
            return (
              <div key={ingredient.name} className={`pointer-events-none absolute opacity-30 ${positions[index]}`} aria-hidden>
                <Image src={ingredient.image!} alt="" fill className="object-contain" />
              </div>
            );
          })}
        <div className="relative mx-auto max-w-xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{copy.closingHeadline}</h2>
          <p className="mt-2 text-sm text-feelz-cream/70">{copy.closingSub}</p>
          <button
            type="button"
            onClick={() => handleAddToCart(false)}
            disabled={!variant || !isReady || !cartId || isPending}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-feelz-cream px-6 py-3 text-sm font-semibold text-feelz-ink transition hover:opacity-90 disabled:opacity-40"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Add to Cart
          </button>
        </div>
      </section>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-feelz-ink/60 p-4" onClick={() => setLightboxOpen(false)}>
          <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl bg-feelz-paper" onClick={(event) => event.stopPropagation()}>
            <Image src={galleryImages[activeImageIndex].src} alt={galleryImages[activeImageIndex].alt} fill sizes="28rem" className="object-contain p-3" />
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-feelz-paper text-feelz-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* Sticky add-to-cart bar — mirrors the buy panel's own state so it's
          never out of sync (same price/cart-item/pending checks, not a
          separate copy of the add-to-cart logic). */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-feelz-ink/10 bg-feelz-paper/95 backdrop-blur transition-transform duration-300 ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-feelz-ink">FEELZ {label}</p>
            <p className="text-xs text-feelz-ink/50">{price !== null ? formatInr(price) : "—"}</p>
          </div>
          {cartItem ? (
            <button
              type="button"
              onClick={openDrawer}
              className={`shrink-0 rounded-full ${colors.bgTint} px-5 py-2.5 text-xs font-semibold uppercase tracking-label ${colors.text}`}
            >
              View cart · {cartItem.quantity}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAddToCart(false)}
              disabled={!variant || !isReady || !cartId || isPending}
              className={`shrink-0 rounded-full ${colors.bg} px-5 py-2.5 text-xs font-semibold uppercase tracking-label text-feelz-cream transition hover:opacity-90 disabled:opacity-40`}
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
