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
      <Image
        src="/counselling-hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-70"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(21,12,28,0.55) 0%, rgba(21,12,28,0.72) 55%, rgba(21,12,28,0.92) 100%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 sm:py-28">
        <span className="rounded-full border border-[#f4ead9]/25 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-label text-[#f4ead9]/80">
          certified professionals, private &amp; confidential
        </span>

        <h1 className="font-display mx-auto mt-6 max-w-xl text-5xl leading-[1.05] font-bold tracking-tight text-[#f6efe4] sm:text-6xl">
          Professional mental health <span className="font-tagline italic text-brand-blush">support.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm text-[#f4ead9]/70 sm:text-base">
          Confidential one-on-one counselling sessions with certified professionals, designed to help you manage
          emotional challenges, reduce stress, and build lasting mental well-being.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/book-appointment" className="btn-cine-primary group">
            Book a Session
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <a href="#how-it-works" className="btn-cine-secondary">
            How It Works
          </a>
        </div>

        <div className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#f4ead9]/65">
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
    </section>
  );
}
