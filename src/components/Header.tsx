"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Avatar } from "@/components/Avatar";
import { getDashboardLink } from "@/lib/roleNav";

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const NAV_LINKS = [
  { href: "/feelz", label: "feelz" },
  { href: "/counselling", label: "counselling" },
  { href: "/business", label: "for business" },
  { href: "/about", label: "about" },
];

export function Header() {
  const { status, profile, user, signOut } = useAuth();
  const { itemCount, openDrawer } = useCartContext();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Only the homepage opens with a transparent header (its hero is a
  // full-bleed video/image) — every other page keeps the normal solid
  // one. HomeHero's ScrollExpandMedia intercepts wheel/touch scroll
  // itself and keeps window.scrollY pinned at 0 until the media finishes
  // expanding, so this can't just watch scroll position; it mirrors the
  // same wheel/touch-direction check ScrollExpandMedia uses internally to
  // decide "collapse back to the top" (deltaY < 0 near scrollY 0), so the
  // two stay in sync without the two components needing to share state.
  const isHome = pathname === "/";
  const [solid, setSolid] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setSolid(true);
      return;
    }
    setSolid(false);

    let touchStartY = 0;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) setSolid(true);
      else if (e.deltaY < 0 && window.scrollY <= 5) setSolid(false);
    };
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = touchStartY - e.touches[0].clientY;
      if (deltaY > 0) setSolid(true);
      else if (deltaY < 0 && window.scrollY <= 5) setSolid(false);
    };
    const handleScroll = () => {
      if (window.scrollY > 0) setSolid(true);
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isHome]);

  const loginHref = `/login?returnTo=${encodeURIComponent(pathname || "/")}`;
  const dashboardLink = getDashboardLink(profile?.role);

  function handleMobileCart() {
    setMenuOpen(false);
    openDrawer();
  }

  return (
    <header
      className={`sticky top-0 z-30 transition-colors duration-300 ${
        solid ? "border-b border-ink/10 bg-cream/90 backdrop-blur" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" onClick={scrollToTop} className="shrink-0 leading-none">
          <span className={`font-display text-xl font-bold ${solid ? "text-ink" : "text-white"}`}>Mindcafe</span>
        </Link>

        <nav
          className={`hidden items-center gap-6 text-[11px] font-medium tracking-label sm:flex ${
            solid ? "text-ink/60" : "text-white/80"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`uppercase ${solid ? "hover:text-ink" : "hover:text-white"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Cart + account: visible inline on desktop, folded into the
            hamburger toggle on mobile so the header row stays to just the
            logo and the toggle at narrow widths. Outline buttons are
            written out explicitly per state (not `pill-btn-outline` +
            override classes) since layering a white-text utility on top
            of that shared class isn't guaranteed to win the cascade. */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/book-appointment"
            className={
              solid
                ? "pill-btn-outline !py-2 text-xs"
                : "inline-flex items-center justify-center gap-1.5 rounded-full border border-white/40 bg-transparent px-5 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            }
          >
            book session
          </Link>

          {status === "authenticated" && (
            <button
              onClick={openDrawer}
              className={
                solid
                  ? "pill-btn-outline !py-2 text-xs"
                  : "inline-flex items-center justify-center gap-1.5 rounded-full border border-white/40 bg-transparent px-5 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              }
            >
              <ShoppingBag className={`h-3.5 w-3.5 ${solid ? "text-ink" : "text-white"}`} aria-hidden />
              cart{itemCount > 0 ? ` · ${itemCount}` : ""}
            </button>
          )}

          {status === "authenticated" ? (
            <ProfileMenu />
          ) : (
            status !== "loading" && (
              <Link href={loginHref} className="pill-btn !py-2 text-xs">
                log in
              </Link>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border sm:hidden ${
            solid ? "border-ink/15 text-ink" : "border-white/40 text-white"
          }`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-ink/10 bg-cream px-4 py-3 text-[11px] font-medium tracking-label text-ink/70 sm:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="w-full py-2.5 text-center uppercase hover:text-ink"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/book-appointment"
            onClick={() => setMenuOpen(false)}
            className="w-full py-2.5 text-center uppercase hover:text-ink"
          >
            book session
          </Link>

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
              {dashboardLink && (
                <Link
                  href={dashboardLink.href}
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 w-full border-t border-ink/10 py-2.5 pt-3 text-center uppercase hover:text-ink"
                >
                  {dashboardLink.label}
                </Link>
              )}
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className={`w-full py-2.5 text-center uppercase hover:text-ink ${dashboardLink ? "" : "mt-1 border-t border-ink/10 pt-3"}`}
              >
                your account
              </Link>
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
              <Link
                href={loginHref}
                onClick={() => setMenuOpen(false)}
                className="pill-btn mt-2 w-full normal-case tracking-normal"
              >
                log in
              </Link>
            )
          )}
        </nav>
      )}
    </header>
  );
}
