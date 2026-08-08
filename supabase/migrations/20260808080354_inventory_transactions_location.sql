-- Lets a transaction-log entry record which place it's for (a specific
-- Zostel, or the online/central pool when null) -- until now the ledger
-- was a single flat list with no location breakdown, even though the
-- real inventory table it's reconciled against is tracked per-location.
alter table public.inventory_transactions
  add column if not exists location_id uuid references public.pickup_locations (id) on delete set null;

create index if not exists inventory_transactions_location_id_idx on public.inventory_transactions (location_id);
