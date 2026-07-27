-- Real slot availability for the booking form. "Unavailable" is two
-- sources unioned client-side: already-booked appointments (no new table
-- needed for that half) and manually blocked slots (this table) — an
-- expert or admin blocking out a specific 45-minute slot (time off,
-- lunch, etc.). One row per blocked slot, same granularity as
-- SESSION_MINUTES in BookAppointmentContent.tsx.
create table if not exists public.expert_blocked_slots (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts (id) on delete cascade,
  blocked_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (expert_id, blocked_at)
);

create index if not exists expert_blocked_slots_expert_date_idx
  on public.expert_blocked_slots (expert_id, blocked_at);

alter table public.expert_blocked_slots enable row level security;

-- Public read — the booking form needs this to compute availability, same
-- as public.experts itself being publicly readable.
drop policy if exists expert_blocked_slots_select on public.expert_blocked_slots;
create policy expert_blocked_slots_select on public.expert_blocked_slots
  for select using (true);

-- Same expert-scoped pattern as appointments_update: the assigned expert
-- (via profile_id) or admin.
drop policy if exists expert_blocked_slots_write on public.expert_blocked_slots;
create policy expert_blocked_slots_write on public.expert_blocked_slots
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.experts e
      where e.id = expert_blocked_slots.expert_id and e.profile_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.experts e
      where e.id = expert_blocked_slots.expert_id and e.profile_id = auth.uid()
    )
  );

grant select on public.expert_blocked_slots to anon, authenticated;
grant insert, delete on public.expert_blocked_slots to authenticated;
