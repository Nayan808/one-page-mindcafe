"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ShoppingBag, X } from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import { moodStyleFor } from "@/lib/moodStyles";
import { formatInr } from "@/lib/utils";

const VISIBLE_MS = 4500;

// "Added to cart" pop-up that slides in from the right just under the
// header's cart button after every add — the cart panel itself stays
// closed. Shows the product, the cart's running total and two quick
// actions; a progress bar counts down the auto-dismiss, and hovering
// pauses it (the bar's animationend is what dismisses it, so pausing the
// animation pauses the timer too).
export function CartAddedToast() {
  const { lastAdded, dismissAdded, openDrawer, itemCount, subtotal } = useCartContext();
  const router = useRouter();
  const [shown, setShown] = useState<typeof lastAdded>(null);
  const [leaving, setLeaving] = useState(false);
  const [top, setTop] = useState(96);

  useEffect(() => {
    if (!lastAdded) {
      if (shown) setLeaving(true);
      return;
    }
    // Sit just below the (sticky) header, wherever it currently is.
    const header = document.querySelector("header");
    if (header) setTop(Math.max(12, header.getBoundingClientRect().bottom + 10));
    setShown(lastAdded);
    setLeaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAdded]);

  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => {
      setShown(null);
      setLeaving(false);
    }, 320);
    return () => window.clearTimeout(id);
  }, [leaving]);

  // Escape or a tap anywhere else closes it early.
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!shown || leaving) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismissAdded();
    }
    function onPointerDown(event: PointerEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) dismissAdded();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [shown, leaving, dismissAdded]);

  if (!shown) return null;

  const style = moodStyleFor(shown.name);
  const isBundle = shown.name.trim().toLowerCase() === "feelz bundle";

  return (
    <div
      key={shown.key}
      ref={boxRef}
      role="status"
      aria-live="polite"
      style={{ top }}
      className={`cart-toast group fixed right-3 z-[60] w-[min(92vw,22rem)] sm:right-6 ${leaving ? "cart-toast-out" : "cart-toast-in"}`}
    >
      {/* Little pointer up toward the cart button (the menu button on phones). */}
      <span className="absolute -top-1.5 right-8 h-3 w-3 rotate-45 sm:right-[8rem] rounded-[2px] border-l border-t border-feelz-ink/10 bg-white" aria-hidden />

      <div className="relative overflow-hidden rounded-2xl border border-feelz-ink/10 bg-white shadow-[0_24px_60px_-18px_rgba(45,30,60,0.45)]">
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3.5">
          <p className="flex items-center gap-2 text-sm font-bold text-feelz-ink">
            <span className="cart-toast-check flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
            </span>
            Added to cart
          </p>
          <button
            type="button"
            onClick={dismissAdded}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-feelz-ink/50 transition hover:bg-feelz-ink/5 hover:text-feelz-ink"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 pb-3">
          <div className="relative h-16 w-16 shrink-0">
            <div className="h-full w-full overflow-hidden rounded-xl ring-1 ring-feelz-ink/10">
              <Image src={style.catalogueSrc} alt="" width={64} height={64} className="h-full w-full object-cover" />
            </div>
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-feelz-ink px-1 text-[10px] font-bold text-white">
              {shown.quantity}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-feelz-ink">{shown.name}</p>
            <p className="text-xs text-feelz-ink/55">{isBundle ? "All 4 moods · 40 strips" : `${style.tagline}`}</p>
          </div>
        </div>

        <div className="mx-4 flex items-center justify-between rounded-xl bg-feelz-ink/[0.04] px-3 py-2 text-xs text-feelz-ink/70">
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </span>
          <span className="font-bold text-feelz-ink">{formatInr(subtotal)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4">
          <button
            type="button"
            onClick={() => {
              dismissAdded();
              openDrawer();
            }}
            className="pill-btn-outline !py-2.5 text-xs"
          >
            View cart
          </button>
          <button
            type="button"
            onClick={() => {
              dismissAdded();
              router.push("/checkout");
            }}
            className="pill-btn !py-2.5 text-xs"
          >
            Checkout
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        {/* Auto-dismiss countdown; hover pauses it. */}
        <span
          onAnimationEnd={dismissAdded}
          style={{ animationDuration: `${VISIBLE_MS}ms` }}
          className="cart-toast-progress absolute bottom-0 left-0 h-1 w-full origin-left bg-gradient-to-r from-feelz-berry via-feelz-orange to-feelz-navy group-hover:[animation-play-state:paused]"
          aria-hidden
        />
      </div>
    </div>
  );
}
