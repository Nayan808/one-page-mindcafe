"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronDown, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActiveExperts,
  getSiteSetting,
  getTherapyCategories,
  getUnavailableSlots,
  validateAppointmentCoupon,
  type CouponPreview,
} from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useCreateAppointment } from "@/lib/query/hooks";
import { ExpertCard } from "@/components/ExpertCard";
import { AppointmentConfirmation } from "@/components/AppointmentConfirmation";
import { PhoneVerifyInline } from "@/components/PhoneVerifyInline";
import { formatInr } from "@/lib/utils";
import { generateTimeSlots, toLocalDateInputValue, MAX_BOOKING_DAYS_AHEAD } from "@/lib/timeSlots";

const DEFAULT_SESSION_PRICE = 999;

function BookingForm({ initialCategory, initialExpertId }: { initialCategory: string | null; initialExpertId: string | null }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const createAppointment = useCreateAppointment();

  // Defaults to "other" (no specific category picked) rather than nothing,
  // so this step never actually blocks booking — picking a category is a
  // refinement, not a requirement, and "other" is a real, storable value
  // (see the appointments_therapy_category_check migration).
  const [category, setCategory] = useState<string | null>(initialCategory ?? "other");
  const [expertId, setExpertId] = useState<string | null>(initialExpertId);
  // Arriving with an expert already picked (e.g. from that expert's own
  // "book with {name}" link elsewhere on the site) should feel like that
  // choice is already made, not like a fresh pick from the full roster —
  // starts locked to just that one card, with an explicit way out.
  const [showAllExperts, setShowAllExperts] = useState(!initialExpertId);
  const [expertSearch, setExpertSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [unavailablePopupSlot, setUnavailablePopupSlot] = useState<string | null>(null);
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

  // Only meaningful once both an expert and a date are picked — real
  // slot availability (already booked, or manually blocked by the expert)
  // for that specific expert on that specific day.
  const unavailableSlotsQuery = useQuery({
    queryKey: ["appointments", "unavailable-slots", expertId, selectedDate],
    queryFn: () => getUnavailableSlots(createClient(), expertId!, selectedDate),
    enabled: !!expertId && !!selectedDate,
  });
  const unavailableSlots = unavailableSlotsQuery.data ?? new Set<string>();

  // Every active expert, always — not filtered by category. Expert choice
  // now comes before category in the flow below, so there's no category
  // yet to filter by at that point; showing the full roster up front (and
  // never narrowing it later) is simpler than reconciling "which expert
  // fits this category" once one gets picked afterward.
  const expertsQuery = useQuery({
    queryKey: ["experts", "all"],
    queryFn: () => getActiveExperts(createClient()),
  });

  // The public /experts directory shows every active expert (bookable or
  // not — non-bookable ones still get a "view details" card there), but
  // the booking flow itself only ever offers experts actually taking
  // bookings right now.
  const bookableExperts = (expertsQuery.data ?? []).filter((expert) => expert.is_bookable !== false);
  const selectedExpert = bookableExperts.find((expert) => expert.id === expertId);
  const expertSearchTerm = expertSearch.trim().toLowerCase();
  const filteredExperts = expertSearchTerm
    ? bookableExperts.filter(
        (expert) =>
          expert.name.toLowerCase().includes(expertSearchTerm) ||
          expert.certifications.some((c) => c.toLowerCase().includes(expertSearchTerm)) ||
          expert.specialties.some((s) => s.toLowerCase().includes(expertSearchTerm)),
      )
    : bookableExperts;

  // Right now there's only ever one bookable expert (Shivalika) — default
  // to her instead of making the customer search/click through a picker
  // for a "choice" that isn't really one. Still only fires once, and only
  // when nothing's already selected (a URL ?expert= param, or a manual
  // pick after "choose a different expert"), so it doesn't fight the
  // customer's own selection if more experts become bookable later.
  useEffect(() => {
    if (!expertId && bookableExperts.length === 1) {
      setExpertId(bookableExperts[0].id);
      setShowAllExperts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookableExperts.length]);

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
    if (!category || !expertId || !user) return;
    setError(null);
    try {
      const scheduledAt =
        selectedDate && selectedSlot ? new Date(`${selectedDate}T${selectedSlot}:00`).toISOString() : undefined;
      const result = await createAppointment.mutateAsync({
        therapyCategory: category,
        expertId: expertId ?? undefined,
        scheduledAt,
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
        name: "Mindcafe Counselling",
        prefill: {
          name: profile?.full_name ?? undefined,
          email: user?.email ?? undefined,
          contact: profile?.phone ?? user?.phone ?? undefined,
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
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">Counselling</p>
        <h1 className="font-display mt-3 text-4xl font-bold text-ink sm:text-5xl">Book a session</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">
          Tell us what you're looking for. We&apos;ll confirm the details with you directly.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">1. Category</h2>
        <p className="mt-1 text-xs text-ink/50">Optional. Leave it on &ldquo;all&rdquo; if you're not sure.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`rounded-xl border p-3 text-left text-sm font-medium ${category === "all" ? "border-ink bg-ink text-cream" : "border-ink/15 bg-cream text-ink hover:border-ink/40"}`}
          >
            All
          </button>
          {(categoriesQuery.data ?? []).map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={`rounded-xl border p-3 text-left text-sm font-medium ${category === c.slug ? "border-ink bg-ink text-cream" : "border-ink/15 bg-cream text-ink hover:border-ink/40"}`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">2. Expert</h2>
        {expertsQuery.isLoading ? (
          <p className="mt-3 text-sm text-ink/60">Loading experts…</p>
        ) : (expertsQuery.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">No experts listed yet. Check back soon.</p>
        ) : !showAllExperts && selectedExpert ? (
          <div className="mt-3">
            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <ExpertCard expert={selectedExpert} />
              </div>
            </div>
            <div className="mt-3 text-center">
              <button type="button" onClick={() => setShowAllExperts(true)} className="text-xs font-medium text-ink/60 underline">
                Choose a Different Expert
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mt-3 max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
              <input
                type="text"
                value={expertSearch}
                onChange={(event) => setExpertSearch(event.target.value)}
                placeholder="search by name or specialty"
                className="input w-full !pl-10"
              />
            </div>
            {filteredExperts.length === 0 ? (
              <p className="mt-3 text-sm text-ink/60">No experts match &ldquo;{expertSearch}&rdquo;.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {filteredExperts.map((expert) => (
                  <div
                    key={expert.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setExpertId(expertId === expert.id ? null : expert.id);
                      setShowAllExperts(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setExpertId(expertId === expert.id ? null : expert.id);
                        setShowAllExperts(false);
                      }
                    }}
                    className={`cursor-pointer rounded-2xl text-left transition ${expertId === expert.id ? "ring-2 ring-ink" : ""}`}
                  >
                    <ExpertCard expert={expert} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">2. category</h2>
        <p className="mt-1 text-xs text-ink/50">Optional — leave it as &ldquo;other&rdquo; if you're not sure.</p>
        {/* Native select/date-input icons don't reliably line up with each
            other across browsers even with identical padding (their default
            icon insets differ) — appearance-none plus a shared custom icon,
            positioned identically to this input's own Calendar icon below,
            guarantees they sit at the exact same spot instead of leaving it
            to two different native renderers to happen to agree. */}
        <div className="relative mt-3">
          <select
            value={category ?? "other"}
            onChange={(event) => setCategory(event.target.value)}
            className="input appearance-none !pr-9"
          >
            {(categoriesQuery.data ?? []).map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
            <option value="other">other</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
        </div>
      </div>

      {category && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">3. Preferred time</h2>
          <p className="mt-1 text-xs text-ink/50">Sessions run 45 minutes. Pick a date, then a slot.</p>

          <label className="mb-1 mt-3 block text-xs font-medium text-ink/70">date</label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              min={toLocalDateInputValue(new Date())}
              max={toLocalDateInputValue(new Date(Date.now() + MAX_BOOKING_DAYS_AHEAD * 24 * 60 * 60 * 1000))}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSelectedSlot("");
                setUnavailablePopupSlot(null);
              }}
              // Chrome/Safari's real calendar-picker-indicator sits in its
              // own small icon-sized box, not necessarily under our custom
              // Calendar icon's exact position — leaving it that size (just
              // invisible) meant clicking our icon could miss its actual
              // hit region entirely, which is exactly why the picker
              // stopped opening. Stretched to cover the whole input instead:
              // now every point on the field, including right under our
              // icon, is the real clickable control.
              className="input bg-white !pr-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
            />
            <Calendar className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
          </div>

          {selectedDate && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-ink/70">time slot</label>
              {(() => {
                const slots = generateTimeSlots(selectedDate, true, selectedExpert?.working_hours_start, selectedExpert?.working_hours_end);
                if (slots.length === 0) {
                  return <p className="text-xs text-ink/50">No slots left today. Try picking another date.</p>;
                }
                return (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => {
                      const isUnavailable = unavailableSlots.has(slot.value);
                      return (
                        <div key={slot.value} className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              isUnavailable ? setUnavailablePopupSlot(slot.value) : setSelectedSlot(slot.value)
                            }
                            aria-disabled={isUnavailable}
                            style={
                              isUnavailable
                                ? {
                                    backgroundImage:
                                      "linear-gradient(to top right, transparent calc(50% - 1px), rgb(17 17 16 / 0.35) calc(50% - 1px), rgb(17 17 16 / 0.35) calc(50% + 1px), transparent calc(50% + 1px))",
                                  }
                                : undefined
                            }
                            className={`w-full rounded-lg border px-2 py-2 text-xs font-medium ${
                              isUnavailable
                                ? "cursor-not-allowed border-ink/10 bg-white text-ink/40"
                                : selectedSlot === slot.value
                                  ? "border-ink bg-ink text-cream"
                                  : "border-ink/15 bg-white text-ink hover:border-ink/40"
                            }`}
                          >
                            {slot.label}
                          </button>

                          {unavailablePopupSlot === slot.value && (
                            <div className="absolute left-1/2 top-full z-10 mt-1.5 w-max -translate-x-1/2 rounded-lg border border-ink/15 bg-ink px-2.5 py-1.5 text-[11px] font-medium text-cream shadow-lg">
                              <div className="flex items-center gap-1.5">
                                not available
                                <button
                                  type="button"
                                  onClick={() => setUnavailablePopupSlot(null)}
                                  aria-label="Dismiss"
                                  className="text-cream/70 hover:text-cream"
                                >
                                  <X className="h-3 w-3" aria-hidden />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          <p className="mt-2 text-xs text-ink/50">A starting point. We&apos;ll confirm what actually works.</p>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Anything you'd like your counsellor to know beforehand (optional)"
            rows={3}
            className="input mt-4"
          />
        </div>
      )}

      {category && !user && <PhoneVerifyInline label="4. Verify your phone to continue" />}

      {category && user && (user.phone || profile?.phone) && (
        <p className="text-sm text-ink/60">
          We&apos;ll reach you about this booking at{" "}
          <span className="font-medium text-ink">
            {user.phone ? `+${user.phone}` : profile?.phone}
          </span>
          .
        </p>
      )}

      {category && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">5. Payment</h2>
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
                {isCheckingCoupon ? "Checking…" : discountAmount > 0 ? "Applied" : "Apply"}
              </button>
            </div>
            {couponError && <p className="mt-1.5 text-sm text-red-600">{couponError}</p>}
            {discountAmount > 0 && (
              <p className="mt-1.5 text-sm text-emerald-700">
                &ldquo;{appliedCoupon!.code}&rdquo; applied, {formatInr(discountAmount)} off
              </p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-ink/15 bg-cream p-4 text-sm">
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
        disabled={!category || !expertId || !user || createAppointment.isPending}
        className="pill-btn w-full"
      >
        {createAppointment.isPending ? "Processing…" : total === 0 ? "Confirm Free Session" : "Pay & Request This Session"}
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

  // No separate login page required — an unauthenticated visitor sees the
  // same booking form, and verifies their phone inline (PhoneVerifyInline,
  // step 4) once they're ready to book, rather than being sent elsewhere
  // first. "loading" is the only status that blocks rendering, and only
  // briefly, while AuthContext figures out whether there's a session at
  // all.
  if (status === "loading") {
    return <div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>;
  }

  if (confirmedId) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <AppointmentConfirmation
          appointmentId={confirmedId}
          onBack={() => router.push("/book-appointment")}
          backLabel="Book Another Session"
        />
      </div>
    );
  }

  return <BookingForm initialCategory={initialCategory} initialExpertId={initialExpertId} />;
}

export function BookAppointmentContent() {
  return (
    <div className="bg-white">
      <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>}>
        <BookAppointmentInner />
      </Suspense>
    </div>
  );
}
