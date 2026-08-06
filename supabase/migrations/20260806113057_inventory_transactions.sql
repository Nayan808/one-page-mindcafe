-- Manual reconciliation ledger (client-supplied "Transaction Log" sheet:
-- Received / Shipped / Online Sale, one row per event, quantity in XOR
-- out). Deliberately NOT wired to mutate inventory.quantity_available --
-- that column is what checkout actually reserves stock against
-- (create_stock_reservation), and silently rewriting it from a manually
-- typed log entry is exactly the kind of thing that causes quiet stock
-- bugs. This is a separate audit trail an admin can compare against real
-- numbers (live stock, real order counts) side by side.
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null,
  transaction_type text not null check (transaction_type in ('received', 'shipped', 'online_sale')),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity_in integer check (quantity_in > 0),
  quantity_out integer check (quantity_out > 0),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_transactions_exactly_one_quantity check (
    (quantity_in is not null and quantity_out is null) or (quantity_in is null and quantity_out is not null)
  )
);

create index if not exists inventory_transactions_variant_id_idx on public.inventory_transactions (variant_id);
create index if not exists inventory_transactions_date_idx on public.inventory_transactions (transaction_date desc);

alter table public.inventory_transactions enable row level security;

-- Operational/business ledger, not customer-facing data -- admin-only,
-- unlike the public inventory_select policy on the real stock table.
drop policy if exists inventory_transactions_admin_all on public.inventory_transactions;
create policy inventory_transactions_admin_all on public.inventory_transactions
  for all using (public.is_admin()) with check (public.is_admin());
