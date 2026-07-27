"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getExpertById,
  getSlotAvailability,
  blockSlot,
  unblockSlot,
  updateAppointmentSchedule,
  updateExpertWorkingHours,
} from "@/lib/api";
import { generateTimeSlots, toLocalDateInputValue } from "@/lib/timeSlots";

const MAX_BLOCK_DAYS_AHEAD = 180; // longer horizon than customer booking (60 days) — blocking off e.g. a vacation months out is a reasonable thing to want
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(hour: number): string {
  return new Date(2000, 0, 1, hour).toLocaleTimeString("en-IN", { hour: "numeric", hour12: true });
}

// Shared by the expert dashboard (managing your own slots) and the admin
// availability page (managing any expert's, e.g. time off on their
// behalf) — same date + slot-grid UI either way, just a different
// expertId source. Already-booked slots show who booked them and offer a
// reschedule action; anything else can be tapped to block/unblock; a
// small daily-hours control up top sets that expert's own business hours
// (defaults to the site-wide 9am-7pm until they change it).
export function AvailabilityManager({ expertId }: { expertId: string }) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(toLocalDateInputValue(new Date()));
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editSlot, setEditSlot] = useState("");
  const [hoursDraft, setHoursDraft] = useState<{ start: number; end: number } | null>(null);

  const expertQuery = useQuery({
    queryKey: ["expert-for-availability", expertId],
    queryFn: () => getExpertById(createClient(), expertId),
  });
  const startHour = expertQuery.data?.working_hours_start ?? 9;
  const endHour = expertQuery.data?.working_hours_end ?? 19;

  // Local draft only exists while the expert is actively changing it —
  // otherwise it always mirrors whatever's actually saved, so a stale
  // draft can't silently linger after a save from elsewhere (e.g. admin
  // changing it) shows up via refetch.
  useEffect(() => {
    if (expertQuery.data && !hoursDraft) {
      setHoursDraft({ start: expertQuery.data.working_hours_start, end: expertQuery.data.working_hours_end });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expertQuery.data?.working_hours_start, expertQuery.data?.working_hours_end]);

  const availabilityQuery = useQuery({
    queryKey: ["expert-availability", expertId, selectedDate],
    queryFn: () => getSlotAvailability(createClient(), expertId, selectedDate),
  });

  const invalidateAvailability = (dateStr: string) =>
    queryClient.invalidateQueries({ queryKey: ["expert-availability", expertId, dateStr] });

  const toggleSlot = useMutation({
    mutationFn: (args: { slotValue: string; isBlocked: boolean }) =>
      args.isBlocked
        ? unblockSlot(createClient(), expertId, selectedDate, args.slotValue)
        : blockSlot(createClient(), expertId, selectedDate, args.slotValue),
    onSettled: () => invalidateAvailability(selectedDate),
  });

  const saveHours = useMutation({
    mutationFn: (args: { start: number; end: number }) => updateExpertWorkingHours(createClient(), expertId, args.start, args.end),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expert-for-availability", expertId] }),
  });

  const reschedule = useMutation({
    mutationFn: (args: { appointmentId: string; originalDate: string; newDateStr: string; newSlotValue: string }) =>
      updateAppointmentSchedule(createClient(), args.appointmentId, new Date(`${args.newDateStr}T${args.newSlotValue}:00`).toISOString()),
    onSuccess: (_data, args) => {
      invalidateAvailability(args.originalDate);
      invalidateAvailability(args.newDateStr);
      queryClient.invalidateQueries({ queryKey: ["expert-appointments"] });
      setEditingAppointmentId(null);
      setOpenSlot(null);
    },
  });

  const slots = generateTimeSlots(selectedDate, true, startHour, endHour);
  const booked = availabilityQuery.data?.booked ?? new Map();
  const blocked = availabilityQuery.data?.blocked ?? new Set<string>();
  const editSlots = editDate ? generateTimeSlots(editDate) : [];

  return (
    <div>
      <div className="rounded-xl border border-ink/15 bg-cream/50 p-3">
        <p className="text-xs font-medium text-ink/70">daily hours</p>
        {hoursDraft && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={hoursDraft.start}
              onChange={(event) => setHoursDraft({ ...hoursDraft, start: Number(event.target.value) })}
              className="input !w-auto !py-1.5 text-xs"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
            <span className="text-xs text-ink/50">to</span>
            <select
              value={hoursDraft.end}
              onChange={(event) => setHoursDraft({ ...hoursDraft, end: Number(event.target.value) })}
              className="input !w-auto !py-1.5 text-xs"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={hoursDraft.start >= hoursDraft.end || saveHours.isPending}
              onClick={() => saveHours.mutate(hoursDraft)}
              className="pill-btn !py-1.5 text-xs disabled:opacity-40"
            >
              {saveHours.isPending ? "saving…" : "save"}
            </button>
          </div>
        )}
        {hoursDraft && hoursDraft.start >= hoursDraft.end && <p className="mt-1 text-[11px] text-red-600">Start must be before end.</p>}
      </div>

      <label className="mb-1 mt-4 block text-xs font-medium text-ink/70">date</label>
      <input
        type="date"
        value={selectedDate}
        min={toLocalDateInputValue(new Date())}
        max={toLocalDateInputValue(new Date(Date.now() + MAX_BLOCK_DAYS_AHEAD * 24 * 60 * 60 * 1000))}
        onChange={(event) => {
          setSelectedDate(event.target.value);
          setOpenSlot(null);
          setEditingAppointmentId(null);
        }}
        className="input bg-white"
      />

      <p className="mt-3 text-xs text-ink/50">
        Tap an open slot to block it off, a blocked one to unblock it, or a booked one to see who booked it.
      </p>

      {slots.length === 0 ? (
        <p className="mt-3 text-xs text-ink/50">No slots left today for this date.</p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot) => {
            const bookedInfo = booked.get(slot.value);
            const isBlocked = blocked.has(slot.value);
            const isPending = toggleSlot.isPending && toggleSlot.variables?.slotValue === slot.value;
            const isPopupOpen = openSlot === slot.value;

            return (
              <div key={slot.value} className="relative">
                <button
                  type="button"
                  disabled={isPending || availabilityQuery.isLoading}
                  onClick={() => (bookedInfo ? setOpenSlot(isPopupOpen ? null : slot.value) : toggleSlot.mutate({ slotValue: slot.value, isBlocked }))}
                  style={
                    isBlocked
                      ? {
                          backgroundImage:
                            "linear-gradient(to top right, transparent calc(50% - 1px), rgb(17 17 16 / 0.35) calc(50% - 1px), rgb(17 17 16 / 0.35) calc(50% + 1px), transparent calc(50% + 1px))",
                        }
                      : undefined
                  }
                  className={`w-full rounded-lg border px-2 py-2 text-xs font-medium disabled:cursor-not-allowed ${
                    bookedInfo
                      ? "border-ink/15 bg-ink/5 text-ink/40"
                      : isBlocked
                        ? "border-ink/25 bg-white text-ink/60 hover:border-ink/50"
                        : "border-ink/15 bg-white text-ink hover:border-ink/40"
                  } ${isPending ? "opacity-50" : ""}`}
                >
                  {slot.label}
                  {bookedInfo && <span className="mt-0.5 block text-[9px] uppercase tracking-label text-ink/40">booked</span>}
                  {isBlocked && !bookedInfo && <span className="mt-0.5 block text-[9px] uppercase tracking-label text-ink/40">blocked</span>}
                </button>

                {isPopupOpen && bookedInfo && (
                  <div className="absolute left-1/2 top-full z-10 mt-1.5 w-48 -translate-x-1/2 rounded-lg border border-ink/15 bg-ink p-2.5 text-[11px] text-cream shadow-lg">
                    {editingAppointmentId === bookedInfo.appointmentId ? (
                      <div className="space-y-1.5">
                        <input
                          type="date"
                          value={editDate}
                          min={toLocalDateInputValue(new Date())}
                          onChange={(event) => {
                            setEditDate(event.target.value);
                            setEditSlot("");
                          }}
                          className="w-full rounded border-none bg-white px-1.5 py-1 text-[11px] text-ink"
                        />
                        <select
                          value={editSlot}
                          onChange={(event) => setEditSlot(event.target.value)}
                          disabled={!editDate}
                          className="w-full rounded border-none bg-white px-1.5 py-1 text-[11px] text-ink disabled:opacity-50"
                        >
                          <option value="">pick a time</option>
                          {editSlots.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            disabled={!editDate || !editSlot || reschedule.isPending}
                            onClick={() =>
                              reschedule.mutate({
                                appointmentId: bookedInfo.appointmentId,
                                originalDate: selectedDate,
                                newDateStr: editDate,
                                newSlotValue: editSlot,
                              })
                            }
                            className="flex-1 rounded bg-cream px-2 py-1 text-[11px] font-semibold text-ink disabled:opacity-40"
                          >
                            {reschedule.isPending ? "saving…" : "save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAppointmentId(null)}
                            className="rounded border border-cream/30 px-2 py-1 text-[11px] text-cream/80"
                          >
                            cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <p className="text-ink/40">booked by</p>
                          <p className="font-medium">{bookedInfo.customerName ?? "a customer"}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAppointmentId(bookedInfo.appointmentId);
                              setEditDate(selectedDate);
                              setEditSlot("");
                            }}
                            className="mt-1.5 text-[11px] font-semibold underline"
                          >
                            edit
                          </button>
                        </div>
                        <button type="button" onClick={() => setOpenSlot(null)} aria-label="Close" className="text-cream/70 hover:text-cream">
                          <X className="h-3 w-3" aria-hidden />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
