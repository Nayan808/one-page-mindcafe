"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

// Same centered-popup treatment as the cart drawer, factored out so the
// login and orders popups don't each reimplement the overlay/escape/
// scroll-lock plumbing.
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  panelClassName = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  panelClassName?: string;
}) {
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`relative flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl bg-cream shadow-2xl transition-all duration-300 ${isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"} ${panelClassName}`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-xl font-bold lowercase">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="scrollbar-hide flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
