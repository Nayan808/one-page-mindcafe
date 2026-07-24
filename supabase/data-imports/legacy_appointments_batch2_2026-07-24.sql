-- Second batch of historical appointments from mindcafe.app -- 72 real
-- (non-'no_book') rows found in a fresh appointment.sql export that were
-- NOT part of the original 40-row import (legacy_appointments_2026-07-23.sql),
-- extending coverage from April 2025 through July 2026. Cross-checked
-- appointment_id-by-appointment_id against that file to guarantee zero
-- overlap.
--
-- Run legacy_new_expert_anushka_gaur_2026-07-24.sql FIRST -- one of these
-- appointments references a psychologist (Anushka Gaur, psychologist_id 44)
-- who was never imported as an expert before now.
--
-- Same resilient design as the first batch: one INSERT...SELECT per row,
-- resolved by email, so a bad/unresolvable row can't roll back the batch
-- BUT remember the earlier lesson from batch 1 -- the Supabase SQL Editor
-- runs a whole pasted script as ONE transaction regardless, so a failure
-- anywhere still rolls back everything pasted together. Paste this as its
-- own separate run.
--
-- Skipped entirely (2 rows): appointment_id 941 (user_id 643) and 1003
-- (user_id 37) -- neither user_id exists in the legacy `users` table at
-- all (not a lookup failure on my end -- confirmed absent from the source
-- data itself), so there's no email to resolve them against.
--
-- Price/coupon data is included directly this time (joined from
-- appointment_order at generation time) -- no separate backfill step
-- needed like batch 1's price-backfill script.
--
-- Sensitive clinical fields (suicidal thoughts, physical condition,
-- private therapist notes) are NOT imported, same policy as batch 1.

-- legacy appointment_id 914, user email tanishkamadaria329@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2025-04-12T13:00:00', 'completed', NULL,
  1000, 1000, 'YH8LKX', 0, 'paid', 'https://meet.google.com/hht-zuau-xnp ',
  NULL, NULL, NULL, NULL,
  '3', '4', '1',
  '2025-04-11 16:04:19', '2025-04-11 16:04:19'
from auth.users u where lower(u.email) = 'tanishkamadaria329@gmail.com'
limit 1;

-- legacy appointment_id 915, user email swathi@mymuse.in
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, NULL, 'individual', '2025-04-19T19:00:00', 'completed', NULL,
  1000, 1000, 'MUSEXMIND', 0, 'paid', 'https://meet.google.com/dqh-kksa-ciy',
  NULL, NULL, NULL, NULL,
  '2', '3', '3',
  '2025-04-14 17:07:50', '2025-04-14 17:07:50'
from auth.users u where lower(u.email) = 'swathi@mymuse.in'
limit 1;

-- legacy appointment_id 919, user email swathi@mymuse.in
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, NULL, 'individual', '2025-04-27T16:00:00', 'completed', NULL,
  1000, 1000, 'MUSEXMIND', 0, 'paid', 'https://meet.google.com/zgi-ahvu-mbz',
  NULL, NULL, NULL, NULL,
  '2', '3', '3',
  '2025-04-26 06:12:47', '2025-04-26 06:12:47'
from auth.users u where lower(u.email) = 'swathi@mymuse.in'
limit 1;

-- legacy appointment_id 921, user email swathi@mymuse.in
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, NULL, 'individual', '2025-05-10T19:00:00', 'completed', NULL,
  1000, 1000, 'MUSEXMIND', 0, 'paid', ' https://meet.google.com/hty-qaoe-kov',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-05-07 09:23:11', '2025-05-07 09:23:11'
from auth.users u where lower(u.email) = 'swathi@mymuse.in'
limit 1;

-- legacy appointment_id 922, user email swathi@mymuse.in
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, NULL, 'individual', '2025-05-17T21:00:00', 'completed', NULL,
  1000, 1000, 'MUSEXMIND', 0, 'paid', 'https://meet.google.com/gzk-iasb-zmp',
  NULL, NULL, NULL, NULL,
  '4', '4', '4',
  '2025-05-17 04:41:43', '2025-05-17 04:41:43'
from auth.users u where lower(u.email) = 'swathi@mymuse.in'
limit 1;

