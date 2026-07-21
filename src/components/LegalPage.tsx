const CONTENT: Record<"privacy" | "terms" | "refund", { title: string; body: string[] }> = {
  privacy: {
    title: "privacy policy",
    body: [
      "This page will describe what personal data mindcafe collects, why, and how it's stored and protected.",
      "Placeholder — replace with reviewed copy before this page goes live for real users.",
    ],
  },
  terms: {
    title: "terms of service",
    body: [
      "This page will set out the terms governing use of mindcafe's products and services.",
      "Placeholder — replace with reviewed copy before this page goes live for real users.",
    ],
  },
  refund: {
    title: "refund & cancellation policy",
    body: [
      "This page will explain how refunds and order cancellations are handled for Feelz orders and counselling sessions.",
      "Placeholder — replace with reviewed copy before this page goes live for real users.",
    ],
  },
};

// Shared shell for the three legal routes (spec 4.17). Content here is
// explicitly placeholder copy — real legal text needs to come from the
// business/counsel, not be fabricated, so the draft banner stays until
// that's swapped in.
export function LegalPage({ type }: { type: "privacy" | "terms" | "refund" }) {
  const { title, body } = CONTENT[type];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
          DRAFT — pending legal review, not final copy.
        </div>
        <h1 className="font-display text-3xl font-bold lowercase text-ink">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/70">
          {body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
