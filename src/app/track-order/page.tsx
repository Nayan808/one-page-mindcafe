import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrderContent } from "@/components/TrackOrderContent";

export const metadata: Metadata = {
  title: "Track your order — mindcafe",
  description: "Check where your Feelz order is with your order number and phone number.",
};

// Public order tracking — works for guest orders too (no sign-in needed).
// Optional ?order=MC-000012 prefills the order number.
export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="bg-[#f7f5f6] px-4 py-20 text-center text-sm text-ink/60">Loading…</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