-- legacy appointment_id 923, user email swathi@mymuse.in
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, NULL, 'individual', '2025-05-30T21:00:00', 'confirmed', NULL,
  1000, 1000, 'MUSEXMIND', 0, 'paid', 'https://calendar.app.google/qcxGnRoDiCRhNPUf7',
  NULL, NULL, NULL, NULL,
  '4', '4', '4',
  '2025-05-30 06:39:10', '2025-05-30 06:39:10'
from auth.users u where lower(u.email) = 'swathi@mymuse.in'
limit 1;

-- legacy appointment_id 927, user email sargamdangi2002@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Ankita Ganguly' limit 1), 'individual', '2025-06-23T19:00:00', 'completed', NULL,
  1000, 1000, 'new100', 0, 'paid', 'https://meet.google.com/cqg-mzru-kiy',
  NULL, NULL, NULL, NULL,
  '2', '3', '3',
  '2025-06-23 12:29:38', '2025-06-23 12:29:38'
from auth.users u where lower(u.email) = 'sargamdangi2002@gmail.com'
limit 1;

-- legacy appointment_id 928, user email sargamdangi2002@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Ankita Ganguly' limit 1), 'individual', '2025-06-24T17:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/wcv-cxvr-kir',
  NULL, NULL, NULL, NULL,
  '2', '3', '3',
  '2025-06-24 05:13:54', '2025-06-24 05:13:54'
from auth.users u where lower(u.email) = 'sargamdangi2002@gmail.com'
limit 1;

-- legacy appointment_id 929, user email baglasripat10@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Ankita Ganguly' limit 1), 'individual', '2025-06-27T20:00:00', 'completed', NULL,
  1000, 1000, 'NEW100', 0, 'paid', 'https://meet.google.com/hay-npjb-fdc',
  NULL, NULL, NULL, NULL,
  '2', '2', '3',
  '2025-06-27 11:23:30', '2025-06-27 11:23:30'
from auth.users u where lower(u.email) = 'baglasripat10@gmail.com'
limit 1;

-- legacy appointment_id 930, user email sandeep.mohanty1225@yahoo.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-07-11T12:00:00', 'completed', NULL,
  1000, 1000, 'NEW100', 0, 'paid', 'https://meet.google.com/wae-xjyk-wuu',
  NULL, NULL, NULL, NULL,
  '3', '3', '3',
  '2025-07-11 04:25:16', '2025-07-11 04:25:16'
from auth.users u where lower(u.email) = 'sandeep.mohanty1225@yahoo.com'
limit 1;

-- legacy appointment_id 931, user email alenphilip.ap@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-07-17T14:00:00', 'completed', NULL,
  1000, 1000, 'New100', 0, 'paid', 'https://meet.google.com/uro-eufe-crx',
  NULL, NULL, NULL, NULL,
  '4', '4', '4',
  '2025-07-16 18:48:47', '2025-07-16 18:48:47'
from auth.users u where lower(u.email) = 'alenphilip.ap@gmail.com'
limit 1;

-- legacy appointment_id 932, user email diksha.battan97@icloud.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-07-17T16:00:00', 'cancelled', NULL,
  1000, 1000, 'NEW100', 0, 'paid', 'https://meet.google.com/wae-xjyk-wuu',
  NULL, NULL, NULL, NULL,
  '1', '1', '1',
  '2025-07-17 09:26:32', '2025-07-17 09:26:32'
from auth.users u where lower(u.email) = 'diksha.battan97@icloud.com'
limit 1;

-- legacy appointment_id 939, user email purvichauhan217@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Ankita Ganguly' limit 1), 'individual', '2025-07-26T17:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/hnf-uuad-gks',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-07-25 06:28:37', '2025-07-25 06:28:37'
from auth.users u where lower(u.email) = 'purvichauhan217@gmail.com'
limit 1;

-- legacy appointment_id 945, user email purvichauhan217@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Ankita Ganguly' limit 1), 'individual', '2025-08-02T17:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/nsc-erfm-dha',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-08-01 16:14:47', '2025-08-01 16:14:47'
from auth.users u where lower(u.email) = 'purvichauhan217@gmail.com'
limit 1;

-- legacy appointment_id 946, user email khushiviradiya545@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2025-08-07T12:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-08-06 16:29:35', '2025-08-06 16:29:35'
from auth.users u where lower(u.email) = 'khushiviradiya545@gmail.com'
limit 1;

