"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitAppointmentIntake, type IntakeFormInput } from "@/lib/api";
import { queryKeys } from "@/lib/query/hooks";
import { INTAKE_CONCERNS } from "@/lib/intakeQuestions";

// Shown once, right after payment succeeds — same intent as the legacy
// site's pre-session intake questionnaire, rebuilt on the same per-concern
// question bank (see intakeQuestions.ts) instead of 3 fixed generic scale
// questions. Locked to the appointment's own customer at the DB layer (see
// the 20260723040000 migration's prevent_customer_appointment_tampering
// trigger) — this form can only ever write intake_* columns, nothing else
// on the booking.
export function AppointmentIntakeForm({ appointmentId }: { appointmentId: string }) {
  const queryClient = useQueryClient();
  const [age, setAge] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [occupation, setOccupation] = useState("");
  const [description, setDescription] = useState("");
  const [concernSlug, setConcernSlug] = useState<string | null>(null);
  const [concernSearch, setConcernSearch] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const concern = INTAKE_CONCERNS.find((c) => c.slug === concernSlug) ?? null;

  const term = concernSearch.trim().toLowerCase();
  const filteredConcerns = term ? INTAKE_CONCERNS.filter((c) => c.label.toLowerCase().includes(term)) : INTAKE_CONCERNS;

  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);

  const submit = useMutation({
    mutationFn: () => {
      const input: IntakeFormInput = {
        age,
        pronouns,
        occupation,
        description,
        concern: concern?.label ?? "",
        answers: (concern?.questions ?? [])
          .map((q) => ({ question: q.question, answer: answers[q.question] ?? "" }))
          .filter((a) => a.answer),
      };
      return submitAppointmentIntake(createClient(), appointmentId, input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.appointment(appointmentId) }),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit.mutate();
      }}
      className="mt-6 rounded-xl border border-ink/15 bg-white p-5 text-left"
    >
      <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">before your session</p>
      <h2 className="font-display mt-1 text-lg font-bold lowercase text-ink">tell your counsellor a bit about you</h2>
      <p className="mt-1 text-xs text-ink/50">
        This helps your expert prepare — they&apos;ll see your answers on their dashboard before the session.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/70">age</label>
          <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 24" className="input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/70">pronouns</label>
          <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="e.g. she/her" className="input" />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-ink/70">occupation</label>
        <input
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          placeholder="e.g. student, software engineer"
          className="input"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-ink/70">what brought you here?</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Share as much or as little as you'd like — your counsellor will read this before your session."
          className="input"
        />
      </div>

      <div className="mt-5 border-t border-ink/10 pt-4">
        <label className="mb-1 block text-xs font-medium text-ink/70">what would you like support with?</label>
        {!concern ? (
          <>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
              <input
                type="text"
                value={concernSearch}
                onChange={(e) => setConcernSearch(e.target.value)}
                placeholder="search concerns…"
                className="input pl-9 text-sm"
              />
            </div>
            <div className="mt-2 flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
              {filteredConcerns.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setConcernSlug(c.slug)}
                  className="rounded-full border border-ink/15 bg-cream px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/40"
                >
                  {c.label}
                </button>
              ))}
              {filteredConcerns.length === 0 && <p className="py-2 text-xs text-ink/50">No matches — try a different search.</p>}
            </div>
          </>
        ) : (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-ink bg-ink px-3 py-2 text-cream">
            <span className="text-sm font-medium">{concern.label}</span>
            <button
              type="button"
              onClick={() => {
                setConcernSlug(null);
                setAnswers({});
              }}
              className="text-xs underline"
            >
              change
            </button>
          </div>
        )}
      </div>

      {concern && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-ink/50">
            {answeredCount} of {concern.questions.length} answered — answer as many as you&apos;d like.
          </p>
          {concern.questions.map((q) => (
            <div key={q.question}>
              <p className="mb-1.5 text-sm font-medium text-ink">{q.question}</p>
              <div className="flex flex-wrap gap-1.5">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.question]: opt }))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      answers[q.question] === opt ? "border-ink bg-ink text-cream" : "border-ink/15 bg-cream text-ink hover:border-ink/40"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {submit.isError && <p className="mt-3 text-sm text-red-600">Something went wrong saving this — try again.</p>}

      <button type="submit" disabled={submit.isPending} className="pill-btn mt-5 w-full">
        {submit.isPending ? "saving…" : "save and continue"}
      </button>
    </form>
  );
}
