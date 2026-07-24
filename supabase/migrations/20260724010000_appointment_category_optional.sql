-- Booking form now shows category before expert and defaults to "all" (no
-- specific preference) instead of forcing a pick from the 4 specific
-- categories -- widen the check constraint to accept that as a real,
-- meaningful value rather than forcing a misleading guess into one of the
-- specific buckets. Deliberately NOT added to VALID_CATEGORY_SLUGS (which
-- drives /counselling/[category] static pages and the /experts filter
-- tabs) -- "all" isn't a real specialty to filter by, it's specifically an
-- appointment-level "customer didn't specify" marker.
alter table public.appointments drop constraint if exists appointments_therapy_category_check;
alter table public.appointments add constraint appointments_therapy_category_check
  check (therapy_category in ('all', 'individual', 'child-adolescent', 'family-relationship', 'specialized'));
