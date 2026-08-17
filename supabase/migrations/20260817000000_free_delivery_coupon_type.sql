-- Adds a "free_delivery" coupon type. Unlike percent/fixed (which
-- discount the subtotal), this waives the delivery fee entirely —
-- create-order looks this coupon up automatically for every delivery
-- order (see FREE_DELIVERY_COUPON_CODE), no code entry from the
-- customer needed. Also seeds the always-on FREESHIP coupon itself.
alter table public.coupons drop constraint if exists coupons_discount_type_check;
alter table public.coupons add constraint coupons_discount_type_check
  check (discount_type in ('percent', 'fixed', 'free_delivery'));

-- free_delivery doesn't use discount_value (there's no dollar amount to
-- store — it just zeroes the delivery fee), so 0 needs to be allowed.
alter table public.coupons drop constraint if exists coupons_discount_value_check;
alter table public.coupons add constraint coupons_discount_value_check
  check (discount_value >= 0);

insert into public.coupons (code, discount_type, discount_value, min_order_amount, is_active)
values ('FREESHIP', 'free_delivery', 0, 0, true)
on conflict (code) do nothing;
