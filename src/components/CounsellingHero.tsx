"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Laptop, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSiteSetting } from "@/lib/api";
import { HeroBackdrop } from "@/components/hero/HeroBackdrop";

// Static hero (spec 4.4) — no DB call needed except the session price,
// which is admin-configurable (site_settings.counselling_session_price)
// and shown live rather than hardcoded, so this trust strip never drifts
// from what booking actually charges.
export function CounsellingHero() {
  const priceQuery = useQuery({
    queryKey: ["site-settings", "counselling_session_price"],
    queryFn: () => getSiteSetting<number>(createClient(), "counselling_session_price"),
  });

  return (
    <section className="relative -mt-16 overflow-hidden bg-cream sm:-mt-[76px]">
      <HeroBackdrop src="/counselling-hero-v2.png" />

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-40 sm:px-6 sm:pb-28 sm:pt-[188px]">
        <div className="max-w-xl">
          <span className="badge-pill">certified professionals, private &amp; confidential</span>

          <h1 className="font-display mt-6 text-5xl leading-[1.05] font-bold tracking-tight text-ink sm:text-6xl">
            You don&apos;t have to <span className="font-tagline italic text-brand">figure it all out alone.</span>
          </h1>

          <div className="mt-6 h-px w-12 bg-ink/15" aria-hidden />

          <p className="mt-6 max-w-lg text-sm text-ink/70 sm:text-base">
            Private, one-on-one support from qualified mental-health professionals, when you need space to
            understand what you&apos;re feeling, work through challenges, and move forward.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/book-appointment" className="pill-btn group">
              Book a Session
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <a href="#how-it-works" className="pill-btn-outline">
              How It Works
            </a>
          </div>

          <div className="mt-8 flex max-w-lg flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink/60">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              100% confidential
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" aria-hidden />
              certified professionals
            </span>
            <span className="flex items-center gap-1.5">
              <Laptop className="h-3.5 w-3.5" aria-hidden />
              online sessions
            </span>
            {priceQuery.data != null && (
              <span>
                from <span className="font-semibold text-ink">₹{priceQuery.data}</span>/session
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
