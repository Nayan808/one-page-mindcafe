-- General "contact us" messages -- distinct from business_leads, which is
-- specifically B2B corporate-wellness inquiries with a required company
-- name. contact_us submissions are a mixed bag (job applicants, general
-- questions, complaints) that don't naturally have a company attached, so
-- they get their own table instead of being forced into business_leads
-- with a placeholder company_name.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists contact_messages_select on public.contact_messages;
create policy contact_messages_select on public.contact_messages for select using (public.is_admin());

drop policy if exists contact_messages_insert on public.contact_messages;
create policy contact_messages_insert on public.contact_messages for insert with check (true);

drop policy if exists contact_messages_admin_update on public.contact_messages;
create policy contact_messages_admin_update on public.contact_messages
  for update using (public.is_admin()) with check (public.is_admin());

grant insert on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;
grant update on public.contact_messages to authenticated;
