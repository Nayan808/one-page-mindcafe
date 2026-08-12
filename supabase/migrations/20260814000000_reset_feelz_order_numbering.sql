-- Restarts Feelz order numbering from MC-000001.
--
-- Every row in public.orders is a Feelz product order (counselling
-- bookings live in public.appointments and are numbered separately), so
-- the single orders_order_number_seq *is* the Feelz counter -- there's no
-- per-product-line split to make here.
--
-- DESTRUCTIVE, and deliberately so: order_number carries a UNIQUE
-- constraint, so simply restarting the sequence while MC-000001.. are
-- still occupied would make the next checkout fail on a duplicate key.
-- Clearing the table first is what makes "start counting from 1" actually
-- hold for the next real order. This is intended to run once, against a
-- database whose orders are test data only.
--
-- Cascades: order_items and order_status_log are both
-- `on delete cascade` on orders(id), so they clear with it. Nothing else
-- references orders -- inventory_transactions is an independent manual
-- ledger keyed on variant_id, and is left untouched on purpose.
--
-- NOT reversed here: stock. Confirmed orders decremented
-- inventory.quantity_available (see _decrement_stock_for_order), and
-- deleting the order rows does not add those units back. Restoring them
-- is a stock-count decision, not a numbering one, and this project's
-- standing rule is that quantity_available is never silently rewritten --
-- so re-set opening stock in /admin/inventory if those test orders
-- consumed real units.

delete from public.orders;

alter sequence public.orders_order_number_seq restart with 1;
