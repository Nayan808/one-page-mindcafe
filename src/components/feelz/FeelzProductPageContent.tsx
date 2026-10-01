"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Minus, Plus, ShoppingBag, Sparkles, Target, Heart, ArrowUpRight, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getFeelzCatalog, getRecentReviews, getReviewsSummary } from "@/lib/api";
import { queryKeys } from "@/lib/query/hooks";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { Reveal } from "@/components/Reveal";
import { AccordionFaq } from "@/components/AccordionFaq";
import { MOOD_GRID, MOOD_STYLES, FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";
import { FEELZ_INGREDIENTS, type FeelzMoodKey } from "@/lib/feelzIngredients";
import { FEELZ_PRODUCT_PAGES } from "@/lib/feelzProductPages";
import { formatInr } from "@/lib/utils";
import type { ProductWithVariants } from "@/types/domain";

const BENEFIT_ICONS = [Sparkles, Target, Heart];

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
  const [pendingAdd, setPendingAdd] = useState<"cart" | "buy" | false>(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
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
    if (galleryHovered || galleryImages.length < 2) return;
    const id = window.setInterval(() => setActiveImageIndex((i) => (i + 1) % galleryImages.length), 2500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryHovered, galleryImages.length]);

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

  useEffect(() => {
    if (pendingAdd && user && isReady && cartId) {
      const thenBuy = pendingAdd === "buy";
      setPendingAdd(false);
      void performAddToCart(product, thenBuy);
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

  return (
    <div className="bg-feelz-cream">
      {/* 01. Gallery + product info */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="relative" onMouseEnter={() => setGalleryHovered(true)} onMouseLeave={() => setGalleryHovered(false)}>
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
            <div className="scrollbar-hide mt-3 flex gap-3 overflow-x-auto pb-1">
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
          </div>

          <div ref={buyPanelRef}>
            <p className={`text-[11px] font-semibold uppercase tracking-label ${colors.text}`}>FEELZ {label}</p>
            <h1 className="font-display mt-2 text-4xl font-bold text-feelz-ink sm:text-5xl">{label}</h1>
            <p className="mt-1 text-sm text-feelz-ink/60">({copy.flavor})</p>
            <p className="mt-3 text-sm font-medium text-feelz-ink/70">{copy.positioning}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {copy.benefits.map((benefit, index) => {
                const Icon = BENEFIT_ICONS[index % BENEFIT_ICONS.length];
                return (
                  <div key={benefit.label} className="rounded-xl border border-feelz-ink/10 bg-feelz-paper p-3 text-center">
                    <Icon className={`mx-auto h-5 w-5 ${colors.text}`} aria-hidden />
                    <p className="mt-2 text-[11px] font-semibold leading-tight text-feelz-ink">{benefit.label}</p>
                    <p className="text-[10px] leading-tight text-feelz-ink/50">{benefit.sub}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl border border-feelz-ink/10 bg-feelz-paper p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-ink/40">Sachet (10 strips)</p>
                <p className="mt-1 text-2xl font-bold text-feelz-ink">
                  {price !== null ? formatInr(price) : catalogQuery.isLoading ? "…" : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-feelz-ink/15 px-1 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-feelz-ink transition hover:bg-feelz-ink/5"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-feelz-ink">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-feelz-ink transition hover:bg-feelz-ink/5"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
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
              <span>Buy 2+, get 10% off — automatic at checkout</span>
              <span>Available at selected Zostel properties</span>
            </div>

            <Link href={`/ingredients#${mood}`} className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-label ${colors.text} hover:underline`}>
              Know your ingredients
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* 01b. Additional information */}
      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-feelz-ink/10 bg-feelz-paper">
          <button
            type="button"
            onClick={() => setInfoOpen((open) => !open)}
            aria-expanded={infoOpen}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-sm font-semibold text-feelz-ink">Additional information</span>
            <ChevronDown className={`h-4 w-4 text-feelz-ink/50 transition-transform ${infoOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {infoOpen && (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-feelz-ink/10 px-5 py-4 sm:grid-cols-2">
              {ADDITIONAL_INFO.map((row) => (
                <div key={row.label} className="flex justify-between gap-3 text-xs">
                  <dt className="text-feelz-ink/50">{row.label}</dt>
                  <dd className="text-right font-medium text-feelz-ink/80">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* 02. Pain point */}
      <Reveal className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <h2 className="font-display text-3xl font-bold text-feelz-ink sm:text-4xl">{copy.painPointHeadline}</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-feelz-ink/60">{copy.painPointBody}</p>
      </Reveal>

      {/* 03. Feel the difference */}
      <section className={`${colors.bg} py-14 text-feelz-cream`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Feel the difference.</h2>
          <p className="mt-3 max-w-lg text-sm text-feelz-cream/75">
            A thoughtfully crafted blend to support your {label.toLowerCase()} — for the moments that matter.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-6">
            {copy.benefits.map((benefit, index) => {
              const Icon = BENEFIT_ICONS[index % BENEFIT_ICONS.length];
              return (
                <div key={benefit.label} className="text-center">
                  <div className="relative mx-auto w-fit">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-feelz-cream/15 shadow-sm sm:h-28 sm:w-28">
                      <Image src={benefit.image} alt={benefit.label} fill sizes="112px" className="object-cover" />
                    </div>
                    <span className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-feelz-cream bg-feelz-ink text-feelz-cream shadow-sm sm:h-8 sm:w-8">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold">{benefit.label}</p>
                  <p className="text-[11px] text-feelz-cream/70">{benefit.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 04. Comparison — a real table (rows = attribute, columns = the
          alternative vs FEELZ) rather than two separate lists, matching
          the reference page's comparison-chart layout. The two lists are
          already paired one-to-one in feelzProductPages.ts (con[i] is what
          FEELZ solves instead of), so zipping them into rows is safe. */}
      <Reveal className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-feelz-ink sm:text-3xl">{copy.comparisonTitle}</h2>
        <div className="mt-8 overflow-hidden rounded-2xl border border-feelz-ink/10">
          <div className="grid grid-cols-2 divide-x divide-feelz-ink/10 border-b border-feelz-ink/10 bg-feelz-paper">
            <p className="px-4 py-3 text-xs font-semibold uppercase tracking-label text-feelz-ink/50">{copy.comparisonAgainst}</p>
            <p className={`px-4 py-3 text-xs font-semibold uppercase tracking-label ${colors.text}`}>FEELZ {label}</p>
          </div>
          {copy.comparisonAgainstCons.map((con, index) => (
            <div key={con} className="grid grid-cols-2 divide-x divide-feelz-ink/10 border-b border-feelz-ink/10 last:border-b-0 odd:bg-feelz-cream even:bg-feelz-paper">
              <p className="flex items-start gap-2 px-4 py-3 text-sm text-feelz-ink/60">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden />
                {con}
              </p>
              <p className="flex items-start gap-2 px-4 py-3 text-sm text-feelz-ink/80">
                <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${colors.text}`} aria-hidden />
                {copy.comparisonForPros[index]}
              </p>
            </div>
          ))}
          {copy.comparisonForPros.slice(copy.comparisonAgainstCons.length).map((pro) => (
            <div key={pro} className="grid grid-cols-2 divide-x divide-feelz-ink/10 border-b border-feelz-ink/10 last:border-b-0 odd:bg-feelz-cream even:bg-feelz-paper">
              <p className="px-4 py-3 text-sm text-feelz-ink/30">—</p>
              <p className="flex items-start gap-2 px-4 py-3 text-sm text-feelz-ink/80">
                <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${colors.text}`} aria-hidden />
                {pro}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 05. Ingredients */}
      <section className="border-y border-feelz-ink/10 bg-feelz-paper py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-feelz-ink sm:text-3xl">
            {ingredients.length} ingredients. One {mood === "focus" ? "focused" : mood === "joy" ? "brighter" : mood === "extrovert" ? "bolder" : "calmer"} you.
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ingredients.map((ingredient) => (
              <div key={ingredient.name} className="overflow-hidden rounded-xl border border-feelz-ink/10 bg-feelz-cream">
                {ingredient.image && (
                  <div className="relative h-20 w-full bg-white">
                    <Image src={ingredient.image} alt={ingredient.name} fill sizes="200px" className="object-contain p-2" />
                  </div>
                )}
                <div className="p-4">
                  <p className="font-display text-sm font-bold text-feelz-ink">{ingredient.name}</p>
                  <p className="text-xs text-feelz-ink/50">{ingredient.amount}</p>
                  <p className="mt-1.5 text-xs leading-snug text-feelz-ink/60">{ingredient.cardHeadline}</p>
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
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
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
