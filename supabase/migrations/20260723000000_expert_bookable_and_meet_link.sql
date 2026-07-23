-- Two independent additions bundled in one migration:
--
-- 1. experts.is_bookable — some directory listings (e.g. Arouba Kabir,
--    Harshita Gurbani) shouldn't show a "book with X" button at all; they're
--    still real listings (photo/bio/specialties), just not currently
--    accepting bookings through the site. Defaults true so every existing
--    expert keeps working exactly as before.
--
-- 2. appointments.meet_link + a trigger requiring one before an
--    appointment can reach 'confirmed' — up to now an expert could confirm
--    a session with nothing for the customer to actually join. Mirrors
--    prevent_unpaid_appointment_confirm's shape (block the bad transition
--    at the DB layer, exempt service_role) rather than trusting every
--    caller (expert dashboard today, admin panel potentially later) to
--    remember the check themselves.
alter table public.experts add column if not exists is_bookable boolean not null default true;

update public.experts set is_bookable = false where name in ('Arouba Kabir', 'Harshita Gurbani');

alter table public.appointments add column if not exists meet_link text;

create or replace function public.prevent_confirm_without_meet_link() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and new.status = 'confirmed'
     and (new.meet_link is null or btrim(new.meet_link) = '')
     and auth.role() <> 'service_role' then
    raise exception 'A meet link is required to confirm an appointment';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_confirm_without_meet_link on public.appointments;
create trigger trg_prevent_confirm_without_meet_link
  before update on public.appointments
  for each row execute function public.prevent_confirm_without_meet_link();
