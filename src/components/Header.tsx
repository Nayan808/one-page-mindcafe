"use client";

import { useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Avatar } from "@/components/Avatar";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const NAV_LINKS = [
  { id: "mood-picks", label: "products" },
  { id: "how-it-works", label: "how it works" },
];

export function Header() {
  const { status, profile, user, signInWithGoogle, signOut, openOrders } = useAuth();
  const { itemCount, openDrawer } = useCartContext();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNavClick(id: string) {
    setMenuOpen(false);
    scrollTo(id);
  }

  function handleMobileCart() {
    setMenuOpen(false);
    openDrawer();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <button type="button" onClick={scrollToTop} className="leading-none" aria-label="feelz home">
          <span className="font-display text-xl font-bold lowercase">feelz</span>
          <span className="ml-2 font-tagline text-sm text-ink/60">by mindcafé</span>
        </button>

        <nav className="hidden items-center gap-6 text-[11px] font-medium tracking-label text-ink/60 sm:flex">
          {NAV_LINKS.map((link) => (
            <button key={link.id} onClick={() => scrollTo(link.id)} className="uppercase hover:text-ink">
              {link.label}
            </button>
          ))}
        </nav>

        {/* Cart + account: visible inline on desktop, folded into the
            hamburger toggle on mobile so the header row stays to just the
            logo and the toggle at narrow widths. */}
        <div className="hidden items-center gap-3 sm:flex">
          {status === "authenticated" && (
            <button onClick={openDrawer} className="pill-btn-outline !py-2 text-xs">
              <ShoppingBag className="h-3.5 w-3.5 text-ink" aria-hidden />
              cart{itemCount > 0 ? ` · ${itemCount}` : ""}
            </button>
          )}

          {status === "authenticated" ? (
            <ProfileMenu />
          ) : (
            status !== "loading" && (
              <button onClick={() => void signInWithGoogle()} className="pill-btn !py-2 text-xs">
                continue with google
              </button>
            )
          )}
        </div>

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

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-ink/10 bg-cream px-4 py-3 text-[11px] font-medium tracking-label text-ink/70 sm:hidden">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="w-full py-2.5 text-center uppercase hover:text-ink"
            >
              {link.label}
            </button>
          ))}

          {status === "authenticated" && (
            <button
              onClick={handleMobileCart}
              className="flex w-full items-center justify-center gap-2 py-2.5 text-center uppercase hover:text-ink"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-ink" aria-hidden />
              cart{itemCount > 0 ? ` · ${itemCount}` : ""}
            </button>
          )}

          {status === "authenticated" ? (
            <>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  openOrders();
                }}
                className="mt-1 w-full border-t border-ink/10 py-2.5 pt-3 text-center uppercase hover:text-ink"
              >
                your orders
              </button>
              <div className="flex flex-col items-center gap-2 py-2">
                <Avatar label={profile?.full_name ?? user?.email ?? "Account"} avatarUrl={profile?.avatar_url} />
                <span className="text-center text-[10px] normal-case tracking-normal text-ink/40">
                  {profile?.full_name ?? user?.email}
                </span>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  void signOut();
                }}
                className="pill-btn-outline w-full normal-case tracking-normal"
              >
                sign out
              </button>
            </>
          ) : (
            status !== "loading" && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  void signInWithGoogle();
                }}
                className="pill-btn mt-2 w-full normal-case tracking-normal"
              >
                continue with google
              </button>
            )
          )}
        </nav>
      )}
    </header>
  );
}
