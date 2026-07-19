import { ShieldCheck } from "lucide-react";

const SECTIONS = [
  {
    title: "data privacy",
    body: "Your account details, order history, and anything shared in a counselling session are stored securely and never sold to third parties. Payment details are handled entirely by Razorpay — this app never sees or stores your card/UPI information directly.",
  },
  {
    title: "payments & refunds",
    body: "Every order — Feelz products and counselling sessions alike — is paid in full upfront through Razorpay at checkout; nothing is collected later or on delivery. Because payment is collected upfront and orders are processed right away, we're unable to offer refunds or cancellations once an order is placed, so please review your cart or session details before confirming. If something arrives damaged, incorrect, or a session needs rescheduling, reach out and we'll help sort it out.",
  },
  {
    title: "session confidentiality",
    body: "What you share with a counsellor stays between you and them, with the standard safety exceptions any licensed professional follows (like risk of harm to yourself or others) — always explained upfront, never a surprise.",
  },
  {
    title: "account security",
    body: "Sign in with Google or an email/password account; either way, access to your data is scoped to your account only. If you ever suspect unauthorized access, reach out and we'll help immediately.",
  },
];

export default function TrustPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-6 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-medium text-amber-800">
        DRAFT — pending legal/compliance review, not final copy.
      </div>

      <div className="text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-ink" aria-hidden />
        <h1 className="font-display mt-3 text-3xl font-bold lowercase text-ink sm:text-4xl">trust &amp; safety</h1>
      </div>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="font-display text-lg font-bold lowercase text-ink">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">{section.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-center gap-2 rounded-xl border border-ink/10 bg-cream p-4">
        <ShieldCheck className="h-4 w-4 text-ink/60" aria-hidden />
        <span className="text-sm font-medium text-ink">ISO/IEC 27001 — information security aligned</span>
      </div>
      </div>
    </div>
  );
}
