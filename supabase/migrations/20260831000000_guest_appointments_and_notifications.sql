-- Three additive, non-destructive changes:
--
--   1. Guest appointment booking — appointments currently have zero guest
--      support (user_id not null, no guest_* columns, RLS requires
--      auth.uid()), unlike orders which already support a fully
--      unauthenticated guest booking. This brings appointments up to the
--      exact same pattern orders already use, including the same
--      documented security tradeoff: a guest row is readable by anyone
--      who has its id (an unguessable random UUID, never enumerated),
--      not by any other credential check. See setup.sql's own comment
--      above orders_select for the original version of this reasoning.
--
--   2. orders.estimated_delivery — Shiprocket already returns a delivery
--      estimate (its `etd` field) during the pincode-serviceability
--      check at checkout, but nothing has ever persisted it; create-order
--      computes it and then discards it. This column gives it somewhere
--      to live so it can actually be shown to the customer (email,
--      order confirmation) instead of only flashing on screen once
--      during checkout.
--
--   3. Notification reliability columns on both orders and appointments —
--      order-status-notifier / appointment-notifier can fail silently
--      today (missing EMAIL_PROVIDER_API_KEY, a Resend error, a pg_net
--      failure) with zero record anywhere that it happened. This matters
--      more once a guest's only way to know their order/booking status
--      is that email — these columns let each notifier record its own
--      outcome so an admin can actually see a delivery failure instead
--      of it being invisible.

-- ---------------------------------------------------------------------
-- 1. Guest appointments
-- ---------------------------------------------------------------------
alter table public.appointments alter column user_id drop not null;

alter table public.appointments add column if not exists guest_name text;
alter table public.appointments add column if not exists guest_phone text;
alter table public.appointments add column if not exists guest_email text;

alter table public.appointments drop constraint if exists appointments_guest_needs_contact;
alter table public.appointments add constraint appointments_guest_needs_contact check (
  user_id is not null or (guest_name is not null and guest_phone is not null)
);

drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
  for select using (
    user_id = auth.uid()
    or user_id is null
    or public.is_admin()
    or exists (
      select 1 from public.experts e
      where e.id = appointments.expert_id and e.profile_id = auth.uid()
    )
  );

drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
  for insert with check (user_id = auth.uid() or user_id is null or public.is_admin());

-- ---------------------------------------------------------------------
-- 2. Estimated delivery date (orders)
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists estimated_delivery text;

-- ---------------------------------------------------------------------
-- 3. Notification reliability tracking
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists last_notification_status text;
alter table public.orders add column if not exists last_notification_error text;
alter table public.orders add column if not exists last_notification_at timestamptz;

alter table public.appointments add column if not exists last_notification_status text;
alter table public.appointments add column if not exists last_notification_error text;
alter table public.appointments add column if not exists last_notification_at timestamptz;
