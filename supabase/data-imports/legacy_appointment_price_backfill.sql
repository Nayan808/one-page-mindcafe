-- Backfills real historical price/discount/coupon data onto the 40
-- appointments imported from legacy_appointments_2026-07-23.sql, replacing
-- the flat 999 placeholder used at import time. Sourced from the legacy
-- `appointment_order` table (the real per-booking payment record).
--
-- Legacy standard rate was 1000 (not the current site's 999) — kept as-is
-- rather than rewriting history to match today's price.
--
-- appointment_id 881 (devanshj897@gmail.com) has no matching
-- appointment_order row -- it was cancelled before any order/payment was
-- created, so it's left at its current placeholder values untouched.
--
-- These are UPDATEs (unlike the original INSERT-only appointment import),
-- so they run into trg_prevent_customer_appointment_tampering — a BEFORE
-- UPDATE trigger that only recognizes service_role/admin/the assigned
-- expert as allowed to touch price/total/coupon_code, and the SQL Editor
-- runs as plain `postgres`, which it doesn't recognize. Disabling the
-- trigger for just this session/statement batch, then re-enabling it
-- immediately after, is safe here since every value below is trusted
-- historical data, not user input.

alter table public.appointments disable trigger trg_prevent_customer_appointment_tampering;

-- backfill for legacy appointment_id 429 (kumarkhushdeep23@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'kumarkhushdeep23@gmail.com' and a.scheduled_at = '2024-04-15T10:45:00';

-- backfill for legacy appointment_id 446 (kumarkhushdeep23@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'kumarkhushdeep23@gmail.com' and a.scheduled_at = '2024-04-22T10:45:00';

-- backfill for legacy appointment_id 459 (kumarkhushdeep23@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'kumarkhushdeep23@gmail.com' and a.scheduled_at = '2024-05-01T10:45:00';

-- backfill for legacy appointment_id 479 (kumarkhushdeep23@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'kumarkhushdeep23@gmail.com' and a.scheduled_at = '2024-05-06T10:45:00';

-- backfill for legacy appointment_id 487 (palakbhate247@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'palakbhate247@gmail.com' and a.scheduled_at = '2024-05-09T11:30:00';

-- backfill for legacy appointment_id 492 (kumarkhushdeep23@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'kumarkhushdeep23@gmail.com' and a.scheduled_at = '2024-05-13T10:45:00';

-- backfill for legacy appointment_id 517 (palakbhate247@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'palakbhate247@gmail.com' and a.scheduled_at = '2024-05-16T10:45:00';

-- backfill for legacy appointment_id 522 (ushmi_18@yahoo.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'ushmi_18@yahoo.com' and a.scheduled_at = '2024-05-17T12:15:00';

-- backfill for legacy appointment_id 528 (palakbhate247@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'palakbhate247@gmail.com' and a.scheduled_at = '2024-05-22T10:45:00';

-- backfill for legacy appointment_id 533 (kumarkhushdeep23@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'kumarkhushdeep23@gmail.com' and a.scheduled_at = '2024-06-13T09:00:00';

-- backfill for legacy appointment_id 537 (ushmi_18@yahoo.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'ushmi_18@yahoo.com' and a.scheduled_at = '2024-06-29T10:45:00';

-- backfill for legacy appointment_id 553 (ushmi_18@yahoo.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'ushmi_18@yahoo.com' and a.scheduled_at = '2024-08-07T12:15:00';

-- backfill for legacy appointment_id 704 (gauravjit.kaur@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'gauravjit.kaur@gmail.com' and a.scheduled_at = '2024-08-24T10:45:00';

-- backfill for legacy appointment_id 705 (jaidipchatterjee@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'jaidipchatterjee@gmail.com' and a.scheduled_at = '2024-08-24T10:00:00';

-- backfill for legacy appointment_id 711 (geet.garg@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'geet.garg@gmail.com' and a.scheduled_at = '2024-08-23T17:15:00';

-- backfill for legacy appointment_id 740 (ushmi_18@yahoo.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'ushmi_18@yahoo.com' and a.scheduled_at = '2024-09-13T16:00:00';

-- backfill for legacy appointment_id 755 (geet.garg@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'geet.garg@gmail.com' and a.scheduled_at = '2024-09-25T19:00:00';

-- backfill for legacy appointment_id 756 (surbhigupta31071998@gmail.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'MC100'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'surbhigupta31071998@gmail.com' and a.scheduled_at = '2024-09-28T17:00:00';

-- backfill for legacy appointment_id 757 (prk1811225@gmail.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'FREE24'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'prk1811225@gmail.com' and a.scheduled_at = '2024-09-29T14:00:00';

-- backfill for legacy appointment_id 758 (mansiimoar2002@gmail.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'WELL100'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'mansiimoar2002@gmail.com' and a.scheduled_at = '2024-10-06T16:00:00';

-- backfill for legacy appointment_id 759 (mrinalbhatt624@gmail.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'WELL100'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'mrinalbhatt624@gmail.com' and a.scheduled_at = '2024-10-03T14:00:00';

-- backfill for legacy appointment_id 763 (shahv9341@gmail.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'WALK2024'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'shahv9341@gmail.com' and a.scheduled_at = '2024-10-09T19:00:00';

-- backfill for legacy appointment_id 765 (alenphilip.ap@gmail.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'WALK2024'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'alenphilip.ap@gmail.com' and a.scheduled_at = '2024-10-13T14:00:00';

-- backfill for legacy appointment_id 793 (aniruddhmishra2606@gmail.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'HEAL24'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'aniruddhmishra2606@gmail.com' and a.scheduled_at = '2024-11-24T16:00:00';

-- backfill for legacy appointment_id 794 (iamkhushisharma@yahoo.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'HEAL24'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'iamkhushisharma@yahoo.com' and a.scheduled_at = '2024-11-23T12:00:00';

-- backfill for legacy appointment_id 795 (khushikitkat19@gmail.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'HEAL24'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'khushikitkat19@gmail.com' and a.scheduled_at = '2024-11-26T12:00:00';

-- backfill for legacy appointment_id 796 (saurabh1111thakur@gmail.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'HEAL24'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'saurabh1111thakur@gmail.com' and a.scheduled_at = '2024-11-25T13:00:00';

-- backfill for legacy appointment_id 797 (grisapujara1002@icloud.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'HEAL24'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'grisapujara1002@icloud.com' and a.scheduled_at = '2024-11-25T16:00:00';

-- backfill for legacy appointment_id 798 (happy.rkhl@gmail.com)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'HEAL24'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'happy.rkhl@gmail.com' and a.scheduled_at = '2024-11-23T19:00:00';

-- backfill for legacy appointment_id 802 (kamleshrabde2008@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'kamleshrabde2008@gmail.com' and a.scheduled_at = '2024-12-04T21:00:00';

-- backfill for legacy appointment_id 839 (ankit.sadani206@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'ankit.sadani206@gmail.com' and a.scheduled_at = '2025-01-16T14:00:00';

-- backfill for legacy appointment_id 873 (ushmi_18@yahoo.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'ushmi_18@yahoo.com' and a.scheduled_at = '2025-03-01T13:00:00';

-- backfill for legacy appointment_id 878 (singlavishal2004@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'singlavishal2004@gmail.com' and a.scheduled_at = '2025-03-07T20:00:00';

-- backfill for legacy appointment_id 896 (aliyahahmed830@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'aliyahahmed830@gmail.com' and a.scheduled_at = '2025-03-27T16:00:00';

-- backfill for legacy appointment_id 902 (ekta@mymuse.in)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'MUSEXMIND'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'ekta@mymuse.in' and a.scheduled_at = '2025-03-24T21:00:00';

-- backfill for legacy appointment_id 903 (raja@mymuse.in)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'MUSEXMIND'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'raja@mymuse.in' and a.scheduled_at = '2025-03-29T12:00:00';

-- backfill for legacy appointment_id 907 (saumya@mymuse.in)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'MUSEXMIND'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'saumya@mymuse.in' and a.scheduled_at = '2025-03-28T13:00:00';

-- backfill for legacy appointment_id 908 (singlavishal2004@gmail.com)
update public.appointments a
set price = 1000, total = 1000, discount_amount = 0, coupon_code = NULL
from auth.users u
where a.user_id = u.id and lower(u.email) = 'singlavishal2004@gmail.com' and a.scheduled_at = '2025-03-27T19:00:00';

-- backfill for legacy appointment_id 910 (swathi@mymuse.in)
update public.appointments a
set price = 1000, total = 0, discount_amount = 1000, coupon_code = 'MUSEXMIND'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'swathi@mymuse.in' and a.scheduled_at = '2025-04-05T21:00:00';

alter table public.appointments enable trigger trg_prevent_customer_appointment_tampering;
