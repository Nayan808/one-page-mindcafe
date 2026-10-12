-- Seeds the always-on BUNDLE20 coupon — a flat ₹211 off, auto-applied
-- client-side (see FulfillmentAndPayment.tsx's eligibleAutoCode) whenever
-- the cart holds one of each of the four real moods (the "bundle" option
-- on FeelzProductPageContent.tsx), no code entry needed from the customer.
-- Fixed amount rather than a percent, because the bundle is marketed as a
-- flat ₹949 price (FEELZ_BUNDLE_PRICE in moodStyles.ts), not a 20%-off
-- deal: at today's ₹290/sachet catalog price, 4 × ₹290 − ₹949 = ₹211.
--
-- min_order_amount = 1160 (four packs' worth) because create-order only
-- enforces the coupons-table rules, not cart composition, and the code
-- name is visible at checkout — with no minimum, typing BUNDLE20 on a
-- single ₹290 pack would charge ₹79. At ₹1,160+ the worst case is ₹95
-- more off than the standard 2+ packs 10% (which overtakes it above
-- ₹2,110 anyway). If the per-sachet price changes, update both values.
-- Pure data insert, idempotent, same pattern as the FREESHIP seed in
-- 20260817000000_free_delivery_coupon_type.sql.
insert into public.coupons (code, discount_type, discount_value, min_order_amount, is_active)
values ('BUNDLE20', 'fixed', 211, 1160, true)
on conflict (code) do nothing;
