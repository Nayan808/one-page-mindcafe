-- Manual commission adjustments per pickup location — a correction,
-- bonus, or deduction an admin types in as a one-off, on top of the
-- calculated percent × revenue commission /staff already shows. Kept as
-- a running ledger (like inventory_transactions), not a single
-- overridable field, so a location can accumulate several of these over
-- time with a record of why each one happened — a bonus doesn't erase a
-- prior correction, and every entry stays auditable.
create table if not exists public.pickup_location_commission_adjustments (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.pickup_locations (id) on delete cascade,
  -- Positive = adds to commission owed (bonus), negative = deducts
  -- (correction/clawback). No sign-restricting check — both directions
  -- are valid uses.
  amount numeric(10, 2) not null,
  reason text not null,
  adjustment_date date not null default current_date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists pickup_location_commission_adjustments_location_idx
  on public.pickup_location_commission_adjustments (location_id, adjustment_date);

alter table public.pickup_location_commission_adjustments enable row level security;

drop policy if exists pickup_location_commission_adjustments_admin on public.pickup_location_commission_adjustments;
create policy pickup_location_commission_adjustments_admin on public.pickup_location_commission_adjustments
  for all using (public.is_admin()) with check (public.is_admin());
