"use client";

import { useState } from "react";
import { resumeAppointmentPayment } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useAppointmentTracking } from "@/lib/query/hooks";
import { AppointmentIntakeForm } from "@/components/AppointmentIntakeForm";
import { formatDateTime, formatInr } from "@/lib/utils";
import type { AppointmentWithExpert } from "@/types/domain";

// Combines status + payment_status into one line rather than showing both
// raw enum values side by side — "pending"/"pending" (booking status vs.
// payment status) read as duplicates of each other even though they mean
// different things, and neither alone tells you whether *you* need to do
// something next.
function statusInfo(appointment: AppointmentWithExpert): { text: string; className: string; needsAction: boolean } {
  if (appointment.payment_status === "failed") {
    return { text: "Payment failed — action needed", className: "text-red-600", needsAction: true };
  }
  if (appointment.payment_status === "pending") {
    return { text: "Payment pending — action needed", className: "text-amber-600", needsAction: true };
  }
  if (appointment.status === "cancelled") return { text: "Cancelled", className: "text-ink/60", needsAction: false };
  if (appointment.status === "completed") return { text: "Completed", className: "text-ink/60", needsAction: false };
  if (appointment.status === "confirmed") return { text: "Confirmed", className: "text-emerald-700", needsAction: false };
  return { text: "Awaiting expert confirmation", className: "text-amber-600", needsAction: false };
}

// Shared "open a booking and see/finish where it's at" view — used both
// right after booking (BookAppointmentContent.tsx) and from the
// appointments list on /account, so there's one place that knows how to
// show status, resume a stalled payment, and pick up the intake form.
export function AppointmentConfirmation({
  appointmentId,
  onBack,
  backLabel = "Back",
}: {
  appointmentId: string;
  onBack: () => void;
  backLabel?: string;
}) {
  const { data: appointment, isLoading } = useAppointmentTracking(appointmentId);
  const [isResuming, setIsResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  if (isLoading) return <p className="text-sm text-ink/60">Loading…</p>;
  if (!appointment) return <p className="text-sm text-ink/60">Appointment not found.</p>;

  const status = statusInfo(appointment);

  async function handleResumePayment() {
    setIsResuming(true);
    setResumeError(null);
    try {
      const sb = createClient();
      const result = await resumeAppointmentPayment(sb, appointmentId);
      await openRazorpayCheckout({
        keyId: result.key_id,
        amount: result.amount,
        currency: result.currency,
        razorpayOrderId: result.razorpay_order_id,
        name: "Mindcafe Counselling",
        onSuccess: () => {
          /* Realtime subscription in useAppointmentTracking picks up the
             confirmed payment_status on its own — nothing to do here. */
        },
        onDismiss: () => setIsResuming(false),
      });
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Couldn't resume payment");
      setIsResuming(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">Counselling booking</p>
        <h2 className={`font-display text-2xl font-bold ${status.className}`}>{status.text}</h2>
      </div>

      {appointment.status === "pending" && appointment.payment_status === "paid" && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
          We&apos;ll confirm your session shortly. This updates automatically, no need to refresh.
        </p>
      )}

      <div className="rounded-xl border border-ink/15 bg-white p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-ink/60">Category</span>
          <span className="font-medium capitalize text-ink">{appointment.therapy_category.replace("-", " & ")}</span>
        </div>
        {appointment.experts && (
          <div className="mt-2 flex justify-between">
            <span className="text-ink/60">Expert</span>
            <span className="font-medium text-ink">{appointment.experts.name}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between gap-3">
          <span className="shrink-0 text-ink/60">Time</span>
          <span className="text-right text-ink">
            {appointment.scheduled_at ? formatDateTime(appointment.scheduled_at) : "To be confirmed"}
          </span>
        </div>
        {appointment.total !== null && (
          <div className="mt-2 flex justify-between">
            <span className="text-ink/60">Payment</span>
            <span className="font-medium text-ink">
              {formatInr(appointment.total)} · <span className="capitalize">{appointment.payment_status}</span>
            </span>
          </div>
        )}
        {appointment.coupon_code && (
          <div className="mt-2 flex justify-between text-emerald-700">
            <span>Coupon</span>
            <span>{appointment.coupon_code}</span>
          </div>
        )}
        {appointment.notes && (
          <div className="mt-2 border-t border-ink/10 pt-2">
            <span className="block text-ink/60">Notes</span>
            <span className="text-ink">{appointment.notes}</span>
          </div>
        )}
      </div>

      {status.needsAction && (
        <div className="space-y-2">
          <button type="button" onClick={handleResumePayment} disabled={isResuming} className="pill-btn w-full">
            {isResuming ? "Opening payment…" : "Resume Payment"}
          </button>
          {resumeError && <p className="text-sm text-red-600">{resumeError}</p>}
        </div>
      )}

      {appointment.payment_status === "paid" &&
        (appointment.intake_completed_at ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Thanks, we&apos;ve shared your answers with your counsellor ahead of the session.
          </p>
        ) : (
          <AppointmentIntakeForm appointmentId={appointment.id} />
        ))}

      <button type="button" onClick={onBack} className="pill-btn-outline w-full">
        {backLabel}
      </button>
    </div>
  );
}
