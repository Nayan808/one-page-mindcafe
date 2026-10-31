import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata: Metadata = {
  title: "Share your feedback | mindcafe",
  description: "Tell us how Feelz or your mindcafe session worked for you. It takes about a minute.",
};

// Shareable link: /feedback, optionally /feedback?ref=<tag> so the admin
// list shows which share a response came from. Every submission lands in
// /admin/feedback.
export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="bg-[#f7f5f6] px-4 py-20 text-center text-sm text-ink/60">Loading…</div>}>
      <FeedbackForm />
    </Suspense>
  );
}
