-- The expert dashboard could only ever show category/time/notes for each
-- booking — never who the client actually is, because profiles_select
-- only let someone read their own profile (or an admin read anyone's).
-- An expert legitimately needs the client's name and phone number for a
-- session they're assigned to, the same way appointments_select already
-- lets them see the appointment row itself. Scoped tightly: only a
-- profile belonging to someone who has an appointment with this expert,
-- nothing broader.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.appointments a
      join public.experts e on e.id = a.expert_id
      where a.user_id = profiles.id and e.profile_id = auth.uid()
    )
  );
