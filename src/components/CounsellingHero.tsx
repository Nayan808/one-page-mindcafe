"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Laptop, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSiteSetting } from "@/lib/api";

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
    <section className="relative overflow-hidden bg-ink text-cream">
      <Image src="/counselling/hero-bg.png" alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <span className="rounded-full border border-cream/25 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-label text-cream/70">
          certified professionals — private &amp; confidential
        </span>

        <h1 className="font-display mx-auto mt-6 max-w-xl text-4xl leading-[1.05] font-bold lowercase tracking-tight sm:text-5xl">
          professional mental health <span className="font-tagline italic">support.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm text-cream/70 sm:text-base">
          Confidential one-on-one counselling sessions with certified professionals, designed to help you manage
          emotional challenges, reduce stress, and build lasting mental well-being.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/book-appointment" className="pill-btn-white">
            book a session
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <a href="#how-it-works" className="pill-btn-outline !border-cream/30 !text-cream hover:!bg-cream/10">
            how it works
          </a>
        </div>

        <div className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-cream/60">
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
              from <span className="font-semibold text-cream">₹{priceQuery.data}</span>/session
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
