"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCartContext } from "@/contexts/CartContext";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Avatar } from "@/components/Avatar";
import { getDashboardLink } from "@/lib/roleNav";

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Per-letter roll-up: each character gets its own clipped box holding two
// stacked copies, staggered slightly by index so the word rolls letter by
// letter on hover instead of sliding as one rigid block.
function RollingText({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((char, index) =>
        // A space is invisible either way, so there's nothing to roll —
        // wrapping it in the same isolated inline-block as a letter
        // collapses it to zero width in most browsers (a lone whitespace
        // text node has no rendered width once it's not part of normal
        // inline flow). A plain non-breaking space renders at its real
        // width instead.
        char === " " ? (
          <span key={index} className="inline-block">
            &nbsp;
          </span>
        ) : (
          <span key={index} className="relative inline-block h-[1em] overflow-hidden align-top">
            <span
              className="block transition-transform duration-300 ease-out group-hover:-translate-y-full"
              style={{ transitionDelay: `${index * 18}ms` }}
            >
              {char}
            </span>
            <span
              className="absolute inset-0 block translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0"
              style={{ transitionDelay: `${index * 18}ms` }}
              aria-hidden
            >
              {char}
            </span>
          </span>
        ),
      )}
    </>
  );
}

const NAV_LINKS = [
  { href: "/feelz", label: "Feelz" },
  { href: "/counselling", label: "counselling" },
  { href: "/business", label: "for business" },
  { href: "/about", label: "about" },
];

