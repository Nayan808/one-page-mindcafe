"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { submitAppointmentIntake, type IntakeFormInput } from "@/lib/api";
import { queryKeys } from "@/lib/query/hooks";

const SCALE_OPTIONS = ["very low", "low", "moderate", "high", "very high"];

// Shown once, right after payment succeeds — same intent as the legacy
// site's pre-session intake questionnaire, rebuilt with a fixed field set
// instead of a dynamic question bank. Locked to the appointment's own
// customer at the DB layer (see the 20260723040000 migration's
// prevent_customer_appointment_tampering trigger) — this form can only
// ever write intake_* columns, nothing else on the booking.
export function AppointmentIntakeForm({ appointmentId }: { appointmentId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<IntakeFormInput>({
    age: "",
    pronouns: "",
    occupation: "",
    description: "",
    energyLevel: "moderate",
    comfortLevel: "moderate",
    selfPerception: "moderate",
  });

  const submit = useMutation({
    mutationFn: () => submitAppointmentIntake(createClient(), appointmentId, form),
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
          <input
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            placeholder="e.g. 24"
            className="input"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/70">pronouns</label>
          <input
            value={form.pronouns}
            onChange={(e) => setForm((f) => ({ ...f, pronouns: e.target.value }))}
            placeholder="e.g. she/her"
            className="input"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-ink/70">occupation</label>
        <input
          value={form.occupation}
          onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
          placeholder="e.g. student, software engineer"
          className="input"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-ink/70">what brought you here?</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="Share as much or as little as you'd like — your counsellor will read this before your session."
          className="input"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/70">energy levels</label>
          <select
            value={form.energyLevel}
            onChange={(e) => setForm((f) => ({ ...f, energyLevel: e.target.value }))}
            className="input"
          >
            {SCALE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/70">comfort level</label>
          <select
            value={form.comfortLevel}
            onChange={(e) => setForm((f) => ({ ...f, comfortLevel: e.target.value }))}
            className="input"
          >
            {SCALE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/70">self-perception</label>
          <select
            value={form.selfPerception}
            onChange={(e) => setForm((f) => ({ ...f, selfPerception: e.target.value }))}
            className="input"
          >
            {SCALE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {submit.isError && <p className="mt-3 text-sm text-red-600">Something went wrong saving this — try again.</p>}

      <button type="submit" disabled={submit.isPending} className="pill-btn mt-4 w-full">
        {submit.isPending ? "saving…" : "save and continue"}
      </button>
    </form>
  );
}
