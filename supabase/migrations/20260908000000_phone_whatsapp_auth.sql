-- Adds phone/WhatsApp as a third auth_provider (alongside 'email', 'google')
-- and teaches handle_new_user() to recognize a phone-only signup instead of
-- mislabeling it 'email'. Non-destructive: widens a check constraint and
-- replaces a function definition, touches zero existing rows.

alter table public.profiles drop constraint if exists profiles_auth_provider_check;
alter table public.profiles add constraint profiles_auth_provider_check
  check (auth_provider in ('email', 'google', 'phone'));

create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, auth_provider, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.phone,
    case
      when new.raw_app_meta_data ->> 'provider' = 'google' then 'google'
      when new.phone is not null and new.email is null then 'phone'
      else 'email'
    end,
    new.raw_user_meta_data ->> 'avatar_url',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
