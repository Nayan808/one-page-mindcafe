-- Lets the homepage stats row show a real "sessions booked" count without
-- exposing individual appointment rows to anonymous visitors -- the
-- appointments_select RLS policy is owner/expert/admin-only (setup.sql),
-- so a plain client-side count query would just return 0 for everyone
-- else. This is a security definer aggregate only: no row data, just a
-- number, safe to grant to anon.
create or replace function public.confirmed_sessions_count() returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from appointments where payment_status = 'paid';
$$;

revoke execute on function public.confirmed_sessions_count() from public;
grant execute on function public.confirmed_sessions_count() to anon, authenticated;
