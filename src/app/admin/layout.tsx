"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Calendar,
  FileQuestion,
  Gift,
  Mail,
  Map as MapIcon,
  Menu,
  Milestone as MilestoneIcon,
  Package,
  ShoppingBag,
  Sliders,
  Star,
  Users,
  UserSquare2,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { href: "/admin", label: "dashboard", Icon: BarChart3 },
  { href: "/admin/orders", label: "orders", Icon: ShoppingBag },
  { href: "/admin/appointments", label: "appointments", Icon: Calendar },
  { href: "/admin/products", label: "products", Icon: Package },
  { href: "/admin/coupons", label: "coupons", Icon: Gift },
  { href: "/admin/pickup-locations", label: "pickup locations", Icon: MapIcon },
  { href: "/admin/pincodes", label: "pincodes", Icon: MapIcon },
  { href: "/admin/experts", label: "experts", Icon: UserSquare2 },
  { href: "/admin/business-leads", label: "business leads", Icon: Briefcase },
  { href: "/admin/reviews", label: "reviews", Icon: Star },
  { href: "/admin/faqs", label: "faqs", Icon: FileQuestion },
  { href: "/admin/therapy-categories", label: "therapy categories", Icon: FileQuestion },
  { href: "/admin/milestones", label: "milestones", Icon: MilestoneIcon },
  { href: "/admin/site-settings", label: "site settings", Icon: Sliders },
  { href: "/admin/newsletter", label: "newsletter", Icon: Mail },
  { href: "/admin/users", label: "users & roles", Icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?returnTo=%2Fadmin");
  }, [status, router]);

  if (status === "loading" || (status === "authenticated" && !profile)) {
    return <div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>;
  }

  if (status === "unauthenticated") {
    return <div className="px-4 py-16 text-center text-sm text-ink/60">Redirecting…</div>;
  }

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold lowercase text-ink">access denied</h1>
        <p className="mt-2 text-sm text-ink/60">This account doesn&apos;t have admin access.</p>
        <Link href="/account" className="pill-btn mt-6">
          back to your account
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-ink bg-cream shadow-lg lg:hidden"
        aria-label="Toggle admin menu"
      >
        {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 shrink-0 overflow-y-auto border-r border-ink/10 bg-cream px-4 py-6 transition-transform lg:sticky lg:top-16 lg:z-auto lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:border lg:border-ink/10 lg:rounded-2xl ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <p className="px-2 text-[11px] font-semibold uppercase tracking-label text-ink/40">
          admin{profile?.role === "super_admin" ? " · super" : ""}
        </p>
        <nav className="mt-3 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium ${
                  active ? "bg-ink text-cream" : "text-ink/70 hover:bg-ink/5"
                }`}
              >
                <item.Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
    </div>
  );
}
