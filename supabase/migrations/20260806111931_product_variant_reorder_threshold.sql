-- Lets an admin set a low-stock threshold per variant, so the new
-- inventory summary dashboard can show a real "OK" / "Low stock" status
-- instead of guessing. Nullable: a variant without one set just shows no
-- status rather than a false "OK".
alter table public.product_variants
  add column if not exists reorder_threshold integer check (reorder_threshold > 0);
