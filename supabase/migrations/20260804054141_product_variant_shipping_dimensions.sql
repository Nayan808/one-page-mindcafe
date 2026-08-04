-- Real physical package attributes per variant, needed by
-- create-shiprocket-shipment (Edge Function) for accurate courier/rate
-- selection -- that function was shipping every order with hardcoded
-- placeholder dimensions (10x10x10cm, 0.5kg) since nothing else was
-- available. Nullable: an unconfigured variant falls back to the same
-- placeholder in the Edge Function rather than blocking shipment
-- creation, but real values should be filled in via /admin/products
-- before relying on Shiprocket's rate calculation.
alter table public.product_variants
  add column if not exists weight_grams integer check (weight_grams > 0),
  add column if not exists length_cm numeric(6, 2) check (length_cm > 0),
  add column if not exists breadth_cm numeric(6, 2) check (breadth_cm > 0),
  add column if not exists height_cm numeric(6, 2) check (height_cm > 0);
