-- Runs the sync-inventory-sheet edge function every 10 minutes, pushing
-- website stock (per Zostel property + central/Bhopal) into the shared
-- "Feelz Zostel Inventory Tracker" Google Sheet. Same pg_cron + net.http_post
-- pattern as cancel-stale-pending-appointments.
--
-- Apply only AFTER the function is deployed and its secrets
-- (GOOGLE_SERVICE_ACCOUNT_JSON, INVENTORY_SHEET_ID) are set — before that,
-- each run just returns an error. Idempotent: re-running replaces the job.
-- To stop syncing: select cron.unschedule('sync-inventory-sheet');
select cron.schedule(
  'sync-inventory-sheet',
  '*/10 * * * *',
  $$select net.http_post(
      url:='https://tqjpzqozysmdsuujzvmy.supabase.co/functions/v1/sync-inventory-sheet',
      headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxanB6cW96eXNtZHN1dWp6dm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODIzOTgsImV4cCI6MjA5OTM1ODM5OH0.6YWG8kMwyv84LesjpihegRQoHwkTkLtHfAZyP2eM6oA"}'::jsonb,
      timeout_milliseconds:=30000
  );$$
);
