-- Lets an expert also update their own bio/long_bio/photo_url (previously
-- only working_hours_start/end were allowed for a self-edit, see
-- 20260724090000). name/certifications/specialties/is_active/is_bookable/
-- rating/profile_id/sort_order/notification_email stay admin-only —
-- those are more quality-control/directory-consistency sensitive than
-- "update your own bio and headshot".
create or replace function public.prevent_expert_self_edit_overreach() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.name is distinct from old.name
     or new.languages is distinct from old.languages
     or new.modalities is distinct from old.modalities
     or new.client_concerns is distinct from old.client_concerns
     or new.therapist_note is distinct from old.therapist_note
     or new.certifications is distinct from old.certifications
     or new.specialties is distinct from old.specialties
     or new.is_active is distinct from old.is_active
     or new.is_bookable is distinct from old.is_bookable
     or new.rating is distinct from old.rating
     or new.notification_email is distinct from old.notification_email
     or new.profile_id is distinct from old.profile_id
     or new.sort_order is distinct from old.sort_order
     or new.years_experience is distinct from old.years_experience then
    raise exception 'Experts can only update their own working hours, bio, and photo';
  end if;

  return new;
end;
$$;

-- Photo uploads were admin-only (expert_photos_admin_insert) -- an expert
-- self-editing their photo needs to be able to upload a new file too.
-- Scoped to "any signed-in expert" rather than per-file ownership: upload
-- filenames are random UUIDs (uploadExpertPhotoAdmin/uploadExpertPhoto),
-- not tied to a specific expert_id, so there's no per-object owner to
-- check against -- same trust level as every other authenticated-only
-- table grant in this schema. Update/delete on existing files stays
-- admin-only; a self-upload always creates a new file (upsert: false)
-- rather than overwriting one, so insert alone is sufficient.
drop policy if exists expert_photos_expert_insert on storage.objects;
create policy expert_photos_expert_insert on storage.objects
  for insert with check (
    bucket_id = 'expert-photos'
    and exists (select 1 from public.experts e where e.profile_id = auth.uid())
  );