-- legacy appointment_id 947, user email purvichauhan217@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Ankita Ganguly' limit 1), 'individual', '2025-08-15T17:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'meet.google.com/qmx-qssp-fgh',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-08-12 15:48:33', '2025-08-12 15:48:33'
from auth.users u where lower(u.email) = 'purvichauhan217@gmail.com'
limit 1;

-- legacy appointment_id 948, user email vyasvithika@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Ankita Ganguly' limit 1), 'individual', '2025-08-14T15:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'meet.google.com/pqf-tjyb-feg',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-08-13 17:00:02', '2025-08-13 17:00:02'
from auth.users u where lower(u.email) = 'vyasvithika@gmail.com'
limit 1;

-- legacy appointment_id 949, user email vyasvithika@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Ankita Ganguly' limit 1), 'individual', '2025-08-23T12:00:00', 'cancelled', NULL,
  1000, 1000, 'NEW100', 0, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  '4', '3', '3',
  '2025-08-19 04:54:12', '2025-08-19 04:54:12'
from auth.users u where lower(u.email) = 'vyasvithika@gmail.com'
limit 1;

-- legacy appointment_id 950, user email harshit.sureka@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-08-20T12:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'To join the video meeting, click this link:  https://meet.google.com/xvy-xhft-fih    To join by phone instead, dial (US) +1 918-973-0472 and enter this PIN: 945 813 713#  More numbers: https://t.meet/xvy-xhft-fih',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-08-19 06:42:13', '2025-08-19 06:42:13'
from auth.users u where lower(u.email) = 'harshit.sureka@robrosystems.com'
limit 1;

-- legacy appointment_id 951, user email mohan@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-08-24T13:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/kfd-thns-wms',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-08-23 11:52:06', '2025-08-23 11:52:06'
from auth.users u where lower(u.email) = 'mohan@robrosystems.com'
limit 1;

-- legacy appointment_id 952, user email pooja@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-09-04T16:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/skj-dojx-sdb',
  NULL, NULL, NULL, NULL,
  '5', '4', '4',
  '2025-08-31 04:24:00', '2025-08-31 04:24:00'
from auth.users u where lower(u.email) = 'pooja@robrosystems.com'
limit 1;

-- legacy appointment_id 953, user email saloni@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-09-05T17:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/ghx-mcqi-ntz',
  NULL, NULL, NULL, NULL,
  '3', '4', '3',
  '2025-09-01 04:57:18', '2025-09-01 04:57:18'
from auth.users u where lower(u.email) = 'saloni@robrosystems.com'
limit 1;

-- legacy appointment_id 954, user email sowmya@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-09-02T13:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/ghx-mcqi-ntz',
  NULL, NULL, NULL, NULL,
  '4', '4', '4',
  '2025-09-01 06:33:08', '2025-09-01 06:33:08'
from auth.users u where lower(u.email) = 'sowmya@robrosystems.com'
limit 1;

-- legacy appointment_id 955, user email mohan@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-09-26T18:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/iro-pgkx-myf',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-09-25 10:19:55', '2025-09-25 10:19:55'
from auth.users u where lower(u.email) = 'mohan@robrosystems.com'
limit 1;

-- legacy appointment_id 956, user email reddyshiva1001@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-10-21T12:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/mem-hwzg-zyr',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-10-20 20:19:18', '2025-10-20 20:19:18'
from auth.users u where lower(u.email) = 'reddyshiva1001@gmail.com'
limit 1;

-- legacy appointment_id 957, user email saloni@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-11-01T15:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/mem-hwzg-zyr',
  NULL, NULL, NULL, NULL,
  '5', '5', '5',
  '2025-10-31 09:38:17', '2025-10-31 09:38:17'
from auth.users u where lower(u.email) = 'saloni@robrosystems.com'
limit 1;

-- legacy appointment_id 959, user email harshit.sureka@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-11-01T17:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/hhv-hvxr-ntm',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-01 03:10:36', '2025-11-01 03:10:36'
from auth.users u where lower(u.email) = 'harshit.sureka@robrosystems.com'
limit 1;