export function Header() {
  const { status, profile, user, signOut } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { itemCount, openDrawer } = useCartContext();
  const [menuOpen, setMenuOpen] = useState(false);

  // CINEMATIC MODE — homepage only.
  //
  // This Header is global, so the dark treatment must never leak onto the
  // light routes (/feelz, /counselling, …) where it would be white-on-cream
  // and unreadable. `cinematic` gates every dark style below.
  //
  // At the top of the homepage the bar is fully transparent so it sits
  // inside the artwork; past ~40px it eases into a tinted, softly-bordered
  // surface. Plain scroll position is enough now — the old wheel/touch
  // synchronisation hack existed only for the removed ScrollExpandMedia
  // hero, which pinned scrollY at 0 and made position untrustworthy.
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  // Whether the bar is still sitting over the dark hero artwork. This is NOT
  // the same as "on the homepage" — the page turns ivory below the hero, and
  // treating the whole route as dark left cream links on cream, invisible.
  const [overHero, setOverHero] = useState(true);

  useEffect(() => {
    if (!isHome) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      setScrolled(window.scrollY > 40);
      const hero = document.getElementById("home-hero");
      // The bar has left the artwork once the hero's bottom edge passes above
      // the bar itself. Falls back to a scroll threshold if the hero is
      // absent, so other pages using this Header can never get stuck dark.
      setOverHero(hero ? hero.getBoundingClientRect().bottom > 96 : window.scrollY < 400);
    };

    // rAF-throttled: getBoundingClientRect is a layout read, so it must not
    // run once per scroll event.
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();

    // The first measure runs before the hero has its final height (fonts and
    // the artwork are still settling), so it can read a collapsed box and
    // decide "not over the hero" — and with nothing scrolling, that wrong
    // answer would stand forever. Watching the hero for resize means any
    // layout settle re-measures, which self-corrects that first read.
    const hero = document.getElementById("home-hero");
    const ro = hero ? new ResizeObserver(onScroll) : null;
    if (hero && ro) ro.observe(hero);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("load", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("load", onScroll);
    };
  }, [isHome]);

  // `cinematic` = the floating Liquid Glass island. Now on EVERY route, not
  // just the homepage, so the navbar is one consistent component sitewide.
  // The only thing that turns it off is the mobile menu, which needs a solid
  // opaque surface to be readable when expanded.
  const cinematic = !menuOpen;
  // `onDark` = that island is over the homepage hero artwork, so it takes
  // cream type and a light rim. Everywhere else — inner pages, and the
  // homepage below the hero — it keeps the identical glass shape and blur
  // but flips to the light-ground variant with ink type.
  //
  // isHome is required here: `overHero` only updates on the homepage (its
  // effect returns early elsewhere), so without this guard it would stay
  // true on inner pages and paint cream text onto a light panel.
  const onDark = cinematic && isHome && overHero;
  // Retained for the mobile-menu-open state below.
  const solid = !isHome;

  const dashboardLink = getDashboardLink(profile?.role);

  function handleMobileCart() {
    setMenuOpen(false);
    openDrawer();
  }

  // The mobile menu panel is always solid bg-brand-blush, so if the header
  // itself is still in its transparent/white-text state (top of the
  // homepage, not yet scrolled) when it opens, the logo and close button
  // render white-on-blush — hard to read against each other. Opening the
  // menu always forces the solid/dark styling regardless of scroll position.
  const headerSolid = solid || menuOpen;

  return (
    <header
      // In cinematic mode the <header> itself carries no surface at all — it
      // is just a transparent frame providing the inset. The Liquid Glass
      // panel is the inner row, so it reads as a floating island over the
      // artwork rather than a bar welded to the top of the page.
      //
      // The light-route branch keeps the newer solid #FAF4F7 bar and its
      // blush shadow — that styling came from the other side of this merge
      // and is deliberately preserved.
      className={`sticky top-0 z-30 transition-all duration-500 ease-out ${
        cinematic
          ? "px-3 pt-3 sm:px-6 sm:pt-4"
          : headerSolid
            ? "border-b border-ink/10 bg-[#FAF4F7] shadow-[0_1px_24px_-8px_rgba(207,150,175,0.35)]"
            : "border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between transition-all duration-500 ${
          cinematic
            ? `liquid-glass rounded-full px-4 py-2.5 sm:px-6 sm:py-3 ${onDark ? "" : "liquid-glass-onlight"} ${scrolled ? "liquid-glass-dense" : ""}`
            : "px-5 py-4 sm:px-8"
        }`}
      >
        <Link href="/" onClick={scrollToTop} className="flex shrink-0 items-center gap-2 leading-none">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-colors ${headerSolid ? "bg-cream/90" : "bg-white/90"}`}
          >
            <Image src="/mindcafe-icon.png" alt="" width={28} height={28} priority className="h-7 w-7" />
          </span>
          <span className={`font-display text-xl font-bold tracking-tight ${onDark ? "text-[#f6efe4]" : cinematic ? "text-ink" : headerSolid ? "text-ink" : "text-white"}`}>mindcafe</span>
        </Link>

        {/* Cinematic nav: lighter weight, wider letter-spacing and a hairline
            underline wipe (.nav-cine) instead of the roll-up, which reads as
            calmer and more architectural against the artwork. Light routes
            keep the original RollingText treatment untouched. */}
        <nav
          className={`font-display hidden items-center sm:flex ${
            cinematic
              ? `gap-9 text-[11px] font-medium tracking-[0.18em] ${onDark ? "text-[#f6efe4]/70" : "text-ink/65"}`
              : `gap-7 text-sm font-semibold tracking-label ${headerSolid ? "text-ink/70" : "text-white/90"}`
          }`}
        >
          {NAV_LINKS.map((link) =>
            cinematic ? (
              <Link key={link.href} href={link.href} className={`nav-cine ${onDark ? "hover:text-[#f6efe4]" : "hover:text-brand"}`}>
                {link.label}
              </Link>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`group uppercase leading-none ${headerSolid ? "hover:text-brand" : "hover:text-white"}`}
              >
                <RollingText text={link.label} />
              </Link>
            ),
          )}
        </nav>

        {/* Cart + account: visible inline on desktop, folded into the
            hamburger toggle on mobile so the header row stays to just the
            logo and the toggle at narrow widths. Outline buttons are
            written out explicitly per state (not `pill-btn-outline` +
            override classes) since layering a white-text utility on top
            of that shared class isn't guaranteed to win the cascade. */}
        <div className="hidden items-center gap-3 sm:flex">
          {/* Book Session = tertiary (outlined), Log In = the navbar's
              strongest action. Both use the shared .btn-cine-* system, so
              they share radius, type and easing with the hero CTAs and read
              as one hierarchy: hero primary > nav solid > nav ghost. */}
          <Link
            href="/book-appointment"
            className={
              onDark
                ? "btn-cine-ghost"
                : cinematic || headerSolid
                  ? "pill-btn-outline !py-2 text-xs"
                  : "inline-flex items-center justify-center gap-1.5 rounded-full border border-white/40 bg-transparent px-5 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            }
          >
            Book Session
          </Link>

          {status === "authenticated" && (
            <button
              onClick={openDrawer}
              className={
                onDark
                  ? "btn-cine-ghost"
                  : cinematic || headerSolid
                    ? "pill-btn-outline !py-2 text-xs"
                    : "inline-flex items-center justify-center gap-1.5 rounded-full border border-white/40 bg-transparent px-5 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              }
            >
              <ShoppingBag
                className={`h-3.5 w-3.5 ${onDark ? "text-[#f4ead9]" : "text-ink"}`}
                aria-hidden
              />
              Cart{itemCount > 0 ? ` · ${itemCount}` : ""}
            </button>
          )}

          {status === "authenticated" ? (
            <ProfileMenu />
          ) : (
            status !== "loading" && (
              <button type="button" onClick={openAuthModal} className={onDark ? "btn-cine-solid" : "pill-btn !py-2 text-xs"}>
                Log In
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border sm:hidden ${
            onDark ? "border-[#f4ead9]/25 text-[#f6efe4]" : "border-ink/15 text-ink"
          }`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-ink/10 bg-[#FAF4F7] px-4 py-3 text-[11px] font-medium tracking-label text-ink/70 sm:hidden">
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
                Sign Out
              </button>
            </>
          ) : (
            status !== "loading" && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openAuthModal();
                }}
                className="pill-btn mt-2 w-full normal-case tracking-normal"
              >
                Log In
              </button>
            )
          )}
        </nav>
      )}
    </header>
  );
}
