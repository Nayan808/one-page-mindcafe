-- Manual log for stock that went missing or got misplaced at a specific
-- place (a Zostel location, or the online/central pool when null) — kept
-- as its own table rather than a 4th Transaction Log type, since a
-- missing/misplaced unit isn't a received/shipped/sold movement. Same
-- audit-trail spirit as inventory_transactions (see
-- 20260806113057_inventory_transactions.sql): deliberately NOT wired to
-- mutate inventory.quantity_available, just a record an admin can
-- compare against real stock. One place, one product, one quantity per
-- entry — entered by hand.
create table if not exists public.misplaced_stock_logs (
  id uuid primary key default gen_random_uuid(),
  log_date date not null,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  location_id uuid references public.pickup_locations (id) on delete set null,
  quantity integer not null check (quantity > 0),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists misplaced_stock_logs_variant_id_idx on public.misplaced_stock_logs (variant_id);
create index if not exists misplaced_stock_logs_location_id_idx on public.misplaced_stock_logs (location_id);
create index if not exists misplaced_stock_logs_log_date_idx on public.misplaced_stock_logs (log_date desc);

alter table public.misplaced_stock_logs enable row level security;

-- Operational/business ledger, not customer-facing data -- admin-only,
-- same shape as inventory_transactions_admin_all.
drop policy if exists misplaced_stock_logs_admin_all on public.misplaced_stock_logs;
create policy misplaced_stock_logs_admin_all on public.misplaced_stock_logs
  for all using (public.is_admin()) with check (public.is_admin());
