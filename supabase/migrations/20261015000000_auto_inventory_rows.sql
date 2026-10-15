-- Every Zostel property (pickup_locations row) and every product variant
-- now gets its inventory rows created automatically, instead of relying on
-- a one-off migration or the "add missing" button on /admin/inventory.
--
-- Why: a newly listed property showed up on the website and in
-- scan-and-order immediately, but with no inventory rows every pickup
-- checkout there failed as out of stock until an admin noticed. New
-- products (e.g. the Feelz Bundle) had the same gap and needed their own
-- migration to seed rows.
--
-- Rows start at 0 — a real starting count still has to be entered at
-- /admin/inventory; this only guarantees the row exists so it shows up
-- there (and in the "all Zostel locations" view) ready to fill in.
--
-- Purely additive: inserts missing rows only, never updates or deletes an
-- existing quantity. Safe to re-run.

-- 1. New property → one row per existing variant.
create or replace function public.create_inventory_rows_for_location()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory (variant_id, location_id, quantity_available)
  select v.id, new.id, 0
  from public.product_variants v
  where not exists (
    select 1 from public.inventory i where i.variant_id = v.id and i.location_id = new.id
  );
  return new;
end;
$$;

drop trigger if exists trg_create_inventory_rows_for_location on public.pickup_locations;
create trigger trg_create_inventory_rows_for_location
  after insert on public.pickup_locations
  for each row execute function public.create_inventory_rows_for_location();

-- 2. New variant → a central (delivery) row plus one row per property.
create or replace function public.create_inventory_rows_for_variant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory (variant_id, location_id, quantity_available)
  select new.id, null, 0
  where not exists (
    select 1 from public.inventory i where i.variant_id = new.id and i.location_id is null
  );

  insert into public.inventory (variant_id, location_id, quantity_available)
  select new.id, l.id, 0
  from public.pickup_locations l
  where not exists (
    select 1 from public.inventory i where i.variant_id = new.id and i.location_id = l.id
  );
  return new;
end;
$$;

drop trigger if exists trg_create_inventory_rows_for_variant on public.product_variants;
create trigger trg_create_inventory_rows_for_variant
  after insert on public.product_variants
  for each row execute function public.create_inventory_rows_for_variant();

-- 3. One-time backfill: any property/variant gap that already exists today
-- (every combination with no row yet), plus any variant missing its
-- central row. Existing quantities are untouched.
insert into public.inventory (variant_id, location_id, quantity_available)
select v.id, l.id, 0
from public.product_variants v
cross join public.pickup_locations l
where not exists (
  select 1 from public.inventory i where i.variant_id = v.id and i.location_id = l.id
);

insert into public.inventory (variant_id, location_id, quantity_available)
select v.id, null, 0
from public.product_variants v
where not exists (
  select 1 from public.inventory i where i.variant_id = v.id and i.location_id is null
);
