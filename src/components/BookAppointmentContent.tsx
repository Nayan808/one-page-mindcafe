"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveExperts, getSiteSetting, getTherapyCategories, validateAppointmentCoupon, type CouponPreview } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useCreateAppointment, useAppointmentTracking } from "@/lib/query/hooks";
import { ExpertCard } from "@/components/ExpertCard";
import { formatInr } from "@/lib/utils";

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
};

const DEFAULT_SESSION_PRICE = 999;

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
        {appointment.total !== null && (
          <div className="mt-2 flex justify-between">
            <span className="text-ink/60">Payment</span>
            <span className="font-medium text-ink">
              {formatInr(appointment.total)} — {PAYMENT_STATUS_LABELS[appointment.payment_status] ?? appointment.payment_status}
            </span>
          </div>
        )}
        {appointment.coupon_code && (
          <div className="mt-2 flex justify-between text-emerald-700">
            <span>Coupon</span>
            <span>{appointment.coupon_code}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingForm({ initialCategory, initialExpertId }: { initialCategory: string | null; initialExpertId: string | null }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const createAppointment = useCreateAppointment();

  const [category, setCategory] = useState<string | null>(initialCategory);
  const [expertId, setExpertId] = useState<string | null>(initialExpertId);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  const priceQuery = useQuery({
    queryKey: ["site-settings", "counselling_session_price"],
    queryFn: () => getSiteSetting<number>(createClient(), "counselling_session_price"),
  });
  const sessionPrice = priceQuery.data ?? DEFAULT_SESSION_PRICE;

  const categoriesQuery = useQuery({
    queryKey: ["therapy-categories"],
    queryFn: () => getTherapyCategories(createClient()),
  });

  const expertsQuery = useQuery({
    queryKey: ["experts", category ?? "all"],
    queryFn: () => getActiveExperts(createClient(), category ?? undefined),
    enabled: Boolean(category),
  });

  // Only trust the applied preview while the input still matches what was
  // checked — editing the code after applying shouldn't silently keep
  // discounting at the old value.
  const discountAmount = appliedCoupon?.code === couponCode.trim().toUpperCase() ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, sessionPrice - discountAmount);

  async function handleApplyCoupon() {
    setIsCheckingCoupon(true);
    setCouponError(null);
    try {
      const sb = createClient();
      const result = await validateAppointmentCoupon(sb, couponCode, sessionPrice);
      setAppliedCoupon(result);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : "Couldn't apply coupon");
    } finally {
      setIsCheckingCoupon(false);
    }
  }

  async function handleSubmit() {
    if (!user || !category) return;
    setError(null);
    try {
      const result = await createAppointment.mutateAsync({
        therapyCategory: category,
        expertId: expertId ?? undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        notes: notes.trim() || undefined,
        couponCode: couponCode.trim() || undefined,
      });

      if (!result.requiresPayment) {
        router.push(`/book-appointment?confirmed=${result.appointmentId}`);
        return;
      }

      await openRazorpayCheckout({
        keyId: result.keyId,
        amount: result.amount,
        currency: result.currency,
        razorpayOrderId: result.razorpayOrderId,
        name: "MindCafe Counselling",
        prefill: {
          name: profile?.full_name ?? undefined,
          email: user.email ?? undefined,
          contact: profile?.phone ?? undefined,
        },
        onSuccess: () => router.push(`/book-appointment?confirmed=${result.appointmentId}`),
        onDismiss: () => setError("Payment was cancelled. Your booking is saved as pending payment."),
      });
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

      {category && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">4. payment</h2>
          <div className="mt-3">
            <label className="mb-1 block text-sm text-ink/70">Coupon code (optional)</label>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value);
                  setAppliedCoupon(null);
                  setCouponError(null);
                }}
                onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), handleApplyCoupon())}
                placeholder="Enter coupon code"
                className="input uppercase"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || isCheckingCoupon || discountAmount > 0}
                className="pill-btn-outline shrink-0 !py-2 text-xs normal-case tracking-normal"
              >
                {isCheckingCoupon ? "checking…" : discountAmount > 0 ? "applied" : "apply"}
              </button>
            </div>
            {couponError && <p className="mt-1.5 text-sm text-red-600">{couponError}</p>}
            {discountAmount > 0 && (
              <p className="mt-1.5 text-sm text-emerald-700">
                &ldquo;{appliedCoupon!.code}&rdquo; applied — {formatInr(discountAmount)} off
              </p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-ink/15 bg-white p-4 text-sm">
            <div className="flex justify-between">
              <span>Session fee</span>
              <span>{formatInr(sessionPrice)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon ({appliedCoupon!.code})</span>
                <span>−{formatInr(discountAmount)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 font-medium">
              <span>Total</span>
              <span>{total === 0 ? "Free" : formatInr(total)}</span>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!category || createAppointment.isPending}
        className="pill-btn w-full"
      >
        {createAppointment.isPending ? "processing…" : total === 0 ? "confirm free session" : "pay & request this session"}
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
