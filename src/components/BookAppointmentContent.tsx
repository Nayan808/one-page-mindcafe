"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveExperts, getTherapyCategories } from "@/lib/api";
import { useCreateAppointment, useAppointmentTracking } from "@/lib/query/hooks";
import { ExpertCard } from "@/components/ExpertCard";

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

function BookingConfirmation({ appointmentId }: { appointmentId: string }) {
  const { data: appointment, isLoading } = useAppointmentTracking(appointmentId);

  if (isLoading) return <p className="text-sm text-ink/60">Loading…</p>;
  if (!appointment) return <p className="text-sm text-ink/60">Appointment not found.</p>;

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">booking requested</p>
      <h1 className="font-display text-3xl font-bold lowercase text-ink">you&apos;re on the list</h1>
      <p className="text-sm text-ink/60">
        We&apos;ll confirm your session shortly — this updates automatically, no need to refresh.
      </p>

      <div className="rounded-xl border border-ink/15 bg-white p-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-ink/60">Category</span>
          <span className="font-medium text-ink capitalize">{appointment.therapy_category.replace("-", " & ")}</span>
        </div>
        {appointment.experts && (
          <div className="mt-2 flex justify-between">
            <span className="text-ink/60">Expert</span>
            <span className="font-medium text-ink">{appointment.experts.name}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between">
          <span className="text-ink/60">Status</span>
          <span className="font-medium text-ink">{APPOINTMENT_STATUS_LABELS[appointment.status] ?? appointment.status}</span>
        </div>
      </div>
    </div>
  );
}

function BookingForm({ initialCategory, initialExpertId }: { initialCategory: string | null; initialExpertId: string | null }) {
  const { user } = useAuth();
  const router = useRouter();
  const createAppointment = useCreateAppointment();

  const [category, setCategory] = useState<string | null>(initialCategory);
  const [expertId, setExpertId] = useState<string | null>(initialExpertId);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["therapy-categories"],
    queryFn: () => getTherapyCategories(createClient()),
  });

  const expertsQuery = useQuery({
    queryKey: ["experts", category ?? "all"],
    queryFn: () => getActiveExperts(createClient(), category ?? undefined),
    enabled: Boolean(category),
  });

  async function handleSubmit() {
    if (!user || !category) return;
    setError(null);
    try {
      const appointment = await createAppointment.mutateAsync({
        userId: user.id,
        therapyCategory: category,
        expertId: expertId ?? undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });
      router.push(`/book-appointment?confirmed=${appointment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong booking your session.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">counselling</p>
        <h1 className="font-display mt-3 text-3xl font-bold lowercase text-ink sm:text-4xl">book a session</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">
          Tell us what you're looking for — we&apos;ll confirm the details with you directly.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">1. category</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(categoriesQuery.data ?? []).map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => {
                setCategory(c.slug);
                setExpertId(null);
              }}
              className={`rounded-xl border p-3 text-left text-sm font-medium ${category === c.slug ? "border-ink bg-ink text-cream" : "border-ink/15 bg-white text-ink hover:border-ink/40"}`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {category && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">2. expert (optional)</h2>
          {expertsQuery.isLoading ? (
            <p className="mt-3 text-sm text-ink/60">Loading experts…</p>
          ) : (expertsQuery.data ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">No experts tagged for this category yet — we&apos;ll match you with one.</p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {(expertsQuery.data ?? []).map((expert) => (
                <button
                  key={expert.id}
                  type="button"
                  onClick={() => setExpertId(expertId === expert.id ? null : expert.id)}
                  className={`rounded-2xl text-left transition ${expertId === expert.id ? "ring-2 ring-ink" : ""}`}
                >
                  <ExpertCard expert={expert} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {category && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">3. preferred time</h2>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="input mt-3"
          />
          <p className="mt-1.5 text-xs text-ink/50">A starting point — we&apos;ll confirm what actually works.</p>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Anything you'd like your counsellor to know beforehand (optional)"
            rows={3}
            className="input mt-4"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!category || createAppointment.isPending}
        className="pill-btn w-full"
      >
        {createAppointment.isPending ? "requesting…" : "request this session"}
      </button>
    </div>
  );
}

function BookAppointmentInner() {
  const { status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmedId = searchParams.get("confirmed");
  const initialCategory = searchParams.get("category");
  const initialExpertId = searchParams.get("expert");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?returnTo=%2Fbook-appointment");
  }, [status, router]);

  if (status !== "authenticated") {
    return <div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>;
  }

  if (confirmedId) return <BookingConfirmation appointmentId={confirmedId} />;

  return <BookingForm initialCategory={initialCategory} initialExpertId={initialExpertId} />;
}

export function BookAppointmentContent() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>}>
      <BookAppointmentInner />
    </Suspense>
  );
}
