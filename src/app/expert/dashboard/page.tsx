"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  ApiError,
  getExpertAppointmentNotes,
  getExpertAppointments,
  getExpertByProfileId,
  saveAppointmentNote,
  updateAppointmentStatus,
  updateExpertProfile,
  uploadExpertPhoto,
} from "@/lib/api";
import type { Appointment, AppointmentWithCustomer, Expert } from "@/types/domain";
import { formatInr } from "@/lib/utils";
import { AvailabilityManager } from "@/components/AvailabilityManager";

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

// Normalizes a pasted meeting link (adding https:// if the scheme was left
// off) and rejects obvious garbage — a bare "." or "test" would otherwise
// normalize into something that looks like a URL (e.g. "https://.") but
// goes nowhere, and there was nothing catching that before. A real check
// (parses as a URL, has a hostname with an actual dot in it) instead of
// just "did they type something".
function normalizeMeetLink(raw: string): { value: string } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { error: "Paste a meeting link first." };
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { error: "That doesn't look like a valid link." };
  }
  if (!url.hostname.includes(".") || url.hostname.replace(/\./g, "").length === 0) {
    return { error: "That doesn't look like a valid link." };
  }
  return { value: candidate };
}

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

// Private, per-session notes — never shown to the client, distinct from the
// public appointment.notes the customer submitted at booking. Collapsed by
// default so a card with no notes yet doesn't grow every list; "dirty" is
// judged against initialNotes so a save right after loading immediately
// reads as saved rather than staying in a stale "unsaved" state.
function AppointmentNoteEditor({
  initialNotes,
  onSave,
  isSaving,
}: {
  initialNotes: string;
  onSave: (notes: string) => void;
  isSaving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initialNotes);
  const dirty = draft !== initialNotes;

  return (
    <div className="mt-3 border-t border-ink/10 pt-2.5">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs font-medium text-ink/50 underline">
        {open ? "hide private notes" : initialNotes ? "view private notes" : "add private notes"}
      </button>
      {open && (
        <div className="mt-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="Only visible to you — not shown to the client."
            className="input text-xs"
          />
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              disabled={!dirty || isSaving}
              onClick={() => onSave(draft)}
              className="pill-btn-outline !py-1 text-[11px]"
            >
              {isSaving ? "saving…" : "save notes"}
            </button>
            {!dirty && initialNotes && <span className="text-[11px] text-ink/40">saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Self-edit of bio/long_bio/photo_url — the trigger
// (prevent_expert_self_edit_overreach) already scopes what a non-admin
// write is allowed to touch, so this form only exposes exactly those three
// fields rather than the full admin edit form's surface (name, specialties,
// is_bookable, ...).
function ExpertProfileEditor({ expert }: { expert: Expert }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(expert.bio ?? "");
  const [longBio, setLongBio] = useState(expert.long_bio ?? "");
  const [photoUrl, setPhotoUrl] = useState(expert.photo_url);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const dirty = bio !== (expert.bio ?? "") || longBio !== (expert.long_bio ?? "") || photoUrl !== expert.photo_url;

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => uploadExpertPhoto(createClient(), file),
    onSuccess: (url) => {
      setPhotoUrl(url);
      setUploadError(null);
    },
    onError: (err) => setUploadError(err instanceof ApiError ? err.message : "Upload failed"),
  });

  const saveProfile = useMutation({
    mutationFn: () => updateExpertProfile(createClient(), expert.id, { bio, longBio, photoUrl }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expert-self", expert.profile_id] }),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-full border border-ink/15 object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-ink/25 text-center text-[9px] leading-tight text-ink/40">
            no photo
          </div>
        )}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) uploadPhoto.mutate(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPhoto.isPending}
            className="pill-btn-outline !py-1.5 text-xs"
          >
            {uploadPhoto.isPending ? "uploading…" : "change photo"}
          </button>
          {uploadError && <p className="mt-1 text-[11px] text-red-600">{uploadError}</p>}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-ink/60">short bio</label>
        <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={2} className="input mt-1 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium text-ink/60">full bio</label>
        <textarea value={longBio} onChange={(event) => setLongBio(event.target.value)} rows={5} className="input mt-1 text-sm" />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!dirty || saveProfile.isPending}
          onClick={() => saveProfile.mutate()}
          className="pill-btn !py-1.5 text-xs"
        >
          {saveProfile.isPending ? "saving…" : "save profile"}
        </button>
        {!dirty && saveProfile.isSuccess && <span className="text-[11px] text-ink/40">saved</span>}
      </div>
    </div>
  );
}

export default function ExpertDashboardPage() {
  const { status, user, profile } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  // Confirming needs a meet link entered first (the DB rejects 'confirmed'
  // without one) — this tracks which appointment's card currently has that
  // inline entry form open, and the draft link being typed for it.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [meetLinkDraft, setMeetLinkDraft] = useState("");
  const [meetLinkError, setMeetLinkError] = useState<string | null>(null);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [showAllHistory, setShowAllHistory] = useState(false);

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

  const notesQuery = useQuery({
    queryKey: ["expert-appointment-notes", expertQuery.data?.id],
    queryFn: () => getExpertAppointmentNotes(createClient(), expertQuery.data!.id),
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
      setMeetLinkError(null);
    },
  });

  const saveNote = useMutation({
    mutationFn: (args: { appointmentId: string; notes: string }) =>
      saveAppointmentNote(createClient(), args.appointmentId, expertQuery.data!.id, args.notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expert-appointment-notes", expertQuery.data?.id] }),
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
        setMeetLinkError(null);
        return;
      }
      updateStatus.mutate({ appointmentId: appointment.id, status: action.nextStatus });
    }

    return (
      <li key={appointment.id} className="rounded-xl border border-ink/15 bg-white p-3 text-sm sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
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

        <AppointmentNoteEditor
          initialNotes={notesQuery.data?.get(appointment.id)?.notes ?? ""}
          onSave={(notes) => saveNote.mutate({ appointmentId: appointment.id, notes })}
          isSaving={saveNote.isPending && saveNote.variables?.appointmentId === appointment.id}
        />

        {isConfirming ? (
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              // Experts often paste just the bare link (e.g.
              // "meet.google.com/abc-defg-hij") without the scheme — add
              // https:// if it's missing rather than rejecting it, since
              // there's no reason to make them type that part. But
              // something that isn't a real link at all (a stray ".",
              // "test", ...) gets rejected instead of silently saved.
              const result = normalizeMeetLink(meetLinkDraft);
              if ("error" in result) {
                setMeetLinkError(result.error);
                return;
              }
              setMeetLinkError(null);
              updateStatus.mutate({ appointmentId: appointment.id, status: "confirmed", meetLink: result.value });
            }}
          >
            <div className="flex-1">
              <input
                type="text"
                required
                autoFocus
                placeholder="paste the meeting link (Zoom, Meet, ...)"
                value={meetLinkDraft}
                onChange={(event) => {
                  setMeetLinkDraft(event.target.value);
                  setMeetLinkError(null);
                }}
                className="input !py-1.5 text-xs"
              />
              {meetLinkError && <p className="mt-1 text-[11px] text-red-600">{meetLinkError}</p>}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={updateStatus.isPending} className="pill-btn !py-1.5 text-xs">
                confirm booking
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingId(null);
                  setMeetLinkError(null);
                }}
                className="pill-btn-outline !py-1.5 text-xs"
              >
                back
              </button>
            </div>
          </form>
        ) : (
          actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
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
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">manage availability</h2>
            <button
              type="button"
              onClick={() => setShowAvailability((v) => !v)}
              className="pill-btn-outline shrink-0 !py-1.5 text-xs"
            >
              {showAvailability ? "hide" : "show"}
            </button>
          </div>
          {showAvailability && (
            <div className="mt-3 rounded-xl border border-ink/15 bg-white p-4">
              <AvailabilityManager expertId={expertQuery.data.id} />
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-label text-ink/70">edit my profile</h2>
            <button
              type="button"
              onClick={() => setShowProfileEditor((v) => !v)}
              className="pill-btn-outline shrink-0 !py-1.5 text-xs"
            >
              {showProfileEditor ? "hide" : "show"}
            </button>
          </div>
          {showProfileEditor && (
            <div className="mt-3 rounded-xl border border-ink/15 bg-white p-4">
              <ExpertProfileEditor expert={expertQuery.data} />
            </div>
          )}
        </section>

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
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
              <input
                type="text"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="search history by client, category, or notes…"
                className="input pl-9 text-sm"
              />
            </div>
            {(() => {
              const term = historySearch.trim().toLowerCase();
              const shown = term
                ? past.filter(
                    (a) =>
                      (a.profiles?.full_name ?? "").toLowerCase().includes(term) ||
                      a.therapy_category.toLowerCase().includes(term) ||
                      (a.notes ?? "").toLowerCase().includes(term),
                  )
                : showAllHistory
                  ? past
                  : past.slice(0, 1);
              return shown.length === 0 ? (
                <p className="mt-3 text-sm text-ink/60">No matches in history.</p>
              ) : (
                <>
                  <ul className="mt-3 space-y-2">{shown.map(renderAppointment)}</ul>
                  {!term && !showAllHistory && past.length > 1 && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-ink/50">Showing the most recent of {past.length} total.</p>
                      <button type="button" onClick={() => setShowAllHistory(true)} className="pill-btn-outline shrink-0 !py-1.5 text-xs">
                        show all
                      </button>
                    </div>
                  )}
                  {!term && showAllHistory && past.length > 1 && (
                    <div className="mt-2 text-right">
                      <button type="button" onClick={() => setShowAllHistory(false)} className="text-xs font-medium text-ink/60 underline">
                        show recent only
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </section>
        )}
      </div>
    </div>
  );
}
