"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ApiError, submitFeedback } from "@/lib/api";
import { MOOD_GRID } from "@/lib/moodStyles";

const TOPICS = [
  { value: "feelz", label: "Feelz" },
  { value: "counselling", label: "Counselling" },
  { value: "website", label: "Website" },
  { value: "other", label: "Something else" },
] as const;

const PRODUCTS = [...MOOD_GRID.map((mood) => mood.label), "Feelz Bundle"];
const RATING_WORDS = ["", "Not great", "Could be better", "Okay", "Good", "Loved it"];

const CARD = "rounded-[18px] border border-[#eee4e9] bg-white p-6 shadow-[0_14px_36px_rgba(45,65,96,0.08)] sm:p-8";
const LABEL = "mb-1.5 block text-xs font-semibold text-brand-navy";

// The shareable feedback form. Submits through the submit-feedback Edge
// Function; everything lands in /admin/feedback.
export function FeedbackForm() {
  const searchParams = useSearchParams();
  const source = searchParams.get("ref")?.slice(0, 80) ?? undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState<string>("feelz");
  const [product, setProduct] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [canPublish, setCanPublish] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("Please add your name.");
    if (rating === 0) return setError("Please choose a star rating.");
    if (!message.trim()) return setError("Please write a few words about your experience.");
    setError(null);
    setIsSubmitting(true);
    try {
      await submitFeedback(createClient(), {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        topic,
        product: topic === "feelz" ? product || undefined : undefined,
        rating,
        message: message.trim(),
        canPublish,
        source,
        honeypot,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong — please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const shownRating = hoverRating || rating;

  return (
    <div className="bg-[#f7f5f6] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-xl">
        {done ? (
          <div className={`${CARD} text-center`}>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf3ee] text-[#477d67]">
              <CheckCircle2 className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-brand-navy">
              Thank you{name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}!
            </h1>
            <p className="mt-2 text-sm text-[#718096]">Your feedback has reached the Mindcafe team. We read every response.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/feelz" className="pill-btn">
                Explore Feelz
              </Link>
              <Link href="/" className="pill-btn-outline">
                Back to home
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand">Mindcafe · Feelz</p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.02em] text-brand-navy sm:text-4xl">
                How was your experience?
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#718096]">
                Tell us how Feelz or your Mindcafe session worked for you. It takes about a minute.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={`${CARD} relative space-y-5`} noValidate>
              {/* Honeypot — off-screen, out of the tab order and hidden from
                  screen readers; see submit-feedback Edge Function. */}
              <div className="absolute left-[-9999px]" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <fieldset>
                <legend className={LABEL}>What is your feedback about?</legend>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTopic(t.value)}
                      aria-pressed={topic === t.value}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                        topic === t.value
                          ? "border-brand bg-brand text-white"
                          : "border-[#eee4e9] bg-white text-[#68768b] hover:border-brand/40"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {topic === "feelz" && (
                <div>
                  <label htmlFor="product" className={LABEL}>
                    Which Feelz did you try? <span className="font-normal text-[#8992a0]">(optional)</span>
                  </label>
                  <select id="product" value={product} onChange={(e) => setProduct(e.target.value)} className="input">
                    <option value="">Choose one</option>
                    {PRODUCTS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <fieldset>
                <legend className={LABEL}>Your rating</legend>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHoverRating(value)}
                        aria-label={`${value} star${value === 1 ? "" : "s"}`}
                        aria-pressed={rating === value}
                        className="rounded-md p-0.5 text-amber-400 transition-transform hover:scale-110"
                      >
                        <Star className="h-8 w-8" fill={value <= shownRating ? "currentColor" : "none"} aria-hidden />
                      </button>
                    ))}
                  </div>
                  {shownRating > 0 && <span className="text-xs font-semibold text-[#68768b]">{RATING_WORDS[shownRating]}</span>}
                </div>
              </fieldset>

              <div>
                <label htmlFor="message" className={LABEL}>
                  Your feedback
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What did you like? What could be better?"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="name" className={LABEL}>
                  Your name
                </label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="input" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className={LABEL}>
                    Email <span className="font-normal text-[#8992a0]">(optional)</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className={LABEL}>
                    Phone <span className="font-normal text-[#8992a0]">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    className="input"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-[#faf8f9] p-3 text-xs text-[#5e6b7f]">
                <input
                  type="checkbox"
                  checked={canPublish}
                  onChange={(e) => setCanPublish(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#986178]"
                />
                <span>Mindcafe can show my feedback and name on its website.</span>
              </label>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="pill-btn w-full py-3">
                {isSubmitting ? "Sending…" : "Send feedback"}
              </button>
              <p className="text-center text-[11px] text-[#8992a0]">
                Your contact details are only used by the Mindcafe team and are never shown publicly.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
