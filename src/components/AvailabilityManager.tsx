"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getSlotAvailability, blockSlot, unblockSlot } from "@/lib/api";
import { generateTimeSlots, toLocalDateInputValue } from "@/lib/timeSlots";

const MAX_BLOCK_DAYS_AHEAD = 180; // longer horizon than customer booking (60 days) — blocking off e.g. a vacation months out is a reasonable thing to want

// Shared by the expert dashboard (managing your own slots) and the admin
// availability page (managing any expert's, e.g. time off on their
// behalf) — same date + slot-grid UI either way, just a different
// expertId source. Already-booked slots show as informational only
// (nothing to toggle, a real appointment is there); anything else can be
// clicked to block/unblock.
export function AvailabilityManager({ expertId }: { expertId: string }) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(toLocalDateInputValue(new Date()));

  const availabilityQuery = useQuery({
    queryKey: ["expert-availability", expertId, selectedDate],
    queryFn: () => getSlotAvailability(createClient(), expertId, selectedDate),
  });

  const toggleSlot = useMutation({
    mutationFn: (args: { slotValue: string; isBlocked: boolean }) =>
      args.isBlocked
        ? unblockSlot(createClient(), expertId, selectedDate, args.slotValue)
        : blockSlot(createClient(), expertId, selectedDate, args.slotValue),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["expert-availability", expertId, selectedDate] }),
  });

  const slots = generateTimeSlots(selectedDate);
  const booked = availabilityQuery.data?.booked ?? new Set<string>();
  const blocked = availabilityQuery.data?.blocked ?? new Set<string>();

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink/70">date</label>
      <input
        type="date"
        value={selectedDate}
        min={toLocalDateInputValue(new Date())}
        max={toLocalDateInputValue(new Date(Date.now() + MAX_BLOCK_DAYS_AHEAD * 24 * 60 * 60 * 1000))}
        onChange={(event) => setSelectedDate(event.target.value)}
        className="input bg-white"
      />

      <p className="mt-3 text-xs text-ink/50">
        Tap a slot to block it off (or unblock one you'd already blocked). Booked slots are shown for reference only —
        cancel the appointment itself to free one up.
      </p>

      {slots.length === 0 ? (
        <p className="mt-3 text-xs text-ink/50">No slots left today for this date.</p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot) => {
            const isBooked = booked.has(slot.value);
            const isBlocked = blocked.has(slot.value);
            const isPending = toggleSlot.isPending && toggleSlot.variables?.slotValue === slot.value;

            return (
              <button
                key={slot.value}
                type="button"
                disabled={isBooked || isPending || availabilityQuery.isLoading}
                onClick={() => toggleSlot.mutate({ slotValue: slot.value, isBlocked })}
                style={
                  isBlocked
                    ? {
                        backgroundImage:
                          "linear-gradient(to top right, transparent calc(50% - 1px), rgb(17 17 16 / 0.35) calc(50% - 1px), rgb(17 17 16 / 0.35) calc(50% + 1px), transparent calc(50% + 1px))",
                      }
                    : undefined
                }
                className={`rounded-lg border px-2 py-2 text-xs font-medium disabled:cursor-not-allowed ${
                  isBooked
                    ? "border-ink/15 bg-ink/5 text-ink/40"
                    : isBlocked
                      ? "border-ink/25 bg-white text-ink/60 hover:border-ink/50"
                      : "border-ink/15 bg-white text-ink hover:border-ink/40"
                } ${isPending ? "opacity-50" : ""}`}
              >
                {slot.label}
                {isBooked && <span className="mt-0.5 block text-[9px] uppercase tracking-label text-ink/40">booked</span>}
                {isBlocked && !isBooked && <span className="mt-0.5 block text-[9px] uppercase tracking-label text-ink/40">blocked</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
