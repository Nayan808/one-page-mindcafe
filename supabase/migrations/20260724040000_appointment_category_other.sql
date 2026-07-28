-- Adds "other" as a real, storable therapy_category value for when a
-- customer's reason for booking doesn't fit any of the specific
-- categories -- shown as the last option in the booking form's category
-- dropdown, alongside "all" (no preference). Same treatment as "all" got
-- in 20260724010000: deliberately NOT added to VALID_CATEGORY_SLUGS, which
-- drives /counselling/[category] static pages and the /experts filter
-- tabs -- neither "all" nor "other" are real specialties to filter by.
alter table public.appointments drop constraint if exists appointments_therapy_category_check;
alter table public.appointments add constraint appointments_therapy_category_check
  check (therapy_category in ('all', 'other', 'individual', 'child-adolescent', 'family-relationship', 'specialized'));
