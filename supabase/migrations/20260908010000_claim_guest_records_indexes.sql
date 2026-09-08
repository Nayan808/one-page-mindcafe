-- Speeds up claim-guest-records' lookup of unclaimed guest rows by phone.
-- Purely additive (CREATE INDEX IF NOT EXISTS) — no existing data touched.
create index if not exists orders_guest_phone_unclaimed_idx
  on public.orders (guest_phone) where user_id is null and guest_phone is not null;

create index if not exists appointments_guest_phone_unclaimed_idx
  on public.appointments (guest_phone) where user_id is null and guest_phone is not null;
