"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFaqs } from "@/lib/api";
import { AccordionFaq } from "@/components/AccordionFaq";

const CATEGORY_HEADINGS: Record<string, string> = {
  feelz: "feelz",
  counselling: "counselling",
};

export default function FaqPage() {
  const faqsQuery = useQuery({
    queryKey: ["faqs", "all"],
    queryFn: () => getFaqs(createClient()),
  });
  const faqs = faqsQuery.data ?? [];

  const grouped = faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
    (acc[faq.category] ??= []).push(faq);
    return acc;
  }, {});

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-16 text-center sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">help</p>
        <h1 className="font-display mt-3 text-3xl font-bold lowercase text-ink sm:text-4xl">frequently asked questions</h1>
      </div>

      {faqsQuery.isLoading ? (
        <p className="mt-10 text-center text-sm text-ink/60">Loading…</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink/60">No FAQs listed yet — check back soon.</p>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <AccordionFaq
            key={category}
            heading={CATEGORY_HEADINGS[category] ?? category}
            items={items.map((faq) => ({ question: faq.question, answer: faq.answer }))}
          />
        ))
      )}
    </div>
  );
}
