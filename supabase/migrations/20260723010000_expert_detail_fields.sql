-- Expert directory cards only ever had room for a short bio + a handful of
-- specialty/certification tags — nowhere near enough to hold everything a
-- real therapist bio doc actually contains (years of experience, the
-- longer "about me", named therapy modalities, common client concerns,
-- languages spoken, a personal note to prospective clients). Rather than
-- hardcode Shivalika Srivastav's profile into a page template, these
-- columns make that content real, admin-editable data — any future expert
-- gets a full profile the same way. All nullable/empty-array-default: an
-- expert with none of this filled in should render exactly as it did
-- before this migration, not show broken/empty sections.
alter table public.experts add column if not exists years_experience text;
alter table public.experts add column if not exists long_bio text;
alter table public.experts add column if not exists modalities text[] not null default '{}';
alter table public.experts add column if not exists client_concerns text[] not null default '{}';
alter table public.experts add column if not exists languages text[] not null default '{}';
alter table public.experts add column if not exists therapist_note text;

-- Explicit manual ordering for the directory grid/teaser, independent of
-- rating (which is nulls-heavy right now since no one has reviews yet) —
-- getActiveExperts already orders by rating first, this is purely the
-- tiebreaker among equally-(un)rated experts. High default so existing
-- experts keep their current relative order (whatever Postgres happens to
-- return ties in) and only sit after anyone deliberately given a lower,
-- explicit position.
alter table public.experts add column if not exists sort_order integer not null default 100;
