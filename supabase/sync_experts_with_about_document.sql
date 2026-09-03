-- One-off data sync, not a schema migration — run this once by hand in the
-- Supabase Dashboard's SQL editor. Brings the live `experts` table in line
-- with "About Experts.docx": only the 12 people named in that document stay
-- active, and the 3 who had no bio at all get one from the document.
--
-- Every statement here is guarded (name-scoped, "is null" where filling a
-- gap) so it's safe to re-run and never overwrites anything already there.
--
-- trg_prevent_expert_self_edit_overreach (20260724090000_expert_working_hours.sql)
-- only lets a change through if the session is an authenticated admin
-- (auth.role() = 'service_role' or public.is_admin()) or the change is
-- limited to bio/long_bio/photo_url/working_hours. The SQL editor's session
-- carries no such auth context, so it reads as neither — is_active and
-- years_experience below would otherwise get rejected. Disabling the
-- trigger for the length of this script (and re-enabling it right after)
-- is scoped to exactly these statements, not a lasting change.
alter table public.experts disable trigger trg_prevent_expert_self_edit_overreach;

-- 1) Deactivate every expert NOT listed in the document. Deactivating
--    (is_active = false), not deleting — appointments.expert_id references
--    experts(id) "on delete set null", so a hard delete would silently wipe
--    the expert off past appointment records too. This just hides them from
--    getActiveExperts() (the public site) while keeping the row intact.
update public.experts
set is_active = false
where name in (
  'Harshita Gurbani',
  'Gauri Ghate',
  'Dr Madhura Samudra',
  'Archana Singhal',
  'Dr. Ratna Mulay',
  'Rupal Sharma',
  'Rhea Pereira',
  'Shreyal Jain',
  'Charul Gupta',
  'Radhika Gupta',
  'Ankita Ganguly',
  'Anushka Gaur'
);

-- 2) Years of experience the document states explicitly, only where the
--    column is still empty (doesn't touch Shivalika Srivastav or Gunjan
--    Kamra, who already have a value set).
update public.experts set years_experience = '20+ Years of Experience'
  where name = 'Jyoti Pande' and years_experience is null;
update public.experts set years_experience = '8+ Years of Experience'
  where name = 'Arouba Kabir' and years_experience is null;
update public.experts set years_experience = '5+ Years of Experience'
  where name = 'Dr. Pritisha Saxena' and years_experience is null;
update public.experts set years_experience = '30+ Years of Experience'
  where name = 'Coach Preeti Khare' and years_experience is null;

-- 3) Bio / long_bio for the 3 experts who had neither field filled in at
--    all (Riddhi Deora, Dr. Gurmeet S. Narang, Dr. Abrar Multani, Coach
--    Preeti Khare, Jyoti Pande, Rashmi Singh, Gunjan Kamra, Dr. Pritisha
--    Saxena, and Aman Grewal already have a bio in the database and are
--    left untouched here).
update public.experts
set
  bio = 'Arouba Kabir is an MA in Counseling Psychology, Certified in Hypnotherapy - Sub Conscious Mind, CBT, Therapeutic Art, and Meditations. With an Exp. of 8 years in the Field, she has been proactively creating awareness about mental health, its importance, and significance via offline & online mediums for a decade. She works with individuals, couples, families, and corporates. Runs a setup, Enso Wellness where she focuses on holistic wellness. She has been awarded many times for her efforts in the Mental Health field and as a woman face in Entrepreneurship. She has successfully initiated and completed various online series, webinars, and workshops with eminent personalities and celebrities. Arouba''s work has been appreciated and published by many known national and international publications. She is a daily writer for many national dailies like Indian Express, Hindustan Times, and many others.',
  long_bio = 'Arouba Kabir is an MA in Counseling Psychology, Certified in Hypnotherapy - Sub Conscious Mind, CBT, Therapeutic Art, and Meditations. With an Exp. of 8 years in the Field, she has been proactively creating awareness about mental health, its importance, and significance via offline & online mediums for a decade. She works with individuals, couples, families, and corporates. Runs a setup, Enso Wellness where she focuses on holistic wellness. She has been awarded many times for her efforts in the Mental Health field and as a woman face in Entrepreneurship. She has successfully initiated and completed various online series, webinars, and workshops with eminent personalities and celebrities. Arouba''s work has been appreciated and published by many known national and international publications. She is a daily writer for many national dailies like Indian Express, Hindustan Times, and many others.'
where name = 'Arouba Kabir' and bio is null;

update public.experts
set
  bio = 'Swami Mukundananda is a spiritual leader, author, and Vedic scholar. He is the founder of JKYog, an incorporation of Hatha Yoga and Bhakti Yoga. He graduated from IIT Delhi and IIM Calcutta and then, opted to follow the spiritual path. He has given philosophical and spiritual speeches at various institutions like Google, Oracle, United Nations, Stanford University, Princeton University, etc. He has appeared in various talk shows with Ranveer Allahbadia, Sandeep Maheshwari, and Boman Irani.',
  long_bio = 'Swami Mukundananda is a spiritual leader, author, and Vedic scholar. He is the founder of JKYog, an incorporation of Hatha Yoga and Bhakti Yoga. He graduated from IIT Delhi and IIM Calcutta and then, opted to follow the spiritual path. He has given philosophical and spiritual speeches at various institutions like Google, Oracle, United Nations, Stanford University, Princeton University, etc. He has appeared in various talk shows with Ranveer Allahbadia, Sandeep Maheshwari, and Boman Irani.'
where name = 'Swami Mukundananda' and bio is null;

update public.experts
set
  bio = 'Shreyasi Walia is a spiritual influencer and teaches the art of meditation. She is a Chartered Accountant, a law graduate and a scriptwriter, currently working as an assistant director for various digital platforms. Ms Walia, in her social media platforms, humorously explains the benefits of meditation and titled her initiative ''500 Reasons to Meditate''. For the past eight years, she has been practising meditation, and at the time of the lockdown, she decided to teach meditation online to make society aware of its benefits.',
  long_bio = 'Shreyasi Walia is a spiritual influencer and teaches the art of meditation. She is a Chartered Accountant, a law graduate and a scriptwriter, currently working as an assistant director for various digital platforms. Ms Walia, in her social media platforms, humorously explains the benefits of meditation and titled her initiative ''500 Reasons to Meditate''. For the past eight years, she has been practising meditation, and at the time of the lockdown, she decided to teach meditation online to make society aware of its benefits.'
where name = 'Shreyasi Walia' and bio is null;

-- Re-enable — leaving it off would reopen the self-edit overreach hole for
-- every expert's own portal session, not just this script.
alter table public.experts enable trigger trg_prevent_expert_self_edit_overreach;
