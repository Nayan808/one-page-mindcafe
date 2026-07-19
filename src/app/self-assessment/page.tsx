"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, ClipboardList, ExternalLink, Flame, HeartCrack, HeartHandshake, MessageCircle, Star, Users } from "lucide-react";

// Sourced verbatim from mindcafe.app/self-assessment-test (the same
// company's live page) — these link out to Psychology Today's own
// licensed tests rather than reproducing the questions ourselves. See
// AssessmentQuiz.tsx for why: reproducing licensed clinical instruments
// as if they were our own would be a real safety/IP problem. Linking to
// them, exactly like the live site does, has neither issue — every URL
// below was verified to resolve (200) before being wired in.
const CATEGORIES = [
  { key: "all", label: "All Tests" },
  { key: "mental-health", label: "Mental Health" },
  { key: "personality", label: "Personality" },
  { key: "cognitive", label: "Cognitive" },
] as const;

const TESTS = [
  {
    Icon: Users,
    category: "mental-health",
    categoryLabel: "Mental Health",
    title: "Social Anxiety Test",
    description: "Social anxiety disorder causes intense self-consciousness in social situations. Treatment starts with recognising your anxiety and may require further examination. This test can help.",
    questions: 20,
    minutes: 3,
    href: "https://www.psychologytoday.com/us/tests/health/social-anxiety-test",
  },
  {
    Icon: Star,
    category: "personality",
    categoryLabel: "Personality",
    title: "Perfectionism Test",
    description: "Striving for excellence is commendable. Adaptive perfectionists set high goals and grow personally, while others chase perfection leading to feelings of worthlessness. Are you driven or laid-back?",
    questions: 20,
    minutes: 3,
    href: "https://www.psychologytoday.com/us/tests/personality/perfectionism-test",
  },
  {
    Icon: Brain,
    category: "cognitive",
    categoryLabel: "Cognitive",
    title: "Memory Test",
    description: "Test your memory: are you a name and number wizard or someone who forgets things quickly? Discover if you have the memory of an elephant with this test.",
    questions: 7,
    minutes: 5,
    href: "https://www.psychologytoday.com/us/tests/iq/memory-test",
  },
  {
    Icon: HeartCrack,
    category: "mental-health",
    categoryLabel: "Mental Health",
    title: "Depression Test",
    description: "Clinical depression entails persistent feelings of hopelessness, exhaustion, and thoughts of death. Treatment begins with recognising symptoms. This test could offer important insight.",
    questions: 20,
    minutes: 3,
    href: "https://www.psychologytoday.com/us/tests/health/depression-test",
  },
  {
    Icon: Flame,
    category: "mental-health",
    categoryLabel: "Mental Health",
    title: "Anger Management Test",
    description: "Manage anger effectively for healthier relationships and work life. Take this test to gauge your anger control skills and understand your emotional triggers.",
    questions: 20,
    minutes: 3,
    href: "https://www.psychologytoday.com/us/tests/personality/anger-management-test",
  },
  {
    Icon: HeartHandshake,
    category: "personality",
    categoryLabel: "Personality",
    title: "Emotional Intelligence Test",
    description: "High emotional intelligence involves effective coping, regulating emotions, and understanding others. Test your ability to understand, express, and manage emotions effectively.",
    questions: 20,
    minutes: 3,
    href: "https://www.psychologytoday.com/us/tests/personality/emotional-intelligence-test",
  },
  {
    Icon: MessageCircle,
    category: "personality",
    categoryLabel: "Personality",
    title: "Introversion / Extroversion Test",
    description: "Discover where you fall on the introversion-extroversion spectrum — a key aspect of the Big Five personality traits that shapes how you engage with the world.",
    questions: 20,
    minutes: 3,
    href: "https://www.psychologytoday.com/us/tests/personality/extroversion-introversion-test",
  },
  {
    Icon: ClipboardList,
    category: "mental-health",
    categoryLabel: "Mental Health",
    title: "Do I Need Therapy?",
    description: "Assess if you might benefit from therapy. Take this test to gauge your mental health and well-being, and understand whether professional support could help you.",
    questions: 20,
    minutes: 3,
    href: "https://www.psychologytoday.com/us/tests/health/do-i-need-therapy",
  },
];

export default function SelfAssessmentPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const visibleTests = activeCategory === "all" ? TESTS : TESTS.filter((t) => t.category === activeCategory);

  return (
    <div>
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-label text-cream/60">self-assessment tests</p>
          <h1 className="font-display mx-auto mt-4 max-w-xl text-3xl font-bold lowercase leading-[1.15] sm:text-4xl">
            know your mind better.
          </h1>
          <p className="mt-4 text-sm text-cream/70 sm:text-base">
            Take free, professionally verified self-assessment tests to better understand your mental health,
            emotional patterns, and cognitive strengths.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-4 text-center text-xs leading-relaxed text-amber-800">
            These assessments are developed by Psychology Today. Mindcafé&apos;s mental health professionals have
            verified the accuracy levels, but do not hold responsibility for errors or glitches in results. These
            assessments are <strong>for reference purposes only — not for diagnostic purposes.</strong> Please
            consult a qualified mental health professional for a formal diagnosis.
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={
                  activeCategory === cat.key
                    ? "rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream"
                    : "rounded-full border border-ink/20 px-4 py-2 text-xs font-medium text-ink/60 transition hover:border-ink/40 hover:text-ink"
                }
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-5">
            {visibleTests.map((test) => (
              <a
                key={test.title}
                href={test.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-ink/15 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-ink hover:shadow-lg sm:w-[calc(50%-0.625rem)] lg:w-[calc((100%-2.5rem)/3)]"
              >
                <test.Icon
                  className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rotate-[-12deg] text-ink/[0.05]"
                  strokeWidth={1.25}
                  aria-hidden
                />

                <div className="relative mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-cream">
                  <test.Icon className="h-5 w-5 text-ink" aria-hidden />
                </div>
                <p className="relative mt-3 text-[11px] font-semibold uppercase tracking-label text-ink/40">
                  {test.categoryLabel}
                </p>
                <h3 className="font-display relative mt-1 text-lg font-bold text-ink">{test.title}</h3>
                <p className="relative mt-2 flex-1 text-sm leading-relaxed text-ink/60">{test.description}</p>

                <div className="relative mt-4 flex items-center justify-center gap-3 text-xs text-ink/50">
                  <span className="flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-ink/30" aria-hidden />
                    {test.questions} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-ink/30" aria-hidden />
                    {test.minutes} minutes
                  </span>
                </div>

                <div className="relative mt-4 flex flex-col items-center gap-1.5 border-t border-ink/10 pt-4">
                  <span className="text-sm font-semibold text-ink">take the test →</span>
                  <span className="flex items-center gap-1 text-[11px] text-ink/40">
                    <ExternalLink className="h-3 w-3" aria-hidden />
                    opens on psychologytoday.com
                  </span>
                </div>
              </a>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-ink/50">
            All tests provided by{" "}
            <a
              href="https://www.psychologytoday.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink underline"
            >
              Psychology Today
            </a>
            . Prefer a quick, non-clinical starting point instead?{" "}
            <Link href="/assessment" className="font-semibold text-ink underline">
              Take our category quiz →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
