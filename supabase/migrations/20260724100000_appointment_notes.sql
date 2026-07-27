-- Private per-session notes for an expert's own continuity of care
-- ("discussed X, follow up on Y next time") -- distinct from the
-- customer's intake_* fields on appointments (which the customer can see
-- their own copy of). Deliberately a SEPARATE table rather than a column
-- on appointments: RLS is row-level, not column-level, and the customer
-- already has a select policy on their own appointment row
-- (appointments_select, user_id = auth.uid()) -- a plain column here
-- would be readable by the customer too, defeating the point of "private".
create table if not exists public.appointment_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  expert_id uuid not null references public.experts (id) on delete cascade,
  notes text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.appointment_notes enable row level security;

-- Same expert-scoped pattern as appointments_update / expert_blocked_slots
-- -- the assigned expert or admin, nobody else (specifically NOT the
-- customer, even though they can read the appointment itself).
drop policy if exists appointment_notes_access on public.appointment_notes;
create policy appointment_notes_access on public.appointment_notes
  for all using (
    public.is_admin()
    or exists (select 1 from public.experts e where e.id = appointment_notes.expert_id and e.profile_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.experts e where e.id = appointment_notes.expert_id and e.profile_id = auth.uid())
  );

grant select, insert, update, delete on public.appointment_notes to authenticated;
