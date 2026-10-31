"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Clock,
  History,
  House,
  Inbox,
  Search,
  UserRound,
  Video,
} from "lucide-react";
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
import { formatDateTime, formatInr } from "@/lib/utils";
import { AvailabilityManager } from "@/components/AvailabilityManager";
import {
  CardHead,
  DashCard,
  DashboardShell,
  Eyebrow,
  IconTile,
  PageHead,
  StatCard,
  StatusPill,
  shortDate,
  shortTime,
  type PillTone,
} from "@/components/dashboard/DashboardUi";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONES: Record<string, PillTone> = {
  pending: "amber",
  confirmed: "green",
  completed: "grey",
  cancelled: "grey",
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
    { label: "Confirm", nextStatus: "confirmed" },
    { label: "Decline", nextStatus: "cancelled" },
  ],
  confirmed: [
    { label: "Mark completed", nextStatus: "completed" },
    { label: "Cancel", nextStatus: "cancelled" },
  ],
};

function categoryLabel(category: string) {
  return category.replace("-", " & ");
}

function scrollToSection(id: string) {
  window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
}

function Initial({ name }: { name: string }) {
  return (
    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#ead6df] text-xs font-extrabold text-brand-wine">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

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
    <div className="mt-3 border-t border-[#f1ebee] pt-2.5">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-[11px] font-bold text-brand hover:underline">
        {open ? "Hide private notes" : initialNotes ? "View private notes" : "Add private notes"}
      </button>
      {open && (
        <div className="mt-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="Only visible to you, not shown to the client."
            className="input text-xs"
          />
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              disabled={!dirty || isSaving}
              onClick={() => onSave(draft)}
              className="pill-btn-outline !py-1 text-[11px]"
            >
              {isSaving ? "Saving…" : "Save notes"}
            </button>
            {!dirty && initialNotes && <span className="text-[11px] text-ink/40">Saved</span>}
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
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-[15px] object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[15px] border border-dashed border-ink/25 text-center text-[9px] leading-tight text-ink/40">
            No Photo
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
            {uploadPhoto.isPending ? "Uploading…" : "Change photo"}
          </button>
          {uploadError && <p className="mt-1 text-[11px] text-red-600">{uploadError}</p>}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-[#68768b]">Short bio</label>
        <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={2} className="input mt-1 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#68768b]">Full bio</label>
        <textarea value={longBio} onChange={(event) => setLongBio(event.target.value)} rows={5} className="input mt-1 text-sm" />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!dirty || saveProfile.isPending}
          onClick={() => saveProfile.mutate()}
          className="pill-btn !py-1.5 text-xs"
        >
          {saveProfile.isPending ? "Saving…" : "Save profile"}
        </button>
        {!dirty && saveProfile.isSuccess && <span className="text-[11px] text-ink/40">Saved</span>}
      </div>
    </div>
  );
}

function StatusScreen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100svh-4.5rem)] bg-[#f7f5f6] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-md rounded-[18px] border border-[#eee4e9] bg-white p-8 text-center shadow-[0_14px_36px_rgba(45,65,96,0.08)]">
        {children}
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

  if (status !== "authenticated" || profile?.role !== "expert" || expertQuery.isLoading) {
    return <div className="min-h-[calc(100svh-4.5rem)] bg-[#f7f5f6] px-4 py-16 text-center text-sm text-ink/60">Loading…</div>;
  }

  if (!expertQuery.data) {
    return (
      <StatusScreen>
        <Eyebrow>Counsellor workspace</Eyebrow>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-brand-navy">No expert profile linked</h1>
        <p className="mt-2 text-sm text-[#718096]">
          Your account has expert access, but isn&apos;t linked to a directory entry yet. Reach out to get that set up.
        </p>
      </StatusScreen>
    );
  }

  const expert = expertQuery.data;
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

  const timeOf = (a: AppointmentWithCustomer) => (a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER);
  const upcomingByTime = [...upcoming].sort((a, b) => timeOf(a) - timeOf(b));
  const today = new Date().toDateString();
  const sessionsToday = upcoming.filter((a) => a.scheduled_at && new Date(a.scheduled_at).toDateString() === today);
  const clientName = (a: AppointmentWithCustomer) => a.profiles?.full_name ?? "Client";

  // Follow-ups pulled from real bookings: paid requests to answer, finished
  // sessions with no private note yet, and requests still waiting on the
  // client's payment.
  const careTasks = [
    ...pending.map((a) => ({
      id: a.id,
      name: clientName(a),
      detail: `New request · ${categoryLabel(a.therapy_category).replace(/\b\w/g, (c) => c.toUpperCase())}`,
      action: { label: "Review", run: () => scrollToSection("requests") },
    })),
    ...(notesQuery.data
      ? completed
          .filter((a) => !notesQuery.data.get(a.id)?.notes)
          .slice(0, 3)
          .map((a) => ({
            id: a.id,
            name: clientName(a),
            detail: "Session note not added yet",
            action: {
              label: "Add note",
              run: () => {
                setShowAllHistory(true);
                scrollToSection("history");
              },
            },
          }))
      : []),
    ...awaitingPayment.map((a) => ({
      id: a.id,
      name: clientName(a),
      detail: "Waiting for the client's payment",
      action: null,
    })),
  ].slice(0, 5);

  function openAvailability() {
    setShowAvailability(true);
    scrollToSection("availability");
  }

  function openProfile() {
    setShowProfileEditor(true);
    scrollToSection("profile");
  }

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
      <li key={appointment.id} className="rounded-[14px] border border-[#eee4e9] bg-white p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="text-[13px] font-bold capitalize text-brand-navy">{categoryLabel(appointment.therapy_category)}</span>
          {appointment.payment_status === "paid" ? (
            <StatusPill tone={STATUS_TONES[appointment.status] ?? "grey"}>{STATUS_LABELS[appointment.status]}</StatusPill>
          ) : (
            <StatusPill tone="amber">Awaiting payment</StatusPill>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#faf8f9] p-3">
          <Initial name={clientName(appointment)} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-navy">{clientName(appointment)}</p>
            {appointment.profiles?.phone && (
              <a href={`tel:${appointment.profiles.phone}`} className="text-[11px] text-[#718096] hover:text-brand hover:underline">
                {appointment.profiles.phone}
              </a>
            )}
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-[#5e6b7f]">
          <Clock className="h-3.5 w-3.5 text-brand" aria-hidden />
          {appointment.scheduled_at ? formatDateTime(appointment.scheduled_at) : "Time to be confirmed"}
        </p>
        {appointment.notes && <p className="mt-1.5 text-xs text-[#718096]">&ldquo;{appointment.notes}&rdquo;</p>}
        {appointment.total !== null && (
          <p className="mt-1.5 text-[11px] text-[#8992a0]">
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
            className="mt-1.5 flex items-center gap-1.5 truncate text-xs font-semibold text-brand hover:underline"
          >
            <Video className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{appointment.meet_link}</span>
          </a>
        )}

        {appointment.intake_completed_at && (
          <div className="mt-3 rounded-xl border border-[#eee4e9] bg-[#faf8f9] p-3 text-xs">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand">Client intake</p>
            <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[#5e6b7f]">
              {appointment.intake_age && (
                <>
                  <dt className="text-ink/40">Age</dt>
                  <dd>{appointment.intake_age}</dd>
                </>
              )}
              {appointment.intake_pronouns && (
                <>
                  <dt className="text-ink/40">Pronouns</dt>
                  <dd>{appointment.intake_pronouns}</dd>
                </>
              )}
              {appointment.intake_occupation && (
                <>
                  <dt className="text-ink/40">Occupation</dt>
                  <dd>{appointment.intake_occupation}</dd>
                </>
              )}
              {appointment.intake_concern && (
                <>
                  <dt className="text-ink/40">Concern</dt>
                  <dd>{appointment.intake_concern}</dd>
                </>
              )}
            </dl>
            {appointment.intake_description && (
              <p className="mt-1.5 text-[#5e6b7f]">
                <span className="text-ink/40">what brought them here: </span>
                {appointment.intake_description}
              </p>
            )}
            {Array.isArray(appointment.intake_answers) && appointment.intake_answers.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-[#eee4e9] pt-2">
                {(appointment.intake_answers as unknown as { question: string; answer: string }[]).map((qa, i) => (
                  <p key={i} className="text-[#5e6b7f]">
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
              <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[#5e6b7f]">
                {appointment.intake_energy_level && (
                  <>
                    <dt className="text-ink/40">Energy</dt>
                    <dd className="capitalize">{appointment.intake_energy_level}</dd>
                  </>
                )}
                {appointment.intake_comfort_level && (
                  <>
                    <dt className="text-ink/40">Comfort</dt>
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
                placeholder="Paste the meeting link (Zoom, Meet, ...)"
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
                Confirm booking
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingId(null);
                  setMeetLinkError(null);
                }}
                className="pill-btn-outline !py-1.5 text-xs"
              >
                Back
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
                  className={action.nextStatus === "cancelled" ? "pill-btn-outline !py-1.5 text-xs" : "pill-btn !py-1.5 text-xs"}
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

  const historyTerm = historySearch.trim().toLowerCase();
  const historyShown = historyTerm
    ? past.filter(
        (a) =>
          (a.profiles?.full_name ?? "").toLowerCase().includes(historyTerm) ||
          a.therapy_category.toLowerCase().includes(historyTerm) ||
          (a.notes ?? "").toLowerCase().includes(historyTerm),
      )
    : showAllHistory
      ? past
      : past.slice(0, 1);

  return (
    <DashboardShell
      workspaceLabel="Practice"
      items={[
        { id: "overview", label: "Today", Icon: House },
        { id: "requests", label: "Requests", Icon: Inbox },
        { id: "upcoming", label: "Schedule", Icon: CalendarDays },
        { id: "history", label: "History", Icon: History },
        { id: "availability", label: "Availability", Icon: CalendarClock, onSelect: () => setShowAvailability(true) },
        { id: "profile", label: "Profile", Icon: UserRound, onSelect: () => setShowProfileEditor(true) },
      ]}
    >
      <PageHead
        id="overview"
        eyebrow={`Counsellor workspace · ${expert.name}`}
        title="Your day at a glance"
        description="Keep sessions, follow-ups and availability together in one calm workspace."
        action={
          <button type="button" onClick={() => scrollToSection("upcoming")} className="pill-btn self-start px-5 py-2.5 text-xs sm:self-auto">
            Open schedule
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Sessions today" value={sessionsToday.length} foot="Confirmed for today" />
        <StatCard label="Needs your response" value={pending.length} foot="Paid requests to confirm" />
        <StatCard label="Upcoming" value={upcoming.length} foot="Confirmed sessions" />
        <StatCard label="Completed" value={completed.length} foot={`${totalBookings} paid bookings in total`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DashCard>
          <CardHead
            eyebrow="Schedule"
            title="Upcoming sessions"
            action={
              <button type="button" onClick={() => scrollToSection("upcoming")} className="text-[11px] font-bold text-brand hover:underline">
                View all →
              </button>
            }
          />
          {upcomingByTime.length === 0 ? (
            <p className="text-sm text-[#718096]">Nothing confirmed yet.</p>
          ) : (
            <div>
              {upcomingByTime.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center gap-3 border-b border-[#f1ebee] py-3 last:border-0">
                  <span className="w-14 shrink-0 text-[10px] font-bold leading-tight text-brand">
                    {a.scheduled_at ? (
                      <>
                        {shortDate(a.scheduled_at)}
                        <br />
                        {shortTime(a.scheduled_at)}
                      </>
                    ) : (
                      "TBC"
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-brand-navy">
                      {clientName(a)} · <span className="capitalize">{categoryLabel(a.therapy_category)}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#8992a0]">Online session</p>
                  </div>
                  {a.meet_link ? (
                    <a href={a.meet_link} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-brand hover:underline">
                      Join
                    </a>
                  ) : (
                    <button type="button" onClick={() => scrollToSection("upcoming")} className="text-[11px] font-bold text-brand hover:underline">
                      Details
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DashCard>

        <DashCard>
          <CardHead
            eyebrow="Follow-up"
            title="Care tasks"
            action={
              <button type="button" onClick={() => scrollToSection("requests")} className="text-[11px] font-bold text-brand hover:underline">
                View requests →
              </button>
            }
          />
          {careTasks.length === 0 ? (
            <p className="text-sm text-[#718096]">You&apos;re all caught up.</p>
          ) : (
            <div>
              {careTasks.map((task) => (
                <div key={`${task.id}-${task.detail}`} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#f0e9ed] py-3 last:border-0">
                  <Initial name={task.name} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-brand-navy">{task.name}</p>
                    <p className="text-[10px] text-[#818a98]">{task.detail}</p>
                  </div>
                  {task.action ? (
                    <button type="button" onClick={task.action.run} className="text-[11px] font-bold text-brand hover:underline">
                      {task.action.label}
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
          )}
        </DashCard>
      </div>

      <DashCard className="mt-4">
        <CardHead
          eyebrow="Professional tools"
          title="Practice essentials"
          description="Quick access to the parts of your work you use most."
        />
        <div className="grid gap-2 md:grid-cols-3">
          {[
            { Icon: CalendarClock, title: "Availability", body: "Working hours and blocked time", run: openAvailability },
            { Icon: UserRound, title: "Public profile", body: "Your photo and bio", run: openProfile },
            {
              Icon: History,
              title: "Session history",
              body: `${past.length} past ${past.length === 1 ? "session" : "sessions"}`,
              run: () => {
                setShowAllHistory(true);
                scrollToSection("history");
              },
            },
          ].map(({ Icon, title, body, run }) => (
            <button
              key={title}
              type="button"
              onClick={run}
              className="flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-[#faf8f9]"
            >
              <IconTile>
                <Icon className="h-4 w-4" aria-hidden />
              </IconTile>
              <span>
                <span className="block text-xs font-semibold text-brand-navy">{title}</span>
                <span className="mt-0.5 block text-[10px] text-[#8992a0]">{body}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-r-xl border-l-[3px] border-brand-blush bg-[#fcf9fb] px-4 py-3 text-[11px] text-[#68768b]">
          <strong className="text-brand-navy">Care workspace:</strong> client details and intake answers are visible only to you
          and the mindcafe team. Your private notes are never shown to clients.
        </div>
      </DashCard>

      <div className="mt-5 space-y-5">
        <DashCard id="requests">
          <CardHead
            eyebrow="Bookings"
            title={`Needs your response (${pending.length})`}
            description="Paid requests: confirm with a meeting link, or decline."
          />
          {pending.length === 0 ? (
            <p className="text-sm text-[#718096]">Nothing pending.</p>
          ) : (
            <ul className="grid gap-3 xl:grid-cols-2">{pending.map(renderAppointment)}</ul>
          )}
        </DashCard>

        {awaitingPayment.length > 0 && (
          <DashCard>
            <CardHead
              eyebrow="Bookings"
              title={`Awaiting payment (${awaitingPayment.length})`}
              description="Requested, not yet paid for. Nothing to do until the customer completes payment."
            />
            <ul className="grid gap-3 xl:grid-cols-2">{awaitingPayment.map(renderAppointment)}</ul>
          </DashCard>
        )}

        <DashCard id="upcoming">
          <CardHead eyebrow="Schedule" title={`Upcoming (${upcoming.length})`} />
          {upcoming.length === 0 ? (
            <p className="text-sm text-[#718096]">Nothing confirmed yet.</p>
          ) : (
            <ul className="grid gap-3 xl:grid-cols-2">{upcomingByTime.map(renderAppointment)}</ul>
          )}
        </DashCard>

        <DashCard id="history">
          <CardHead eyebrow="Records" title="History" description="Completed and cancelled sessions." />
          {past.length === 0 ? (
            <p className="text-sm text-[#718096]">No past sessions yet.</p>
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Search history by client, category, or notes…"
                  className="input !pl-9 text-sm"
                />
              </div>
              {historyShown.length === 0 ? (
                <p className="mt-3 text-sm text-[#718096]">No matches in history.</p>
              ) : (
                <>
                  <ul className="mt-3 grid gap-3 xl:grid-cols-2">{historyShown.map(renderAppointment)}</ul>
                  {!historyTerm && !showAllHistory && past.length > 1 && (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-xs text-[#8992a0]">Showing the most recent of {past.length} total.</p>
                      <button type="button" onClick={() => setShowAllHistory(true)} className="pill-btn-outline shrink-0 !py-1.5 text-xs">
                        Show all
                      </button>
                    </div>
                  )}
                  {!historyTerm && showAllHistory && past.length > 1 && (
                    <div className="mt-3 text-right">
                      <button type="button" onClick={() => setShowAllHistory(false)} className="text-xs font-bold text-brand hover:underline">
                        Show recent only
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </DashCard>

        <div className="grid items-start gap-5 xl:grid-cols-2">
          <DashCard id="availability">
            <CardHead
              eyebrow="Profile & availability"
              title="Availability"
              description="Set your working hours and block out time."
              action={
                <button type="button" onClick={() => setShowAvailability((v) => !v)} className="pill-btn-outline !py-1.5 text-xs">
                  {showAvailability ? "Hide" : "Manage"}
                </button>
              }
            />
            {showAvailability && <AvailabilityManager expertId={expert.id} />}
          </DashCard>

          <DashCard id="profile">
            <CardHead
              eyebrow="Profile & availability"
              title="Your public profile"
              description="The photo and bio clients see on your mindcafe page."
              action={
                <button type="button" onClick={() => setShowProfileEditor((v) => !v)} className="pill-btn-outline !py-1.5 text-xs">
                  {showProfileEditor ? "Hide" : "Edit"}
                </button>
              }
            />
            {showProfileEditor && <ExpertProfileEditor expert={expert} />}
          </DashCard>
        </div>
      </div>
    </DashboardShell>
  );
}
