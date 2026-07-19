"use client";

import Link from "next/link";
import { useState } from "react";
import { AtSign, Globe, Mail, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToNewsletter } from "@/lib/api";
import { useAuthModal } from "@/contexts/AuthModalContext";

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");
    try {
      await subscribeToNewsletter(createClient(), email.trim());
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <p className="mt-2 text-sm text-emerald-700">You&apos;re subscribed — thanks!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-2 flex max-w-xs gap-2 sm:mx-0">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@email.com"
        className="input !py-2 text-sm"
      />
      <button type="submit" disabled={status === "submitting"} className="pill-btn shrink-0 !py-2 text-xs">
        {status === "submitting" ? "…" : "subscribe"}
      </button>
    </form>
  );
}

export function Footer() {
  const { openAuthModal } = useAuthModal();
  return (
    <footer className="mx-3 mb-3 rounded-2xl border border-ink/10 px-6 py-8 text-center sm:mx-6 sm:mb-6 sm:px-10 sm:text-left">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-bold lowercase">feelz</p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-ink/60 sm:mx-0">
            sublingual mood strips, made by mindcafé, incubated at zo world, distributed by zostel.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-ink/70">
            <li>
              <Link href="/feelz" className="hover:text-ink hover:underline">
                focus
              </Link>
            </li>
            <li>
              <Link href="/feelz" className="hover:text-ink hover:underline">
                extrovert
              </Link>
            </li>
            <li>
              <Link href="/feelz" className="hover:text-ink hover:underline">
                joy
              </Link>
            </li>
            <li>
              <Link href="/feelz" className="hover:text-ink hover:underline">
                rest
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">counselling</p>
          <ul className="mt-2 space-y-1 text-sm text-ink/70">
            <li>
              <Link href="/counselling" className="hover:text-ink hover:underline">
                1:1 counselling
              </Link>
            </li>
            <li>
              <Link href="/book-appointment" className="hover:text-ink hover:underline">
                book a session
              </Link>
            </li>
            <li>
              <Link href="/assessment" className="hover:text-ink hover:underline">
                take the assessment
              </Link>
            </li>
            <li>
              <Link href="/business" className="hover:text-ink hover:underline">
                for business
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">company</p>
          <ul className="mt-2 space-y-1 text-sm text-ink/70">
            <li>
              <Link href="/about" className="hover:text-ink hover:underline">
                about
              </Link>
            </li>
            <li>
              <a href="mailto:team@mindcafe.app" className="hover:text-ink hover:underline">
                contact
              </a>
            </li>
            <li>
              <Link href="/trust" className="hover:text-ink hover:underline">
                trust & safety
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">accounts</p>
          <ul className="mt-2 space-y-1 text-sm text-ink/70">
            <li>
              <button type="button" onClick={openAuthModal} className="hover:text-ink hover:underline">
                login
              </button>
            </li>
            <li>
              <Link href="/expert/login" className="hover:text-ink hover:underline">
                expert login
              </Link>
            </li>
            <li>
              <Link href="/employer/login" className="hover:text-ink hover:underline">
                employer login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-8 border-t border-ink/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">stay in the loop</p>
          <NewsletterForm />
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">fine print</p>
          <ul className="mt-2 space-y-1 text-sm text-ink/70">
            <li>not for medicinal use</li>
            <li>not for children, pregnant women, or those under 18</li>
            <li>fssai compliant · made in india</li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">contact</p>
          <ul className="mt-2 space-y-3 text-sm">
            <li>
              <a
                href="mailto:team@mindcafe.app"
                className="flex items-center justify-center gap-1.5 text-ink hover:underline sm:justify-start"
              >
                <Mail className="h-3.5 w-3.5 text-ink/40" aria-hidden />
                team@mindcafe.app
              </a>
              <span className="mt-0.5 block text-xs text-ink/50">response within 1 business day</span>
            </li>
            <li>
              <a
                href="tel:+917566007770"
                className="flex items-center justify-center gap-1.5 text-ink hover:underline sm:justify-start"
              >
                <Phone className="h-3.5 w-3.5 text-ink/40" aria-hidden />
                +91 75660 07770
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">follow</p>
          {/* lucide-react has no brand icons in this version — generic
              Globe stands in for LinkedIn/Facebook, matching how Instagram
              already used a generic AtSign below. */}
          <div className="mt-2 flex items-center justify-center gap-3 sm:justify-start">
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-ink/60 hover:text-ink">
              <Globe className="h-4 w-4" aria-hidden />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="text-ink/60 hover:text-ink">
              <Globe className="h-4 w-4" aria-hidden />
            </a>
            <a href="https://instagram.com/mindcafeindia" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-ink/60 hover:text-ink">
              <AtSign className="h-3.5 w-3.5" aria-hidden />
              mindcafeindia
            </a>
          </div>
          <span className="badge-pill mt-4 inline-block">ISO/IEC 27001</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 border-t border-ink/10 pt-6 text-xs text-ink/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Mindcafe — A Venture of Sneh Care Club Pvt. Ltd. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/legal/privacy" className="hover:text-ink hover:underline">
            privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-ink hover:underline">
            terms
          </Link>
          <Link href="/legal/refund" className="hover:text-ink hover:underline">
            refund & cancellation
          </Link>
        </div>
      </div>
    </footer>
  );
}
