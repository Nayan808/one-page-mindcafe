-- business_leads and contact_messages both had `for insert with check (true)`
-- — any anon insert allowed, no validation at all. That's directly
-- exploitable via the public anon key against Supabase's REST API,
-- bypassing the website entirely: business_leads is being actively
-- spammed this way (dozens of bot-generated "New business lead" rows,
-- each firing trg_notify_business_lead and flooding the team inbox).
-- contact_messages has the identical open policy and no live frontend
-- form yet, so it hasn't been hit, but the hole is the same.
--
-- Fix: route both inserts through an Edge Function (submit-business-lead)
-- instead of a direct table insert, so a honeypot field + an IP rate
-- limit can be checked before anything gets written. The function uses
-- the service role, which bypasses RLS entirely, so anon/authenticated no
-- longer need — or get — insert access on either table directly.
--
-- contact_messages has no live public form yet (checked: nothing in src/
-- inserts into it), so this migration only removes its open door; the
-- edge-function-mediated pattern should be used from day one whenever
-- that form gets built, same as business_leads below.

drop policy if exists business_leads_insert on public.business_leads;
revoke insert on public.business_leads from anon, authenticated;

drop policy if exists contact_messages_insert on public.contact_messages;
revoke insert on public.contact_messages from anon, authenticated;

-- Minimal IP-based rate-limit log for the submit-business-lead function —
-- not exposed to anon/authenticated at all (RLS enabled, zero policies),
-- only the service role (which bypasses RLS) ever touches it.
create table if not exists public.form_submission_log (
  id uuid primary key default gen_random_uuid(),
  form text not null check (form in ('business_lead')),
  ip_address text not null,
  created_at timestamptz not null default now()
);

create index if not exists form_submission_log_lookup_idx
  on public.form_submission_log (form, ip_address, created_at);

alter table public.form_submission_log enable row level security;
