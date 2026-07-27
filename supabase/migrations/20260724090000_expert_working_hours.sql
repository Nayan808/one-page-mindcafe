-- Lets an expert set their own daily working hours instead of everyone
-- sharing the single global 9am-7pm constant (SLOT_START_HOUR/
-- SLOT_END_HOUR in src/lib/timeSlots.ts, kept as the default here).
alter table public.experts
  add column if not exists working_hours_start smallint not null default 9,
  add column if not exists working_hours_end smallint not null default 19;

alter table public.experts drop constraint if exists experts_working_hours_check;
alter table public.experts add constraint experts_working_hours_check
  check (working_hours_start >= 0 and working_hours_end <= 23 and working_hours_start < working_hours_end);

-- experts_admin_write (setup.sql) is is_admin()-only -- an expert has
-- never been able to update their own row at all. New policy lets them,
-- but the trigger below is the real enforcement boundary restricting a
-- self-edit to just the two working-hours columns (same "policy is
-- structural, trigger is the actual boundary" pattern as
-- prevent_customer_appointment_tampering).
drop policy if exists experts_self_write on public.experts;
create policy experts_self_write on public.experts
  for update using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

create or replace function public.prevent_expert_self_edit_overreach() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.name is distinct from old.name
     or new.photo_url is distinct from old.photo_url
     or new.bio is distinct from old.bio
     or new.long_bio is distinct from old.long_bio
     or new.languages is distinct from old.languages
     or new.modalities is distinct from old.modalities
     or new.client_concerns is distinct from old.client_concerns
     or new.therapist_note is distinct from old.therapist_note
     or new.certifications is distinct from old.certifications
     or new.specialties is distinct from old.specialties
     or new.is_active is distinct from old.is_active
     or new.is_bookable is distinct from old.is_bookable
     or new.rating is distinct from old.rating
     or new.notification_email is distinct from old.notification_email
     or new.profile_id is distinct from old.profile_id
     or new.sort_order is distinct from old.sort_order
     or new.years_experience is distinct from old.years_experience then
    raise exception 'Experts can only update their own working hours';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_expert_self_edit_overreach on public.experts;
create trigger trg_prevent_expert_self_edit_overreach
  before update on public.experts
  for each row execute function public.prevent_expert_self_edit_overreach();
