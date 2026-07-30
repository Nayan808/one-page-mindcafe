-- Zostel Mumbai ("Zostel  Mumbai", double-space name) is the only active
-- pickup location with zero inventory rows -- every other location has one
-- row per product (Extrovert/Focus/Joy/Rest). Since checkout()'s stock
-- reservation (create_stock_reservation -> available_stock) treats a
-- missing row as 0 available, this location can't complete any takeaway
-- order (main site or /scan-order) until it has rows like everyone else.
-- Seeded at 15 each, matching the typical count at other locations --
-- correct via admin/inventory once real counts are known.
insert into inventory (variant_id, location_id, quantity_available)
select pv.id, pl.id, 15
from product_variants pv
cross join pickup_locations pl
where pl.name = 'Zostel  Mumbai'
on conflict do nothing;
