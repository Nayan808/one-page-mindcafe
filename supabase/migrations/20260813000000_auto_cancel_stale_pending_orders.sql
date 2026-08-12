-- Auto-cancels orders still sitting "placed" (created before payment
-- completed, and never paid) 30 minutes after they were created — the
-- exact same pattern already applied to appointments in
-- 20260724070000_auto_cancel_stale_pending_appointments.sql, just never
-- extended to orders. Until now, an order created by create-order (every
-- checkout attempt inserts a row immediately, before Razorpay opens) that
-- the customer then cancels/abandons/dismisses stayed in 'placed' forever
-- — cluttering /admin/orders indefinitely with attempts that never
-- became real sales.
--
-- Scoped to payment_method = 'razorpay' only, same reasoning as
-- prevent_unpaid_order_confirm in 20260722000000_payment_confirmation_gate.sql:
-- cash_on_pickup orders legitimately sit unpaid until pickup, so those
-- must never be swept up here.
--
-- Pure DB work, no external API, so this runs via pg_cron calling a SQL
-- function directly (same as the appointments version) rather than an
-- edge function round-trip. The existing trg_notify_order_status trigger
-- (AFTER UPDATE on orders) fires normally on this status change, so the
-- customer gets the standard "Your order was cancelled." email — same
-- behavior already accepted for the appointments case, no separate email
-- logic needed here.
create or replace function public.cancel_stale_pending_orders() returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = 'cancelled'
  where status = 'placed'
    and payment_method = 'razorpay'
    and payment_status <> 'paid'
    and created_at < now() - interval '30 minutes';
end;
$$;

select cron.schedule(
  'cancel-stale-pending-orders',
  '*/5 * * * *',
  $$select public.cancel_stale_pending_orders();$$
);