-- legacy appointment_id 960, user email paharsharma123@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-11-01T13:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/hjs-aopa-ayb',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-11-01 05:09:12', '2025-11-01 05:09:12'
from auth.users u where lower(u.email) = 'paharsharma123@gmail.com'
limit 1;

-- legacy appointment_id 961, user email pooja@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-11-08T17:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/wwy-ceks-nmw',
  NULL, NULL, NULL, NULL,
  '5', '4', '5',
  '2025-11-03 10:10:50', '2025-11-03 10:10:50'
from auth.users u where lower(u.email) = 'pooja@robrosystems.com'
limit 1;

-- legacy appointment_id 962, user email mohan@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-11-05T18:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/fbv-rork-eaa',
  NULL, NULL, NULL, NULL,
  '5', '4', '4',
  '2025-11-04 14:42:57', '2025-11-04 14:42:57'
from auth.users u where lower(u.email) = 'mohan@robrosystems.com'
limit 1;

-- legacy appointment_id 963, user email sowmya@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-11-20T16:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/skj-dojx-sdb',
  NULL, NULL, NULL, NULL,
  '5', '5', '5',
  '2025-11-07 07:49:02', '2025-11-07 07:49:02'
from auth.users u where lower(u.email) = 'sowmya@robrosystems.com'
limit 1;

-- legacy appointment_id 964, user email paharsharma123@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-12-06T13:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/skj-dojx-sdb',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-06 04:46:09', '2025-12-06 04:46:09'
from auth.users u where lower(u.email) = 'paharsharma123@gmail.com'
limit 1;

-- legacy appointment_id 972, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-12-15T13:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/mgu-tiha-yfp',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-15 03:09:29', '2025-12-15 03:09:29'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 973, user email harshit.sureka@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-12-17T12:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/mgu-tiha-yfp',
  NULL, NULL, NULL, NULL,
  '3', '3', '3',
  '2025-12-16 16:37:30', '2025-12-16 16:37:30'
from auth.users u where lower(u.email) = 'harshit.sureka@robrosystems.com'
limit 1;

-- legacy appointment_id 977, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-12-22T13:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/huo-sjgt-gcn',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-12-20 05:31:43', '2025-12-20 05:31:43'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 978, user email saloni@robrosystems.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2025-12-30T13:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/mgu-tiha-yfp',
  NULL, NULL, NULL, NULL,
  '5', '5', '5',
  '2025-12-25 08:23:47', '2025-12-25 08:23:47'
from auth.users u where lower(u.email) = 'saloni@robrosystems.com'
limit 1;

-- legacy appointment_id 983, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-01-03T18:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/iqt-qjbn-qwz',
  NULL, NULL, NULL, NULL,
  '3', '3', '3',
  '2026-01-03 09:41:58', '2026-01-03 09:41:58'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 984, user email gangradekhushi2214@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-01-05T20:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/iqt-qjbn-qwz',
  NULL, NULL, NULL, NULL,
  '3', '3', '3',
  '2026-01-04 11:40:58', '2026-01-04 11:40:58'
from auth.users u where lower(u.email) = 'gangradekhushi2214@gmail.com'
limit 1;

-- legacy appointment_id 987, user email uatharv5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-01-09T18:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/kbs-knrp-gqs',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-01-09 11:53:39', '2026-01-09 11:53:39'
from auth.users u where lower(u.email) = 'uatharv5@gmail.com'
limit 1;

-- legacy appointment_id 988, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-01-12T12:00:00', 'pending', NULL,
  1000, 0, NULL, 1000, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-01-11 07:08:36', '2026-01-11 07:08:36'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 989, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-01-12T12:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/iqt-qjbn-qwz',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-01-11 07:08:47', '2026-01-11 07:08:47'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 990, user email 07aayshakhan@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-01-25T17:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/iqt-qjbn-qwz',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-01-18 10:01:47', '2026-01-18 10:01:47'
from auth.users u where lower(u.email) = '07aayshakhan@gmail.com'
limit 1;

-- legacy appointment_id 991, user email asmitaparihar1994@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-01-18T18:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/iqt-qjbn-qwz',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-01-18 11:41:26', '2026-01-18 11:41:26'
from auth.users u where lower(u.email) = 'asmitaparihar1994@gmail.com'
limit 1;

