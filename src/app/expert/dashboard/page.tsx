"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { getExpertAppointments, getExpertByProfileId, updateAppointmentStatus } from "@/lib/api";
import type { Appointment, AppointmentWithCustomer } from "@/types/domain";
import { formatInr } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "payment pending",
  paid: "paid",
  failed: "payment failed",
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
  // Confirming needs a meet link entered first (the DB rejects 'confirmed'
  // without one) — this tracks which appointment's card currently has that
  // inline entry form open, and the draft link being typed for it.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [meetLinkDraft, setMeetLinkDraft] = useState("");

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

  // Live: a new booking, a payment landing, or the customer submitting
  // their intake form all show up here without a manual refresh — same
  // Realtime pattern already used for order/appointment tracking on the
  // customer side (see useOrderTracking/useAppointmentTracking).
  const expertId = expertQuery.data?.id;
  useEffect(() => {
    if (!expertId) return;
    const sb = createClient();
    const channel = sb
      .channel(`expert-appointments-${expertId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `expert_id=eq.${expertId}` },
        () => queryClient.invalidateQueries({ queryKey: ["expert-appointments", expertId] }),
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [expertId, queryClient]);

  const updateStatus = useMutation({
    mutationFn: (args: { appointmentId: string; status: Appointment["status"]; meetLink?: string }) =>
      updateAppointmentStatus(createClient(), args.appointmentId, args.status, args.meetLink),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-appointments", expertQuery.data?.id] });
      setConfirmingId(null);
      setMeetLinkDraft("");
    },
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
  const completed = appointments.filter((a) => a.status === "completed");
  const past = appointments.filter((a) => a.status === "completed" || a.status === "cancelled");
  // "Bookings" = ones a client actually followed through on paying for —
  // an abandoned/never-paid checkout was never really a booking from the
  // expert's side, so it's excluded from this count on purpose.
  const totalBookings = appointments.filter((a) => a.payment_status === "paid").length;

  function renderAppointment(appointment: AppointmentWithCustomer) {
    const actions = appointment.payment_status === "paid" ? NEXT_ACTIONS[appointment.status] ?? [] : [];
    const isConfirming = confirmingId === appointment.id;

    function handleAction(action: { label: string; nextStatus: Appointment["status"] }) {
      if (action.nextStatus === "confirmed") {
        setConfirmingId(appointment.id);
        setMeetLinkDraft("");
        return;
      }
      updateStatus.mutate({ appointmentId: appointment.id, status: action.nextStatus });
    }

    return (
      <li key={appointment.id} className="rounded-xl border border-ink/15 bg-white p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium capitalize text-ink">{appointment.therapy_category.replace("-", " & ")}</span>
          <span className="text-xs font-medium text-ink/60">
            {appointment.payment_status === "paid" ? STATUS_LABELS[appointment.status] : "Awaiting payment"}
          </span>
        </div>

        <div className="mt-2 rounded-lg bg-cream/60 p-2.5">
          <p className="font-medium text-ink">{appointment.profiles?.full_name ?? "Client"}</p>
          {appointment.profiles?.phone && (
            <a href={`tel:${appointment.profiles.phone}`} className="text-xs text-ink/60 hover:text-ink hover:underline">
              {appointment.profiles.phone}
            </a>
          )}
        </div>

        <p className="mt-2 text-ink/60">
          {appointment.scheduled_at ? new Date(appointment.scheduled_at).toLocaleString() : "Time to be confirmed"}
        </p>
        {appointment.notes && <p className="mt-1 text-ink/50">&ldquo;{appointment.notes}&rdquo;</p>}
        {appointment.total !== null && (
          <p className="mt-1 text-xs text-ink/50">
            {formatInr(appointment.total)}
            {appointment.coupon_code ? ` · coupon ${appointment.coupon_code}` : ""}
            {" · "}
            {PAYMENT_STATUS_LABELS[appointment.payment_status] ?? appointment.payment_status}
          </p>
        )}
        {appointment.status === "confirmed" && appointment.meet_link && (
          <a
            href={appointment.meet_link}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block truncate text-ink underline"
          >
            {appointment.meet_link}
          </a>
        )}

        {appointment.intake_completed_at && (
          <div className="mt-2 rounded-lg border border-ink/10 bg-cream/40 p-2.5 text-xs">
            <p className="font-semibold uppercase tracking-label text-ink/50">client intake</p>
            <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-ink/70">
              {appointment.intake_age && (
                <>
                  <dt className="text-ink/40">age</dt>
                  <dd>{appointment.intake_age}</dd>
                </>
              )}
              {appointment.intake_pronouns && (
                <>
                  <dt className="text-ink/40">pronouns</dt>
                  <dd>{appointment.intake_pronouns}</dd>
                </>
              )}
              {appointment.intake_occupation && (
                <>
                  <dt className="text-ink/40">occupation</dt>
                  <dd>{appointment.intake_occupation}</dd>
                </>
              )}
              {appointment.intake_concern && (
                <>
                  <dt className="text-ink/40">concern</dt>
                  <dd>{appointment.intake_concern}</dd>
                </>
              )}
            </dl>
            {appointment.intake_description && (
              <p className="mt-1.5 text-ink/70">
                <span className="text-ink/40">what brought them here: </span>
                {appointment.intake_description}
              </p>
            )}
            {Array.isArray(appointment.intake_answers) && appointment.intake_answers.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-ink/10 pt-2">
                {(appointment.intake_answers as unknown as { question: string; answer: string }[]).map((qa, i) => (
                  <p key={i} className="text-ink/70">
                    <span className="text-ink/40">{qa.question} </span>
                    <span className="font-medium">{qa.answer}</span>
                  </p>
                ))}
              </div>
            )}
            {/* Legacy submissions before this rebuild only ever wrote these
                3 fixed scale fields — no intake_answers, so they still show
                here rather than looking blank. */}
            {!appointment.intake_concern && (appointment.intake_energy_level || appointment.intake_comfort_level || appointment.intake_self_perception) && (
              <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-ink/70">
                {appointment.intake_energy_level && (
                  <>
                    <dt className="text-ink/40">energy</dt>
                    <dd className="capitalize">{appointment.intake_energy_level}</dd>
                  </>
                )}
                {appointment.intake_comfort_level && (
                  <>
                    <dt className="text-ink/40">comfort</dt>
                    <dd className="capitalize">{appointment.intake_comfort_level}</dd>
                  </>
                )}
                {appointment.intake_self_perception && (
                  <>
                    <dt className="text-ink/40">self-perception</dt>
                    <dd className="capitalize">{appointment.intake_self_perception}</dd>
                  </>
                )}
              </dl>
            )}
          </div>
        )}

        {isConfirming ? (
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = meetLinkDraft.trim();
              if (!trimmed) return;
              // Experts often paste just the bare link (e.g.
              // "meet.google.com/abc-defg-hij") without the scheme — add
              // https:// if it's missing rather than rejecting it, since
              // there's no reason to make them type that part.
              const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
              updateStatus.mutate({ appointmentId: appointment.id, status: "confirmed", meetLink: normalized });
            }}
          >
            <input
              type="text"
              required
              autoFocus
              placeholder="paste the meeting link (Zoom, Meet, ...)"
              value={meetLinkDraft}
              onChange={(event) => setMeetLinkDraft(event.target.value)}
              className="input !py-1.5 text-xs"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={updateStatus.isPending} className="pill-btn !py-1.5 text-xs">
                confirm booking
              </button>
              <button
                type="button"
                onClick={() => setConfirmingId(null)}
                className="pill-btn-outline !py-1.5 text-xs"
              >
                back
              </button>
            </div>
          </form>
        ) : (
          actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleAction(action)}
                  disabled={updateStatus.isPending}
                  className="pill-btn-outline !py-1.5 text-xs"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-ink/15 bg-cream p-4 text-center">
            <p className="font-display text-2xl font-bold text-ink">{totalBookings}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-label text-ink/50">total bookings</p>
          </div>
          <div className="rounded-xl border border-ink/15 bg-cream p-4 text-center">
            <p className="font-display text-2xl font-bold text-ink">{completed.length}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-label text-ink/50">completed</p>
          </div>
          <div className="rounded-xl border border-ink/15 bg-cream p-4 text-center">
            <p className="font-display text-2xl font-bold text-ink">{upcoming.length}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-label text-ink/50">upcoming</p>
          </div>
          <div className="rounded-xl border border-ink/15 bg-cream p-4 text-center">
            <p className="font-display text-2xl font-bold text-ink">{pending.length}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-label text-ink/50">needs response</p>
          </div>
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
