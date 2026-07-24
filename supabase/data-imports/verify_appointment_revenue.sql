-- Checks whether the legacy appointment import + price backfill actually
-- landed correctly: total count, how many still have the old flat-999
-- placeholder vs the real backfilled amounts, and total revenue from paid
-- appointments.
select
  count(*) as total_appointments,
  count(*) filter (where total = 999) as still_placeholder_999,
  count(*) filter (where total = 1000) as backfilled_full_1000,
  count(*) filter (where total = 0) as backfilled_free_coupon,
  count(*) filter (where payment_status = 'paid') as paid_count,
  sum(total) filter (where payment_status = 'paid') as paid_revenue_total
from public.appointments;
