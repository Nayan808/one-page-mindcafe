-- Per-location commission rate, admin-editable via /admin/pickup-locations.
-- Replaces the flat COMMISSION_RATE = 0.1 hardcoded in staff-pickup/index.ts
-- (see that file's comment history) — default of 10 keeps every existing
-- location's actual math identical until an admin deliberately changes it.
alter table public.pickup_locations
  add column if not exists commission_percent numeric(5, 2) not null default 10
    check (commission_percent >= 0 and commission_percent <= 100);
