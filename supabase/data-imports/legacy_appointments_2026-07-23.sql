-- Historical counselling bookings from the legacy mindcafe.app site.
-- MUST run after legacy_users.json has been imported (import_legacy_users.mjs)
-- — each statement below resolves its owner by email via `from auth.users`
-- (not a hardcoded UUID), and simply inserts nothing (no error) if that
-- email doesn't resolve to a real account, thanks to the `select ... from
-- auth.users where email = ...` + `limit 1` shape — safer than a
-- multi-row VALUES insert, where one bad row would roll back all 40.
--
-- Scope decisions (see chat for full reasoning):
--  - 18 of 58 legacy rows were 'no_book' (abandoned intake, never a real
--    booking) — excluded entirely.
--  - Only psychologist_id 19 (Rupal Sharma) maps to a real imported
--    expert; everything else imports with expert_id = NULL.
--  - Sensitive clinical fields (suicidal thoughts, physical condition,
--    private therapist notes) are NOT imported.
--  - price/total use the site's current standard rate (₹999) as a
--    stand-in — the legacy table didn't carry a reliable per-row amount.

-- legacy appointment_id 429, user email kumarkhushdeep23@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-04-15T10:45:00', 'completed', 'Imagination world get attached to person',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/way-jxia-drb?authuser=0',
  '24', 'Khush', 'Student', 'Imagination world get attached to person',
  '1', '2', '2',
  '2024-04-10 06:36:50', '2024-04-10 06:36:50'
from auth.users u where lower(u.email) = 'kumarkhushdeep23@gmail.com'
limit 1;

-- legacy appointment_id 446, user email kumarkhushdeep23@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-04-22T10:45:00', 'completed', 'Chronically attached to a person emotionally & S*x',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/iry-xcju-uep?authuser=0',
  '24', 'Khush', 'Student', 'Chronically attached to a person emotionally & S*x',
  '4', '3', '4',
  '2024-04-17 14:54:22', '2024-04-17 14:54:22'
from auth.users u where lower(u.email) = 'kumarkhushdeep23@gmail.com'
limit 1;

-- legacy appointment_id 459, user email kumarkhushdeep23@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-05-01T10:45:00', 'completed', 'Subconscious mind',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/ieq-peaq-dnu?authuser=0',
  '24', 'Khush', 'Self employed ', 'Subconscious mind',
  '4', '4', '4',
  '2024-04-24 20:05:23', '2024-04-24 20:05:23'
from auth.users u where lower(u.email) = 'kumarkhushdeep23@gmail.com'
limit 1;

-- legacy appointment_id 479, user email kumarkhushdeep23@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-05-06T10:45:00', 'completed', 'Life totally controlled by subconscious mind',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/fcp-qgyr-uiv?authuser=0',
  '24', 'Khush', 'Student', 'Life totally controlled by subconscious mind',
  '4', '4', '4',
  '2024-05-02 07:55:03', '2024-05-02 07:55:03'
from auth.users u where lower(u.email) = 'kumarkhushdeep23@gmail.com'
limit 1;

-- legacy appointment_id 487, user email palakbhate247@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-05-09T11:30:00', 'completed', 'Anxiety, attacks, overthinking',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/uxb-rrei-min?authuser=0',
  '19', 'She/ Her', 'Student', 'Anxiety, attacks, overthinking',
  '4', '4', '4',
  '2024-05-09 04:48:53', '2024-05-09 04:48:53'
from auth.users u where lower(u.email) = 'palakbhate247@gmail.com'
limit 1;

-- legacy appointment_id 492, user email kumarkhushdeep23@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-05-13T10:45:00', 'completed', 'Obsession with a person',
  999, 0, NULL, 999, 'paid', NULL,
  '24', 'Khush', 'Student', 'Obsession with a person',
  '4', '4', '4',
  '2024-05-10 10:00:15', '2024-05-10 10:00:15'
from auth.users u where lower(u.email) = 'kumarkhushdeep23@gmail.com'
limit 1;

-- legacy appointment_id 517, user email palakbhate247@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-05-16T10:45:00', 'completed', 'Anxiety, attacks, overthinking',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/pqx-iwpk-dhw?authuser=0',
  '19', 'She/ her', 'Student ', 'Anxiety, attacks, overthinking',
  '4', '5', '4',
  '2024-05-15 21:11:40', '2024-05-15 21:11:40'
from auth.users u where lower(u.email) = 'palakbhate247@gmail.com'
limit 1;

-- legacy appointment_id 522, user email ushmi_18@yahoo.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-05-17T12:15:00', 'completed', 'not feeling good about self',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/ekr-bqyp-ums?authuser=0',
  '32', 'Her', 'Service', 'not feeling good about self',
  '2', '2', '2',
  '2024-05-17 05:45:57', '2024-05-17 05:45:57'
from auth.users u where lower(u.email) = 'ushmi_18@yahoo.com'
limit 1;

-- legacy appointment_id 528, user email palakbhate247@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-05-22T10:45:00', 'completed', 'Anxiety, overthinking',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/ece-ycan-jzr?authuser=0',
  '19', 'She/her', 'Student', 'Anxiety, overthinking',
  '2', '4', '3',
  '2024-05-22 02:29:34', '2024-05-22 02:29:34'
from auth.users u where lower(u.email) = 'palakbhate247@gmail.com'
limit 1;

-- legacy appointment_id 533, user email kumarkhushdeep23@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-06-13T09:00:00', 'completed', 'Just check on mental health',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/jhk-ztzd-uvv?authuser=0',
  '24', 'Khush', 'Student', 'Just check on mental health',
  '5', '5', '5',
  '2024-06-11 10:32:16', '2024-06-11 10:32:16'
from auth.users u where lower(u.email) = 'kumarkhushdeep23@gmail.com'
limit 1;

-- legacy appointment_id 537, user email ushmi_18@yahoo.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-06-29T10:45:00', 'completed', 'No self confidence',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/koa-uvkh-qxv?authuser=0',
  '32', 'Her', 'Service', 'No self confidence',
  '2', '4', '2',
  '2024-06-27 15:44:25', '2024-06-27 15:44:25'
from auth.users u where lower(u.email) = 'ushmi_18@yahoo.com'
limit 1;

-- legacy appointment_id 553, user email ushmi_18@yahoo.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-08-07T12:15:00', 'completed', 'No self confidence',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/koa-uvkh-qxv?authuser=0',
  '32', 'Her', 'Service', 'No self confidence',
  '2', '2', '2',
  '2024-08-07 06:09:23', '2024-08-07 06:09:23'
from auth.users u where lower(u.email) = 'ushmi_18@yahoo.com'
limit 1;

-- legacy appointment_id 704, user email gauravjit.kaur@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-08-24T10:45:00', 'cancelled', 'demo',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/xvr-uicf-sty?authuser=0',
  '40', NULL, NULL, 'demo',
  '1', '1', '1',
  '2024-08-20 14:55:42', '2024-08-20 14:55:42'
from auth.users u where lower(u.email) = 'gauravjit.kaur@gmail.com'
limit 1;

-- legacy appointment_id 705, user email jaidipchatterjee@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-08-24T10:00:00', 'completed', 'demo',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/jnr-krzu-vfa?authuser=0',
  '32', NULL, NULL, 'demo',
  '1', '1', '1',
  '2024-08-20 15:55:18', '2024-08-20 15:55:18'
from auth.users u where lower(u.email) = 'jaidipchatterjee@gmail.com'
limit 1;

-- legacy appointment_id 711, user email geet.garg@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-08-23T17:15:00', 'completed', 'Depression',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/bwq-fiev-wfv?authuser=0',
  '44', NULL, NULL, 'Depression',
  '1', '1', '1',
  '2024-08-23 11:00:38', '2024-08-23 11:00:38'
from auth.users u where lower(u.email) = 'geet.garg@gmail.com'
limit 1;

-- legacy appointment_id 740, user email ushmi_18@yahoo.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-09-13T16:00:00', 'completed', 'Fears and negativity',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/uzz-qqif-qnu',
  '32', 'Her', 'Service', 'Fears and negativity',
  '2', '4', '1',
  '2024-09-13 01:12:53', '2024-09-13 01:12:53'
from auth.users u where lower(u.email) = 'ushmi_18@yahoo.com'
limit 1;

-- legacy appointment_id 755, user email geet.garg@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-09-25T19:00:00', 'completed', 'Chronic Depression',
  999, 0, NULL, 999, 'paid', 'Session with Mrs. Geetika Garg  Wednesday, September 25 · 7:00 – 8:00pm Time zone: Asia/Kolkata Google Meet joining info Video call link: https://meet.google.com/qvi-kvec-mtv Or dial: ‪(US) +1 636-707-2171‬ PIN: ‪661 727 492‬# More phone numbers: https://tel.meet/qvi-kvec-mtv?pin=6714968224398',
  '44', 'She', 'Housewife', 'Chronic Depression',
  '1', '1', '1',
  '2024-09-25 11:11:50', '2024-09-25 11:11:50'
from auth.users u where lower(u.email) = 'geet.garg@gmail.com'
limit 1;

-- legacy appointment_id 756, user email surbhigupta31071998@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-09-28T17:00:00', 'completed', 'No',
  999, 0, NULL, 999, 'paid', 'First Consultation call - Ms. Surbhi Gupta Saturday, September 28 · 5:00 – 6:00pm Time zone: Asia/Kolkata Google Meet joining info Video call link: https://meet.google.com/mfy-ipdd-adz Or dial: ‪(US) +1 423-712-0178‬ PIN: ‪421 030 228‬# More phone numbers: https://tel.meet/mfy-ipdd-adz?pin=8699546949639',
  '26', 'MS.', 'Working as Market Research Analyst', 'No',
  '3', '3', '3',
  '2024-09-27 10:54:23', '2024-09-27 10:54:23'
from auth.users u where lower(u.email) = 'surbhigupta31071998@gmail.com'
limit 1;

-- legacy appointment_id 757, user email prk1811225@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-09-29T14:00:00', 'completed', 'Procrastination',
  999, 0, NULL, 999, 'paid', 'First Consultation call - Potluri Rakshit Keshav Sunday, September 29 · 2:00 – 3:00pm Time zone: Asia/Kolkata Google Meet joining info Video call link: https://meet.google.com/ngr-ppbc-bbf Or dial: ‪(US) +1 347-467-6460‬ PIN: ‪247 299 120‬# More phone numbers: https://tel.meet/ngr-ppbc-bbf?pin=7538693484294',
  '24', 'He/Him', 'Senior Process Specialist', 'Procrastination',
  '4', '4', '4',
  '2024-09-27 11:55:12', '2024-09-27 11:55:12'
from auth.users u where lower(u.email) = 'prk1811225@gmail.com'
limit 1;

-- legacy appointment_id 758, user email mansiimoar2002@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-10-06T16:00:00', 'completed', 'Overthinks a lot, not focused at all, anxious',
  999, 0, NULL, 999, 'paid', 'https://tel.meet/bfa-jops-dre?pin=9521009120933',
  '22', 'She/Her', 'Student', 'Overthinks a lot, not focused at all, anxious',
  '4', '4', '4',
  '2024-09-28 09:38:31', '2024-09-28 09:38:31'
from auth.users u where lower(u.email) = 'mansiimoar2002@gmail.com'
limit 1;

-- legacy appointment_id 759, user email mrinalbhatt624@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-10-03T14:00:00', 'cancelled', 'Addiction ,  concentration , sleeping',
  999, 0, NULL, 999, 'paid', 'Initial Consultation - Mrinall Bhatt Thursday, October 10 · 2:00 – 3:00pm Time zone: Asia/Kolkata Google Meet joining info Video call link: https://meet.google.com/ewm-hhtf-nvt Or dial: ‪(US) +1 929-249-4855‬ PIN: ‪811 313 484‬# More phone numbers: https://tel.meet/ewm-hhtf-nvt?pin=4772277544736',
  '23', 'he/him', 'student', 'Addiction ,  concentration , sleeping',
  '3', '4', '3',
  '2024-09-28 09:49:05', '2024-09-28 09:49:05'
from auth.users u where lower(u.email) = 'mrinalbhatt624@gmail.com'
limit 1;

-- legacy appointment_id 763, user email shahv9341@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, NULL, 'individual', '2024-10-09T19:00:00', 'cancelled', NULL,
  999, 0, NULL, 999, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-10-09 11:01:09', '2024-10-09 11:01:09'
from auth.users u where lower(u.email) = 'shahv9341@gmail.com'
limit 1;

-- legacy appointment_id 765, user email alenphilip.ap@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-10-13T14:00:00', 'completed', 'Laziness',
  999, 0, NULL, 999, 'paid', 'Initial Consultation Call - Mr. Alen Phillip Sunday, October 13 · 2:00 – 3:00pm Time zone: Asia/Kolkata Google Meet joining info Video call link: https://meet.google.com/bny-exsz-usi Or dial: ‪(US) +1 541-600-2433‬ PIN: ‪324 527 510‬# More phone numbers: https://tel.meet/bny-exsz-usi?pin=1300505369201',
  '32', 'He', 'Travel agent ', 'Laziness',
  '4', '4', '4',
  '2024-10-11 05:58:47', '2024-10-11 05:58:47'
from auth.users u where lower(u.email) = 'alenphilip.ap@gmail.com'
limit 1;

-- legacy appointment_id 793, user email aniruddhmishra2606@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-11-24T16:00:00', 'cancelled', 'Anxiety and Insomnia',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/xkt-gcuu-spx',
  '28', 'He/Him', 'Private Sector Employee', 'Anxiety and Insomnia',
  '2', '2', '3',
  '2024-11-22 09:45:22', '2024-11-22 09:45:22'
from auth.users u where lower(u.email) = 'aniruddhmishra2606@gmail.com'
limit 1;

-- legacy appointment_id 794, user email iamkhushisharma@yahoo.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-11-23T12:00:00', 'cancelled', 'Unfair life',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/hbv-kjhc-pbk',
  '22', 'Miss', 'Student', 'Unfair life',
  '4', '4', '5',
  '2024-11-22 10:43:11', '2024-11-22 10:43:11'
from auth.users u where lower(u.email) = 'iamkhushisharma@yahoo.com'
limit 1;

-- legacy appointment_id 795, user email khushikitkat19@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-11-26T12:00:00', 'cancelled', 'Grief',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/udu-zmah-zrs ',
  '21', 'Miss', 'Student', 'Grief',
  '4', '4', '4',
  '2024-11-23 07:30:05', '2024-11-23 07:30:05'
from auth.users u where lower(u.email) = 'khushikitkat19@gmail.com'
limit 1;

-- legacy appointment_id 796, user email saurabh1111thakur@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-11-25T13:00:00', 'cancelled', 'Life',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/mpm-eqat-mei ',
  '22', 'I don''t know what I have to write here ', 'Trader', 'Life',
  '5', '3', '5',
  '2024-11-23 11:28:34', '2024-11-23 11:28:34'
from auth.users u where lower(u.email) = 'saurabh1111thakur@gmail.com'
limit 1;

-- legacy appointment_id 797, user email grisapujara1002@icloud.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-11-25T16:00:00', 'cancelled', NULL,
  999, 0, NULL, 999, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2024-11-23 11:48:39', '2024-11-23 11:48:39'
from auth.users u where lower(u.email) = 'grisapujara1002@icloud.com'
limit 1;

-- legacy appointment_id 798, user email happy.rkhl@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-11-23T19:00:00', 'completed', 'none',
  999, 0, NULL, 999, 'paid', ' https://meet.google.com/ecp-hqbs-hey ',
  '24', 'Ravi', 'working professional', 'none',
  '5', '5', '5',
  '2024-11-23 12:50:15', '2024-11-23 12:50:15'
from auth.users u where lower(u.email) = 'happy.rkhl@gmail.com'
limit 1;

-- legacy appointment_id 802, user email kamleshrabde2008@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2024-12-04T21:00:00', 'completed', 'Death thoughts, sleeplessness , rapid heartbeats',
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/cuk-ynkh-spa ',
  '29', 'Kamlesh Rabde', 'Govt servant ', 'Death thoughts, sleeplessness , rapid heartbeats',
  '3', '3', '3',
  '2024-12-04 12:53:46', '2024-12-04 12:53:46'
from auth.users u where lower(u.email) = 'kamleshrabde2008@gmail.com'
limit 1;

-- legacy appointment_id 839, user email ankit.sadani206@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2025-01-16T14:00:00', 'completed', NULL,
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/gaj-sbpy-pag ',
  NULL, NULL, NULL, NULL,
  '2', '2', '2',
  '2025-01-10 04:10:28', '2025-01-10 04:10:28'
from auth.users u where lower(u.email) = 'ankit.sadani206@gmail.com'
limit 1;

-- legacy appointment_id 873, user email ushmi_18@yahoo.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2025-03-01T13:00:00', 'completed', NULL,
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/bax-csep-ych ',
  NULL, NULL, NULL, NULL,
  '3', '5', '2',
  '2025-03-01 03:12:12', '2025-03-01 03:12:12'
from auth.users u where lower(u.email) = 'ushmi_18@yahoo.com'
limit 1;

-- legacy appointment_id 878, user email singlavishal2004@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2025-03-07T20:00:00', 'completed', NULL,
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/jhg-nefp-kyt',
  NULL, NULL, NULL, NULL,
  '1', '2', '2',
  '2025-03-07 13:51:43', '2025-03-07 13:51:43'
from auth.users u where lower(u.email) = 'singlavishal2004@gmail.com'
limit 1;

-- legacy appointment_id 881, user email devanshj897@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2025-03-13T21:00:00', 'cancelled', NULL,
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/rzd-vzcf-dff',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-03-13 14:44:51', '2025-03-13 14:44:51'
from auth.users u where lower(u.email) = 'devanshj897@gmail.com'
limit 1;

-- legacy appointment_id 896, user email aliyahahmed830@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2025-03-27T16:00:00', 'completed', NULL,
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/xce-cdhr-hij ',
  NULL, NULL, NULL, NULL,
  '1', '1', '4',
  '2025-03-22 20:40:01', '2025-03-22 20:40:01'
from auth.users u where lower(u.email) = 'aliyahahmed830@gmail.com'
limit 1;

-- legacy appointment_id 902, user email ekta@mymuse.in
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, NULL, 'individual', '2025-03-24T21:00:00', 'confirmed', NULL,
  999, 0, NULL, 999, 'paid', NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-03-24 11:11:59', '2025-03-24 11:11:59'
from auth.users u where lower(u.email) = 'ekta@mymuse.in'
limit 1;

-- legacy appointment_id 903, user email raja@mymuse.in
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, NULL, 'individual', '2025-03-29T12:00:00', 'completed', NULL,
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/ugd-ndyi-ewc',
  NULL, NULL, NULL, NULL,
  '4', '3', '3',
  '2025-03-24 14:50:39', '2025-03-24 14:50:39'
from auth.users u where lower(u.email) = 'raja@mymuse.in'
limit 1;

-- legacy appointment_id 907, user email saumya@mymuse.in
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, NULL, 'individual', '2025-03-28T13:00:00', 'completed', NULL,
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/ayj-wngr-npd ',
  NULL, NULL, NULL, NULL,
  '3', '3', '2',
  '2025-03-26 12:02:17', '2025-03-26 12:02:17'
from auth.users u where lower(u.email) = 'saumya@mymuse.in'
limit 1;

-- legacy appointment_id 908, user email singlavishal2004@gmail.com
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, (select id from public.experts where name = 'Rupal Sharma' limit 1), 'individual', '2025-03-27T19:00:00', 'completed', NULL,
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/ksd-ctui-tbn ',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2025-03-27 10:18:15', '2025-03-27 10:18:15'
from auth.users u where lower(u.email) = 'singlavishal2004@gmail.com'
limit 1;

-- legacy appointment_id 910, user email swathi@mymuse.in
insert into public.appointments (
  user_id, expert_id, therapy_category, scheduled_at, status, notes,
  price, discount_amount, coupon_code, total, payment_status, meet_link,
  intake_age, intake_pronouns, intake_occupation, intake_description,
  intake_energy_level, intake_comfort_level, intake_self_perception,
  intake_completed_at, created_at
)
select
  u.id, NULL, 'individual', '2025-04-05T21:00:00', 'completed', NULL,
  999, 0, NULL, 999, 'paid', 'https://meet.google.com/rxq-xqry-hag',
  NULL, NULL, NULL, NULL,
  '2', '3', '3',
  NULL, '2025-04-05T21:00:00'
from auth.users u where lower(u.email) = 'swathi@mymuse.in'
limit 1;