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
//
// Background + type treatment mirrors the homepage hero (HomeHero.tsx):
// same near-black wash (#150c1c) blended in from the edges, the same
// warm cream (#f4ead9) type color, and the identical .btn-cine-primary/
// -secondary button pair — this page just swaps HomeHero's abstract dark
// artwork for a real photo (a warm, softly lit counselling room) since
// the mood being sold here is "someone who gets it", not the brand
// artwork itself.
export function CounsellingHero() {
  const priceQuery = useQuery({
    queryKey: ["site-settings", "counselling_session_price"],
    queryFn: () => getSiteSetting<number>(createClient(), "counselling_session_price"),
  });

  return (
    <section className="relative overflow-hidden text-[#f6efe4]" style={{ backgroundColor: "#150c1c" }}>
      <HeroBackdrop src="/counselling-hero-v2.png" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-28">
        <div className="max-w-xl">
          <span className="inline-block rounded-full border border-[#f4ead9]/25 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-label text-[#f4ead9]/80">
            certified professionals, private &amp; confidential
          </span>

          <h1 className="font-display mt-6 text-5xl leading-[1.05] font-bold tracking-tight text-[#f6efe4] sm:text-6xl">
            You don&apos;t have to <span className="font-tagline italic text-brand-blush">figure it all out alone.</span>
          </h1>

          <div className="mt-6 h-px w-12 bg-[#f6efe4]/25" aria-hidden />

          <p className="mt-6 max-w-lg text-sm text-[#f4ead9]/70 sm:text-base">
            Private, one-on-one support from qualified mental-health professionals, when you need space to
            understand what you&apos;re feeling, work through challenges, and move forward.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/book-appointment" className="btn-cine-primary group">
              Book a Session
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <a href="#how-it-works" className="btn-cine-secondary">
              How It Works
            </a>
          </div>

          <div className="mt-8 flex max-w-lg flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#f4ead9]/65">
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
                from <span className="font-semibold text-[#f6efe4]">₹{priceQuery.data}</span>/session
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
