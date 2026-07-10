"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Header() {
  const { user, profile, status, signInWithGoogle, signOut } = useAuth();
  const { itemCount } = useCartContext();

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="leading-none">
          <span className="font-display text-xl font-bold lowercase">feelz</span>
          <span className="ml-2 font-tagline text-sm text-ink/60">by mindcafé</span>
        </div>

        <nav className="hidden items-center gap-6 text-[11px] font-medium tracking-label text-ink/60 sm:flex">
          <button onClick={() => scrollTo("products")} className="uppercase hover:text-ink">
            moods
          </button>
          <button onClick={() => scrollTo("zostel")} className="uppercase hover:text-ink">
            find a zostel
          </button>
          <button onClick={() => scrollTo("heads-up")} className="uppercase hover:text-ink">
            fine print
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => scrollTo("checkout")} className="pill-btn-outline !py-2 text-xs">
            cart{itemCount > 0 ? ` · ${itemCount}` : ""}
          </button>

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
        </div>
      </div>
    </header>
  );
}
