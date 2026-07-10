"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const NAV_LINKS = [
  { id: "mood-picks", label: "products" },
  { id: "how-it-works", label: "how it works" },
];

export function Header() {
  const { user, profile, status, signInWithGoogle, signOut } = useAuth();
  const { itemCount } = useCartContext();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNavClick(id: string) {
    setMenuOpen(false);
    scrollTo(id);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="leading-none">
          <span className="font-display text-xl font-bold lowercase">feelz</span>
          <span className="ml-2 font-tagline text-sm text-ink/60">by mindcafé</span>
        </div>

        <nav className="hidden items-center gap-6 text-[11px] font-medium tracking-label text-ink/60 sm:flex">
          {NAV_LINKS.map((link) => (
            <button key={link.id} onClick={() => scrollTo(link.id)} className="uppercase hover:text-ink">
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {status === "authenticated" && (
            <button onClick={() => scrollTo("checkout")} className="pill-btn-outline !py-2 text-xs">
              cart{itemCount > 0 ? ` · ${itemCount}` : ""}
            </button>
          )}

          {status === "authenticated" ? (
            <button onClick={() => void signOut()} className="pill-btn !py-2 text-xs" title={profile?.full_name ?? user?.email ?? undefined}>
              sign out
            </button>
          ) : (
            status !== "loading" && (
              <button onClick={() => void signInWithGoogle()} className="pill-btn !py-2 text-xs">
                continue with google
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink sm:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col items-center gap-1 border-t border-ink/10 bg-cream px-4 py-3 text-[11px] font-medium tracking-label text-ink/70 sm:hidden">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="w-full py-2.5 text-center uppercase hover:text-ink"
            >
              {link.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