-- legacy appointment_id 992, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-01-19T12:00:00', 'pending', NULL,
  1000, 0, NULL, 1000, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-01-18 12:52:25', '2026-01-18 12:52:25'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 993, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-01-19T12:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/iqt-qjbn-qwz',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-01-18 12:52:36', '2026-01-18 12:52:36'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 1004, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-02-17T12:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/kth-azpq-sfz',
  NULL, NULL, NULL, NULL,
  '2', '2', '2',
  '2026-02-16 12:44:35', '2026-02-16 12:44:35'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 1005, user email paharsharma123@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-02-17T14:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/kth-azpq-sfz',
  NULL, NULL, NULL, NULL,
  '3', '3', '3',
  '2026-02-17 07:57:18', '2026-02-17 07:57:18'
from auth.users u where lower(u.email) = 'paharsharma123@gmail.com'
limit 1;

-- legacy appointment_id 1006, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-02-25T12:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/ueg-vikn-uot',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-02-25 04:51:57', '2026-02-25 04:51:57'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 1007, user email aastha1212jain@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-02-25T13:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/ueg-vikn-uot',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-02-25 06:06:53', '2026-02-25 06:06:53'
from auth.users u where lower(u.email) = 'aastha1212jain@gmail.com'
limit 1;

-- legacy appointment_id 1009, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-03-02T11:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/iqt-qjbn-qwz',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-03-02 04:58:56', '2026-03-02 04:58:56'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 1010, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-03-16T11:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/vxx-qaec-pwb',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-03-15 16:21:52', '2026-03-15 16:21:52'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 1011, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-04-07T11:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/qna-cgjg-spj',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-04-06 13:07:57', '2026-04-06 13:07:57'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 1012, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-05-02T13:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/iqt-qjbn-qwz',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-05-02 07:11:14', '2026-05-02 07:11:14'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 1013, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-05-25T19:00:00', 'completed', NULL,
  1000, 500, NULL, 500, 'paid', 'https://meet.google.com/yfn-ybop-zyy',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-05-25 08:41:05', '2026-05-25 08:41:05'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 1014, user email vinijoshi.aiesec@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Harshita Gurbani' limit 1), 'individual', '2026-05-25T19:00:00', 'completed', NULL,
  1000, 500, NULL, 500, 'paid', 'https://meet.google.com/kwb-wemu-sox',
  NULL, NULL, NULL, NULL,
  '2', '3', '3',
  '2026-05-25 12:18:34', '2026-05-25 12:18:34'
from auth.users u where lower(u.email) = 'vinijoshi.aiesec@gmail.com'
limit 1;

-- legacy appointment_id 1015, user email ashmeett247@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-05-28T15:00:00', 'pending', NULL,
  1000, 1000, NULL, 0, 'paid', 'https://meet.google.com/huo-sjgt-gcn',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-05-26 06:18:32', '2026-05-26 06:18:32'
from auth.users u where lower(u.email) = 'ashmeett247@gmail.com'
limit 1;

-- legacy appointment_id 1016, user email ashmeett247@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-05-26T13:00:00', 'completed', NULL,
  1000, 0, NULL, 1000, 'paid', 'https://meet.google.com/iqt-qjbn-qwz',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-05-26 06:57:35', '2026-05-26 06:57:35'
from auth.users u where lower(u.email) = 'ashmeett247@gmail.com'
limit 1;

-- legacy appointment_id 1017, user email gangradeharsh5@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-06-01T12:00:00', 'completed', NULL,
  1000, 500, NULL, 500, 'paid', 'https://meet.google.com/vwf-hrdi-pqk',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-06-01 05:40:50', '2026-06-01 05:40:50'
from auth.users u where lower(u.email) = 'gangradeharsh5@gmail.com'
limit 1;

-- legacy appointment_id 1018, user email ashmeett247@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-06-04T15:00:00', 'pending', NULL,
  1000, 500, NULL, 500, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-06-04 09:09:56', '2026-06-04 09:09:56'
from auth.users u where lower(u.email) = 'ashmeett247@gmail.com'
limit 1;

-- legacy appointment_id 1019, user email dhruvshivhare18@gmail.con
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-06-12T14:00:00', 'pending', NULL,
  1000, 500, NULL, 500, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-06-11 11:09:04', '2026-06-11 11:09:04'
