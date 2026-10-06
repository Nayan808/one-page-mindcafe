-- Seeds the always-on BUNDLE20 coupon — a flat ₹211 off, auto-applied
-- client-side (see FulfillmentAndPayment.tsx's eligibleAutoCode) whenever
-- the cart holds one of each of the four real moods (the "bundle" option
-- on FeelzProductPageContent.tsx), no code entry needed from the customer.
-- Fixed amount rather than a percent, because the bundle is marketed as a
-- flat ₹949 price (FEELZ_BUNDLE_PRICE in moodStyles.ts), not a 20%-off
-- deal: at today's ₹290/sachet catalog price, 4 × ₹290 − ₹949 = ₹211. If
-- the per-sachet catalog price ever changes, this value needs updating by
-- hand to keep the bundle landing at exactly ₹949 — it does not recompute
-- itself. Pure data insert, same idempotent pattern as the FREESHIP seed
-- in 20260817000000_free_delivery_coupon_type.sql — no schema change, and
-- safe to re-run.
insert into public.coupons (code, discount_type, discount_value, min_order_amount, is_active)
values ('BUNDLE20', 'fixed', 211, 0, true)
on conflict (code) do nothing;
