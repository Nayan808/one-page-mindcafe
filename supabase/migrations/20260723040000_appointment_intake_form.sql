-- Post-payment intake form: once a session is paid for, the customer
-- fills in a short questionnaire (age, pronouns, occupation, what
-- brought them here, and three self-rating scales) that the expert can
-- then see on their dashboard before the session — same intent as the
-- legacy site's intake_form feature, rebuilt as explicit typed columns
-- (not a jsonb blob) since the field set is fixed and known, matching
-- how meet_link/price/etc. are already modeled on this table.
alter table public.appointments add column if not exists intake_age text;
alter table public.appointments add column if not exists intake_pronouns text;
alter table public.appointments add column if not exists intake_occupation text;
alter table public.appointments add column if not exists intake_description text;
alter table public.appointments add column if not exists intake_energy_level text;
alter table public.appointments add column if not exists intake_comfort_level text;
alter table public.appointments add column if not exists intake_self_perception text;
alter table public.appointments add column if not exists intake_completed_at timestamptz;

-- appointments_update (setup.sql) only ever let the assigned expert or an
-- admin update a row — a customer had no write access to their own
-- appointment at all. This opens that up, but ONLY for filling in the
-- intake form; the trigger below is what actually enforces "only the
-- intake_* columns", since RLS policies apply to a whole row, not
-- individual columns.
drop policy if exists appointments_customer_intake_update on public.appointments;
create policy appointments_customer_intake_update on public.appointments
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Column-level enforcement: a customer (not admin, not the assigned
-- expert, not service_role) touching their own appointment row may only
-- ever be changing the intake_* fields. Anything else changing in the
-- same UPDATE — status, payment fields, meet_link, scheduled_at, the
-- expert/category itself — gets rejected outright, the same
-- "real enforcement boundary lives in a trigger" pattern already used by
-- prevent_unpaid_appointment_confirm and prevent_staff_pin_change.
create or replace function public.prevent_customer_appointment_tampering() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if exists (
    select 1 from public.experts e where e.id = new.expert_id and e.profile_id = auth.uid()
  ) then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.payment_status is distinct from old.payment_status
     or new.expert_id is distinct from old.expert_id
     or new.therapy_category is distinct from old.therapy_category
     or new.scheduled_at is distinct from old.scheduled_at
     or new.meet_link is distinct from old.meet_link
     or new.price is distinct from old.price
     or new.total is distinct from old.total
     or new.discount_amount is distinct from old.discount_amount
     or new.coupon_code is distinct from old.coupon_code
     or new.razorpay_order_id is distinct from old.razorpay_order_id
     or new.payment_ref is distinct from old.payment_ref
     or new.notes is distinct from old.notes then
    raise exception 'Customers can only update their intake form fields';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_customer_appointment_tampering on public.appointments;
create trigger trg_prevent_customer_appointment_tampering
  before update on public.appointments
  for each row execute function public.prevent_customer_appointment_tampering();
