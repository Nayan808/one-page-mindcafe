-- Dedup markers for the new appointment-reminder Edge Function (24h-before
-- and 1h-before session reminders), same pattern as orders.
-- pickup_reminder_sent_at / carts.reminder_sent_at — set right after
-- sending so a re-run of the scheduled function never double-emails the
-- same appointment for the same reminder.
alter table public.appointments add column if not exists reminder_24h_sent_at timestamptz;
alter table public.appointments add column if not exists reminder_1h_sent_at timestamptz;