from auth.users u where lower(u.email) = 'dhruvshivhare18@gmail.con'
limit 1;

-- legacy appointment_id 1020, user email dhruvshivhare18@gmail.con
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-06-13T14:00:00', 'pending', NULL,
  1000, 500, NULL, 500, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-06-12 10:28:53', '2026-06-12 10:28:53'
from auth.users u where lower(u.email) = 'dhruvshivhare18@gmail.con'
limit 1;

-- legacy appointment_id 1021, user email ashmeett247@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-06-22T17:00:00', 'completed', NULL,
  1000, 500, NULL, 500, 'paid', 'https://meet.google.com/vwf-hrdi-pqk',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-06-22 11:19:01', '2026-06-22 11:19:01'
from auth.users u where lower(u.email) = 'ashmeett247@gmail.com'
limit 1;

-- legacy appointment_id 1022, user email sinha6128@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Anushka Gaur' limit 1), 'individual', '2026-06-22T21:00:00', 'completed', NULL,
  1000, 500, NULL, 500, 'paid', 'https://meet.google.com/vwf-hrdi-pqk',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-06-22 13:26:37', '2026-06-22 13:26:37'
from auth.users u where lower(u.email) = 'sinha6128@gmail.com'
limit 1;

-- legacy appointment_id 1023, user email priyanshiupadhyay46@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Shivalika Srivastav' limit 1), 'individual', '2026-07-08T12:00:00', 'pending', NULL,
  1000, 1000, NULL, 0, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-07-07 06:51:51', '2026-07-07 06:51:51'
from auth.users u where lower(u.email) = 'priyanshiupadhyay46@gmail.com'
limit 1;

-- legacy appointment_id 1024, user email priyanshiupadhyay46@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Shivalika Srivastav' limit 1), 'individual', '2026-07-08T12:00:00', 'completed', NULL,
  1000, 1000, NULL, 0, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-07-07 06:52:21', '2026-07-07 06:52:21'
from auth.users u where lower(u.email) = 'priyanshiupadhyay46@gmail.com'
limit 1;

-- legacy appointment_id 1025, user email tushaarchoubey@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Shivalika Srivastav' limit 1), 'individual', '2026-07-11T17:00:00', 'completed', NULL,
  1000, 1000, 'Test007', 0, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  '2', '2', '4',
  '2026-07-07 07:27:27', '2026-07-07 07:27:27'
from auth.users u where lower(u.email) = 'tushaarchoubey@gmail.com'
limit 1;

-- legacy appointment_id 1026, user email 123tushar26@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Shivalika Srivastav' limit 1), 'individual', '2026-07-09T12:00:00', 'cancelled', NULL,
  1000, 999, NULL, 1, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-07-09 04:48:41', '2026-07-09 04:48:41'
from auth.users u where lower(u.email) = '123tushar26@gmail.com'
limit 1;

-- legacy appointment_id 1027, user email arshi.dawar0209@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Shivalika Srivastav' limit 1), 'individual', '2026-07-11T18:00:00', 'completed', NULL,
  1000, 500, NULL, 500, 'paid', 'https://meet.google.com/awr-doca-yrm',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-07-10 09:17:42', '2026-07-10 09:17:42'
from auth.users u where lower(u.email) = 'arshi.dawar0209@gmail.com'
limit 1;

-- legacy appointment_id 1030, user email priyanshiupadhyay46@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Shivalika Srivastav' limit 1), 'individual', '2026-07-16T11:00:00', 'completed', NULL,
  1000, 500, NULL, 500, 'paid', 'https://meet.google.com/pfk-kizy-bwb',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-07-16 04:20:07', '2026-07-16 04:20:07'
from auth.users u where lower(u.email) = 'priyanshiupadhyay46@gmail.com'
limit 1;

-- legacy appointment_id 1031, user email arshi.dawar0209@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Shivalika Srivastav' limit 1), 'individual', '2026-07-20T18:00:00', 'completed', NULL,
  1000, 500, NULL, 500, 'paid', 'https://meet.google.com/npq-dhxu-fke',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-07-18 09:09:30', '2026-07-18 09:09:30'
from auth.users u where lower(u.email) = 'arshi.dawar0209@gmail.com'
limit 1;
