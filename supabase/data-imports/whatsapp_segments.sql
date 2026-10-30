-- WhatsApp campaign audiences — READ-ONLY. These are plain SELECTs: they
-- change nothing. Run each one on its own in the Supabase SQL Editor, then
-- use "Download CSV" on the result and upload that file to MSG91's
-- Campaign tool with the matching approved template.
--
-- Phone numbers come out as 12 digits with the 91 country code
-- (e.g. 919876543210), which is the format MSG91 expects. Each person
-- appears once (deduplicated by phone).


-- =====================================================================
-- 1. FEEDBACK — people who received a Feelz Bundle
--    Template category: Utility. Link: https://mindcafe.app/feedback?ref=wa-bundle
--    Only orders that are paid AND delivered/collected (no point asking
--    for feedback on something that hasn't arrived).
-- =====================================================================
with bundle_orders as (
  select distinct on (o.id)
    o.id,
    o.order_number,
    o.created_at,
    o.status,
    coalesce(p.full_name, a.full_name, o.guest_name) as name,
    coalesce(nullif(o.guest_phone, ''), a.phone, p.phone, u.phone) as raw_phone
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  join public.product_variants pv on pv.id = oi.variant_id
  join public.products pr on pr.id = pv.product_id and pr.is_bundle
  left join public.addresses a on a.id = o.address_id
  left join public.profiles p on p.id = o.user_id
  left join auth.users u on u.id = o.user_id
  where o.payment_status = 'paid'
    and o.status in ('delivered', 'picked_up')
),
cleaned as (
  select *, right(regexp_replace(coalesce(raw_phone, ''), '\D', '', 'g'), 10) as phone10
  from bundle_orders
)
select distinct on (phone10)
  '91' || phone10                      as phone,
  coalesce(nullif(split_part(trim(name), ' ', 1), ''), 'there') as first_name,
  order_number,
  to_char(created_at at time zone 'Asia/Kolkata', 'DD Mon YYYY') as ordered_on
from cleaned
where phone10 ~ '^[6-9][0-9]{9}$'
order by phone10, created_at desc;


-- =====================================================================
-- 2. DIWALI OFFER — signed up with a phone number, never bought anything
--    Template category: Marketing (needs opt-in — see notes below).
--    "Never bought" = no paid Feelz order AND no paid counselling session.
--    Staff/admin/expert accounts are excluded.
-- =====================================================================
with phone_users as (
  select
    u.id,
    u.created_at,
    coalesce(p.full_name, '') as name,
    right(regexp_replace(coalesce(nullif(u.phone, ''), p.phone, ''), '\D', '', 'g'), 10) as phone10
  from auth.users u
  left join public.profiles p on p.id = u.id
  where coalesce(p.role::text, 'customer') = 'customer'
)
select distinct on (pu.phone10)
  '91' || pu.phone10                   as phone,
  coalesce(nullif(split_part(trim(pu.name), ' ', 1), ''), 'there') as first_name,
  to_char(pu.created_at at time zone 'Asia/Kolkata', 'DD Mon YYYY') as joined_on
from phone_users pu
where pu.phone10 ~ '^[6-9][0-9]{9}$'
  and not exists (
    select 1 from public.orders o
    where o.user_id = pu.id and o.payment_status = 'paid'
  )
  and not exists (
    select 1 from public.appointments ap
    where ap.user_id = pu.id and ap.payment_status = 'paid'
  )
order by pu.phone10, pu.created_at desc;
