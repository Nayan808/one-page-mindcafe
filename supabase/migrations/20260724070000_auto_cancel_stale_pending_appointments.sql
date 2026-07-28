-- Auto-cancels appointments still sitting "awaiting payment" (status =
-- 'pending', payment_status <> 'paid' -- same definition the expert
-- dashboard's "awaiting payment" section already uses) 30 minutes after
-- they were created. Pure DB work, no external API involved, so this runs
-- via pg_cron calling a SQL function directly rather than an edge
-- function round-trip (unlike appointment-reminder, which has to call out
-- to send email). The existing trg_notify_appointment trigger (AFTER
-- UPDATE on appointments) fires normally on this status change, so the
-- usual cancellation notification still goes out -- no separate email
-- logic needed here.
create or replace function public.cancel_stale_pending_appointments() returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.appointments
  set status = 'cancelled'
  where status = 'pending'
    and payment_status <> 'paid'
    and created_at < now() - interval '30 minutes';
end;
$$;

select cron.schedule(
  'cancel-stale-pending-appointments',
  '*/5 * * * *',
  $$select public.cancel_stale_pending_appointments();$$
);
