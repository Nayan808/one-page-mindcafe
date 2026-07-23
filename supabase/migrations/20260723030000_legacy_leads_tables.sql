-- Two small new tables for lead types the legacy mindcafe.app site
-- collected that have no current equivalent — purely additive, nothing
-- existing touched. `company` leads reuse the existing business_leads
-- table instead (same shape already), so no new table needed there.

create table if not exists public.expert_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  city text,
  social_link text,
  qualification text,
  skills text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.expert_applications enable row level security;
drop policy if exists expert_applications_select on public.expert_applications;
create policy expert_applications_select on public.expert_applications for select using (public.is_admin());
drop policy if exists expert_applications_insert on public.expert_applications;
create policy expert_applications_insert on public.expert_applications for insert with check (true);
drop policy if exists expert_applications_admin_update on public.expert_applications;
create policy expert_applications_admin_update on public.expert_applications
  for update using (public.is_admin()) with check (public.is_admin());

grant select on public.expert_applications to authenticated;
grant insert on public.expert_applications to anon, authenticated;
grant update on public.expert_applications to authenticated;

create table if not exists public.feelz_preorders (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  full_name text not null,
  mobile text,
  email text,
  city text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.feelz_preorders enable row level security;
drop policy if exists feelz_preorders_select on public.feelz_preorders;
create policy feelz_preorders_select on public.feelz_preorders for select using (public.is_admin());
drop policy if exists feelz_preorders_insert on public.feelz_preorders;
create policy feelz_preorders_insert on public.feelz_preorders for insert with check (true);

grant select on public.feelz_preorders to authenticated;
grant insert on public.feelz_preorders to anon, authenticated;
