-- Sets experts.photo_url to the square, face-centred photos added under
-- public/experts/ (cropped from the client's "Mindcafe Experts" folder).
--
-- Run this in the Supabase SQL editor ONLY AFTER the commit that adds
-- public/experts/*.webp is merged to main and live on Vercel — before
-- that, these paths 404 on the live site.
--
-- Only photo_url changes. 9 experts had no photo (NULL); Arouba Kabir,
-- Shreyasi Walia and Swami Mukundananda had background-removed cut-outs
-- of the same photos, replaced here for a consistent look. Shivalika
-- Srivastav is left alone — her current storage photo is byte-identical
-- to the folder copy. Matched on id AND name, so a renamed or replaced
-- row is skipped rather than given the wrong face. Expect 12 rows back.
--
-- Note: the folder file is named "Jyoti Khare.png", but the only Jyoti on
-- the site (and in "About Experts.docx") is Jyoti Pande — confirm that
-- photo is her before running.

update public.experts e
set photo_url = v.photo_url
from (values
  ('0e7417cd-11f9-4a57-9b37-fa4eb791e4c9'::uuid, 'Aman Grewal', '/experts/aman-grewal.webp'),
  ('dc8603fa-39f7-488e-8397-ce7df98423b3'::uuid, 'Arouba Kabir', '/experts/arouba-kabir.webp'),
  ('834e60a3-e034-497b-bc2e-41bab34d1a8a'::uuid, 'Coach Preeti Khare', '/experts/preeti-khare.webp'),
  ('76cfab29-0f75-4893-9615-111da3edf80f'::uuid, 'Dr. Abrar Multani', '/experts/abrar-multani.webp'),
  ('3d4ed53f-4a15-47d7-8541-6cedfcb9a6ae'::uuid, 'Dr. Gurmeet S. Narang', '/experts/gurmeet-narang.webp'),
  ('e7937104-ff0a-494a-bcc3-35d108c35a4c'::uuid, 'Dr. Pritisha Saxena', '/experts/pritisha-saxena.webp'),
  ('0580a2eb-6fe1-41cb-9dd9-ad08df585d11'::uuid, 'Gunjan Kamra', '/experts/gunjan-kamra.webp'),
  ('3acbe2e3-6bbf-4f8c-b8b9-76df7050d84f'::uuid, 'Jyoti Pande', '/experts/jyoti-pande.webp'),
  ('3b71d2db-1045-4596-a333-efce02dfd68f'::uuid, 'Rashmi Singh', '/experts/rashmi-singh.webp'),
  ('85c7e7d1-9c79-4c0c-9735-acebe4451a6b'::uuid, 'Riddhi Deora', '/experts/riddhi-deora.webp'),
  ('faf3b44c-0182-4c72-b0ac-95ce1f863211'::uuid, 'Shreyasi Walia', '/experts/shreyasi-walia.webp'),
  ('5b74d0fb-bdce-4baa-9932-f21e2f0ae259'::uuid, 'Swami Mukundananda', '/experts/swami-mukundananda.webp')
) as v(id, name, photo_url)
where e.id = v.id and e.name = v.name
returning e.name, e.photo_url;

-- Rollback (values as of 2026-10-18, before this ran):
--
-- update public.experts set photo_url = null where id in (
--   '0e7417cd-11f9-4a57-9b37-fa4eb791e4c9', '834e60a3-e034-497b-bc2e-41bab34d1a8a',
--   '76cfab29-0f75-4893-9615-111da3edf80f', '3d4ed53f-4a15-47d7-8541-6cedfcb9a6ae',
--   'e7937104-ff0a-494a-bcc3-35d108c35a4c', '0580a2eb-6fe1-41cb-9dd9-ad08df585d11',
--   '3acbe2e3-6bbf-4f8c-b8b9-76df7050d84f', '3b71d2db-1045-4596-a333-efce02dfd68f',
--   '85c7e7d1-9c79-4c0c-9735-acebe4451a6b');
-- update public.experts set photo_url = '/experts/Arouba_Kabir___Counselling_Psychologist-removebg-preview.png' where id = 'dc8603fa-39f7-488e-8397-ce7df98423b3';
-- update public.experts set photo_url = '/experts/Shreyasi_Walia___Spiritual_Influencer-removebg-preview.png' where id = 'faf3b44c-0182-4c72-b0ac-95ce1f863211';
-- update public.experts set photo_url = '/experts/Swami_Mukundanand___Spiritual_Leader-removebg-preview.png' where id = '5b74d0fb-bdce-4baa-9932-f21e2f0ae259';
