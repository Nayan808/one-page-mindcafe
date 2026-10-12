-- The Feelz Bundle becomes its own product: one cart line, one order
-- line, a flat ₹949, and its own stock count (pre-packed bundle boxes,
-- managed at /admin/inventory like any other variant). It replaces the
-- old "one of each mood in the cart" approach, where four separate packs
-- were discounted down to ₹949 by the auto-applied BUNDLE20 coupon.
--
-- products.is_bundle is what create-order (and the storefront) use to
-- keep the bundle out of the automatic "10% off when your non-bundle
-- items reach ₹300" discount — the bundle is always exactly its price.
--
-- MUST run before deploying the matching create-order function, which
-- selects products.is_bundle. Idempotent; safe to re-run.

alter table public.products
  add column if not exists is_bundle boolean not null default false;

insert into public.products (name, slug, description, price, is_active, is_bundle)
values (
  'Feelz Bundle',
  'bundle',
  'One pack of each mood — Extrovert, Focus, Joy and Rest. 40 strips.',
  949.00,
  true,
  true
)
on conflict (slug) do update set is_bundle = true;

-- Shipping weight/dimensions start as 4× a single mood pack's (when one is
-- set) so Shiprocket rates a bundle as roughly four packs; adjust in admin
-- if the real bundle box differs.
insert into public.product_variants (product_id, variant_label, sku, weight_grams)
select
  p.id,
  'Bundle (4 × 10 pack)',
  'bundle-4x10',
  (select max(v.weight_grams) * 4 from public.product_variants v where v.sku = 'focus-sachet-10')
from public.products p
where p.slug = 'bundle'
on conflict (sku) do nothing;

-- Separate stock, starting at 0 everywhere: the bundle stays "out of
-- stock" until real bundle stock is entered at /admin/inventory, rather
-- than overselling boxes that don't exist yet. One central (delivery)
-- row plus one per pickup location, matching every other variant.
insert into public.inventory (variant_id, location_id, quantity_available)
select v.id, null, 0
from public.product_variants v
where v.sku = 'bundle-4x10'
on conflict do nothing;

insert into public.inventory (variant_id, location_id, quantity_available)
select v.id, l.id, 0
from public.product_variants v
cross join public.pickup_locations l
where v.sku = 'bundle-4x10'
on conflict do nothing;

-- Retired: the bundle is priced by its own product row now. Left in place
-- (not deleted) so past orders that used it still reference a real code.
update public.coupons set is_active = false where code = 'BUNDLE20';
