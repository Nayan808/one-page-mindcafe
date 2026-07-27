// Shared 45-minute-slot generation for counselling bookings — used by the
// customer booking form (BookAppointmentContent), the expert dashboard's
// "manage availability" section, and the admin equivalent, so all three
// agree on exactly the same slot definitions (business hours, session
// length, date bounds). Extracted here rather than duplicated per file.
export const SESSION_MINUTES = 45;
export const SLOT_START_HOUR = 9; // 9:00 AM
export const SLOT_END_HOUR = 19; // last slot starts by 6:45 PM, so sessions wrap up by 7:30 PM
export const MAX_BOOKING_DAYS_AHEAD = 60;

// yyyy-mm-dd in the browser's local date, for <input type="date"> min/max —
// deliberately not `new Date().toISOString().slice(0, 10)`, which is the
// UTC date and can be a day off from the user's actual local "today"
// (e.g. briefly after midnight IST, UTC is still "yesterday"), letting
// someone pick a date that's already passed for them.
export function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 45-minute slots for the given yyyy-mm-dd date, within business hours.
// `excludePast` skips slots already in the past today — on the booking
// form (customer picking a future time) that's what you want, but on the
// availability-management screens (expert/admin blocking out slots) a
// past slot might still need to be visible/toggleable for record-keeping,
// so it's an opt-in flag rather than always-on.
export function generateTimeSlots(dateStr: string, excludePast = true): { value: string; label: string }[] {
  if (!dateStr) return [];
  const [year, month, day] = dateStr.split("-").map(Number);
  const now = new Date();
  const isToday = now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day;

  const slots: { value: string; label: string }[] = [];
  for (let minutes = SLOT_START_HOUR * 60; minutes < SLOT_END_HOUR * 60; minutes += SESSION_MINUTES) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const slotDate = new Date(year, month - 1, day, hour, minute);
    if (excludePast && isToday && slotDate.getTime() < now.getTime()) continue;

    const label = slotDate.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
    const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    slots.push({ value, label });
  }
  return slots;
}
