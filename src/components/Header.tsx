"use client";

import { useState } from "react";
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

  const loginHref = `/login?returnTo=${encodeURIComponent(pathname || "/")}`;
  const dashboardLink = getDashboardLink(profile?.role);

  function handleMobileCart() {
    setMenuOpen(false);
    openDrawer();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" onClick={scrollToTop} className="shrink-0 leading-none">
          <span className="font-display text-xl font-bold">Mindcafe</span>
        </Link>

        <nav className="hidden items-center gap-6 text-[11px] font-medium tracking-label text-ink/60 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="uppercase hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Cart + account: visible inline on desktop, folded into the
            hamburger toggle on mobile so the header row stays to just the
            logo and the toggle at narrow widths. */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/book-appointment" className="pill-btn-outline !py-2 text-xs">
            book session
          </Link>

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
              <Link href={loginHref} className="pill-btn !py-2 text-xs">
                log in
              </Link>
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
