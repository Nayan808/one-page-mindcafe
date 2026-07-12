"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getOrCreateGuestSessionId } from "@/lib/guestSession";
import { submitAssessment, getTherapyCategory } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/therapyCategories";

type Answers = Record<string, string>;

// A lightweight category-router, NOT a clinical instrument. mindcafe.app's
// real self-assessment feature links out to licensed Psychology Today
// tests (social anxiety, depression, etc.) — reproducing those would mean
// either infringing licensed content or presenting fabricated questions as
// if they were a validated clinical tool, which is a real safety concern
// for a mental-health product. This quiz only does what spec 4.10 actually
// asks: recommend which counselling category fits, nothing diagnostic.
const QUESTIONS: {
  key: string;
  question: string;
  options: { label: string; value: string }[];
}[] = [
  {
    key: "who_for",
    question: "Who is this mainly for?",
    options: [
      { label: "Me", value: "me" },
      { label: "My child or a teenager I care for", value: "child" },
    ],
  },
  {
    key: "main_concern",
    question: "What's mainly on your mind?",
    options: [
      { label: "Stress, anxiety, or feeling overwhelmed", value: "individual" },
      { label: "A relationship, family, or partner issue", value: "family-relationship" },
      { label: "Something about my identity, or women's-health specific", value: "specialized" },
      { label: "Not sure yet — I just want someone to talk to", value: "individual" },
    ],
  },
  {
    key: "impact",
    question: "How much is this affecting your day-to-day?",
    options: [
      { label: "Barely noticeable", value: "low" },
      { label: "Somewhat", value: "medium" },
      { label: "Quite a lot", value: "high" },
    ],
  },
];

function recommendCategory(answers: Answers): string {
  if (answers.who_for === "child") return "child-adolescent";
  return answers.main_concern ?? "individual";
}

export function AssessmentQuiz() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resultCategoryQuery = useQuery({
    queryKey: ["therapy-category", result],
    queryFn: () => getTherapyCategory(createClient(), result!),
    enabled: Boolean(result),
  });

  async function handleAnswer(value: string) {
    const question = QUESTIONS[step];
    const nextAnswers = { ...answers, [question.key]: value };
    setAnswers(nextAnswers);

    // Skip the remaining questions entirely once the category is already
    // determined (a parent booking for their child doesn't need "what's on
    // your mind" asked about themselves).
    if (question.key === "who_for" && value === "child") {
      await finish(nextAnswers);
      return;
    }

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      await finish(nextAnswers);
    }
  }

  async function finish(finalAnswers: Answers) {
    const category = recommendCategory(finalAnswers);
    setIsSubmitting(true);
    try {
      const sb = createClient();
      await submitAssessment(sb, {
        userId: user?.id,
        guestSessionId: user ? undefined : getOrCreateGuestSessionId(),
        answers: finalAnswers,
        recommendedCategory: category,
      });
    } catch {
      // Non-blocking — the recommendation still shows even if the write
      // (e.g. RLS misconfig, network blip) failed; nothing downstream
      // depends on the row existing.
    } finally {
      setIsSubmitting(false);
      setResult(category);
    }
  }

  if (result) {
    const category = resultCategoryQuery.data;
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">your result</p>
        <h1 className="font-display mt-3 text-3xl font-bold lowercase text-ink">
          {category?.title ?? CATEGORY_LABELS[result] ?? result}
        </h1>
        {category?.body && <p className="mt-4 text-sm leading-relaxed text-ink/70">{category.body}</p>}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={`/book-appointment?category=${result}`} className="pill-btn">
            book a session
          </Link>
          <Link href={`/experts?category=${result}`} className="pill-btn-outline">
            browse experts
          </Link>
        </div>
      </div>
    );
  }

  const question = QUESTIONS[step];

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="mx-auto flex w-fit items-center gap-2">
        {QUESTIONS.map((q, index) => (
          <span
            key={q.key}
            className={`h-1.5 w-6 rounded-full ${index <= step ? "bg-ink" : "bg-ink/15"}`}
            aria-hidden
          />
        ))}
      </div>

      <h1 className="font-display mt-6 text-center text-2xl font-bold lowercase text-ink sm:text-3xl">
        {question.question}
      </h1>

      <div className="mt-8 space-y-2">
        {question.options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleAnswer(option.value)}
            disabled={isSubmitting}
            className="block w-full rounded-xl border border-ink/15 bg-white p-4 text-left text-sm font-medium text-ink transition hover:border-ink disabled:opacity-50"
          >
            {option.label}
          </button>
        ))}
      </div>

      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="mt-6 text-xs font-medium uppercase tracking-label text-ink/50 hover:text-ink"
        >
          ← back
        </button>
      )}
    </div>
  );
}
