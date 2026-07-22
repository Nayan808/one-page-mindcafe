"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { getExpertAppointments, getExpertByProfileId, updateAppointmentStatus } from "@/lib/api";
import type { Appointment } from "@/types/domain";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const NEXT_ACTIONS: Record<string, { label: string; nextStatus: Appointment["status"] }[]> = {
  pending: [
    { label: "confirm", nextStatus: "confirmed" },
    { label: "decline", nextStatus: "cancelled" },
  ],
  confirmed: [
    { label: "mark completed", nextStatus: "completed" },
    { label: "cancel", nextStatus: "cancelled" },
  ],
};

export default function ExpertDashboardPage() {
  const { status, user, profile } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/expert/login");
    else if (status === "authenticated" && profile && profile.role !== "expert") router.replace("/expert/login");
  }, [status, profile, router]);

  const expertQuery = useQuery({
    queryKey: ["expert-self", user?.id],
    queryFn: () => getExpertByProfileId(createClient(), user!.id),
    enabled: Boolean(user) && profile?.role === "expert",
  });

  const appointmentsQuery = useQuery({
    queryKey: ["expert-appointments", expertQuery.data?.id],
    queryFn: () => getExpertAppointments(createClient(), expertQuery.data!.id),
    enabled: Boolean(expertQuery.data),
  });

  const updateStatus = useMutation({
    mutationFn: (args: { appointmentId: string; status: Appointment["status"] }) =>
      updateAppointmentStatus(createClient(), args.appointmentId, args.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expert-appointments", expertQuery.data?.id] }),
  });

  if (status !== "authenticated" || profile?.role !== "expert") {
    return (
      <div className="min-h-[calc(100svh-4.5rem)] bg-white px-4 py-16 text-center text-sm text-ink/60">Loading…</div>
    );
  }

  if (expertQuery.isLoading) {
    return (
      <div className="min-h-[calc(100svh-4.5rem)] bg-white px-4 py-16 text-center text-sm text-ink/60">Loading…</div>
    );
  }

  if (!expertQuery.data) {
    return (
      <div className="mx-auto min-h-[calc(100svh-4.5rem)] max-w-md bg-white px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold lowercase text-ink">no expert profile linked</h1>
        <p className="mt-2 text-sm text-ink/60">
          Your account has expert access, but isn&apos;t linked to a directory entry yet — reach out to get that set up.
        </p>
      </div>
    );
  }

  const appointments = appointmentsQuery.data ?? [];
  // A 'pending' row can still be unpaid (booking submitted, checkout
  // abandoned/never opened) — the DB now refuses to let it be confirmed
  // until payment_status is 'paid', so it's split out here rather than
  // shown with confirm/decline buttons that would just fail.
  const awaitingPayment = appointments.filter((a) => a.status === "pending" && a.payment_status !== "paid");
  const pending = appointments.filter((a) => a.status === "pending" && a.payment_status === "paid");
  const upcoming = appointments.filter((a) => a.status === "confirmed");
  const past = appointments.filter((a) => a.status === "completed" || a.status === "cancelled");

  function renderAppointment(appointment: Appointment) {
    const actions = appointment.payment_status === "paid" ? NEXT_ACTIONS[appointment.status] ?? [] : [];
    return (
      <li key={appointment.id} className="rounded-xl border border-ink/15 bg-white p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium capitalize text-ink">{appointment.therapy_category.replace("-", " & ")}</span>
          <span className="text-xs font-medium text-ink/60">
            {appointment.payment_status === "paid" ? STATUS_LABELS[appointment.status] : "Awaiting payment"}
          </span>
        </div>
        <p className="mt-1 text-ink/60">
          {appointment.scheduled_at ? new Date(appointment.scheduled_at).toLocaleString() : "Time to be confirmed"}
        </p>
        {appointment.notes && <p className="mt-1 text-ink/50">&ldquo;{appointment.notes}&rdquo;</p>}
        {actions.length > 0 && (
          <div className="mt-3 flex gap-2">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => updateStatus.mutate({ appointmentId: appointment.id, status: action.nextStatus })}
                disabled={updateStatus.isPending}
                className="pill-btn-outline !py-1.5 text-xs"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="min-h-[calc(100svh-4.5rem)] bg-white">
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">expert dashboard</p>
          <h1 className="font-display mt-2 text-3xl font-bold lowercase text-ink">hi, {expertQuery.data.name.split(" ")[0]}</h1>
        </div>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">needs your response ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">Nothing pending.</p>
          ) : (
            <ul className="mt-3 space-y-2">{pending.map(renderAppointment)}</ul>
          )}
        </section>

        {awaitingPayment.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">awaiting payment ({awaitingPayment.length})</h2>
            <p className="mt-1 text-xs text-ink/50">Requested, not yet paid for — nothing to do until the customer completes payment.</p>
            <ul className="mt-3 space-y-2">{awaitingPayment.map(renderAppointment)}</ul>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">upcoming ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">Nothing confirmed yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">{upcoming.map(renderAppointment)}</ul>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">history</h2>
            <ul className="mt-3 space-y-2">{past.map(renderAppointment)}</ul>
          </section>
        )}
      </div>
    </div>
  );
}
