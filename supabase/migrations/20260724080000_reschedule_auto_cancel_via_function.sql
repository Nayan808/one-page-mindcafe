-- Fixes the cron job from 20260724070000: pg_cron calling
-- cancel_stale_pending_appointments() directly has no service_role auth
-- context, so prevent_customer_appointment_tampering() rejects the status
-- change every time -- confirmed by testing it directly before trusting
-- it. Rescheduled to call the new cancel-stale-appointments edge function
-- instead (same net.http_post pattern already used by the
-- reminderappoitment cron job), which correctly authenticates as
-- service_role via serviceRoleClient() and satisfies that trigger.
select cron.schedule(
  'cancel-stale-pending-appointments',
  '*/5 * * * *',
  $$select net.http_post(
      url:='https://tqjpzqozysmdsuujzvmy.supabase.co/functions/v1/cancel-stale-appointments',
      headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxanB6cW96eXNtZHN1dWp6dm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODIzOTgsImV4cCI6MjA5OTM1ODM5OH0.6YWG8kMwyv84LesjpihegRQoHwkTkLtHfAZyP2eM6oA"}'::jsonb,
      timeout_milliseconds:=5000
  );$$
);
