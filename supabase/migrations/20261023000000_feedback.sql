-- Customer feedback collected through the shareable /feedback page.
--
-- Purely additive: creates public.feedback and widens the allowed values
-- of form_submission_log.form. Nothing is deleted or rewritten.
--
-- Inserts never come from the browser directly — the submit-feedback Edge
-- Function writes with the service role after a honeypot + IP rate-limit
-- check (same reasoning as 20260814020000_lockdown_public_insert_forms.sql:
-- an open anon insert policy gets spammed). So anon/authenticated get no
-- insert access here; admins can read, update and delete.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  topic text not null default 'feelz' check (topic in ('feelz', 'counselling', 'website', 'other')),
  product text,
  rating integer not null check (rating between 1 and 5),
  message text not null,
  -- The person ticked "you can share this on the Mindcafe website".
  can_publish boolean not null default false,
  -- Optional ?ref= tag from the shared link (e.g. "zostel-goa"), so the
  -- team can tell which share brought the response in.
  source text,
  status text not null default 'new' check (status in ('new', 'reviewed', 'published')),
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

drop policy if exists feedback_admin_select on public.feedback;
create policy feedback_admin_select on public.feedback for select using (public.is_admin());

drop policy if exists feedback_admin_update on public.feedback;
create policy feedback_admin_update on public.feedback
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists feedback_admin_delete on public.feedback;
create policy feedback_admin_delete on public.feedback for delete using (public.is_admin());

grant select, update, delete on public.feedback to authenticated;

-- Rate-limit log shared with submit-business-lead. Defined in
-- 20260814020000_lockdown_public_insert_forms.sql, but that migration was
-- never applied to production, so create it here if it's missing (same
-- definition: RLS on, zero policies — only the service role touches it).
create table if not exists public.form_submission_log (
  id uuid primary key default gen_random_uuid(),
  form text not null,
  ip_address text not null,
  created_at timestamptz not null default now()
);

create index if not exists form_submission_log_lookup_idx
  on public.form_submission_log (form, ip_address, created_at);

alter table public.form_submission_log enable row level security;

alter table public.form_submission_log drop constraint if exists form_submission_log_form_check;
alter table public.form_submission_log
  add constraint form_submission_log_form_check check (form in ('business_lead', 'feedback'));
