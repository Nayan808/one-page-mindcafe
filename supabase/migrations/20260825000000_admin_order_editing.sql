-- Admin order editing: pickup location/slot, payment status, notes, and
-- guest delivery address are plain columns already covered by the
-- existing orders_admin_update RLS policy — no new SQL needed for those,
-- the admin panel just calls a normal .update() for them.
--
-- Two things do need a security-definer RPC:
--   1. order_items has no RLS update/delete policy at all (line items are
--      meant to be an immutable purchase record, except from here), and
--      changing a line's quantity must also atomically adjust
--      inventory.quantity_available and recompute orders.subtotal/total.
--   2. Cancelling an order must restock every line's quantity back to
--      inventory — but only once, and only for orders whose stock was
--      actually taken in the first place.

-- ---------------------------------------------------------------------
-- admin_cancel_order: sets an order to 'cancelled' and restocks its
-- items. Stock is decremented exactly once, the moment an order leaves
-- 'placed' (see confirm_order_and_decrement_stock / confirm_cash_order),
-- so any order NOT currently in 'placed' has had its stock taken and
-- needs it back. Idempotent — cancelling an already-cancelled order is a
-- no-op, not a double restock.
-- ---------------------------------------------------------------------
create or replace function public.admin_cancel_order(p_order_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND: %', p_order_id;
  end if;

  if v_order.status = 'cancelled' then
    return;
  end if;

  if v_order.status <> 'placed' then
    for v_item in select variant_id, quantity from order_items where order_id = p_order_id loop
      update inventory
        set quantity_available = quantity_available + v_item.quantity, updated_at = now()
        where variant_id = v_item.variant_id
          and location_id is not distinct from v_order.location_id;
    end loop;
  end if;

  update orders set status = 'cancelled', updated_at = now() where id = p_order_id;
end;
$$;

revoke execute on function public.admin_cancel_order(uuid) from public;
grant execute on function public.admin_cancel_order(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- admin_set_order_item_quantity: changes one order line's quantity (0
-- deletes the line entirely), reconciling inventory if this order's
-- stock was already decremented (status past 'placed'), and recomputing
-- orders.subtotal/total to match. Blocked on a cancelled order — its
-- stock was already restocked by admin_cancel_order, so there's nothing
-- consistent left to reconcile against.
-- ---------------------------------------------------------------------
create or replace function public.admin_set_order_item_quantity(
  p_order_id uuid,
  p_item_id uuid,
  p_new_quantity integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_delta integer;
  v_updated integer;
  v_subtotal numeric(10, 2);
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if p_new_quantity < 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND: %', p_order_id;
  end if;
  if v_order.status = 'cancelled' then
    raise exception 'ORDER_CANCELLED';
  end if;

  select * into v_item from order_items where id = p_item_id and order_id = p_order_id;
  if not found then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  v_delta := p_new_quantity - v_item.quantity;

  -- Stock only needs to move if this order has already had it taken
  -- (anything past 'placed') — a still-'placed' order's items were never
  -- decremented yet, so editing them here is just an order-content edit.
  if v_delta <> 0 and v_order.status <> 'placed' then
    if v_delta > 0 then
      update inventory
        set quantity_available = quantity_available - v_delta, updated_at = now()
        where variant_id = v_item.variant_id
          and location_id is not distinct from v_order.location_id
          and quantity_available >= v_delta;
      get diagnostics v_updated = row_count;
      if v_updated = 0 then
        raise exception 'INSUFFICIENT_STOCK';
      end if;
    else
      update inventory
        set quantity_available = quantity_available - v_delta, updated_at = now()
        where variant_id = v_item.variant_id
          and location_id is not distinct from v_order.location_id;
    end if;
  end if;

  if p_new_quantity = 0 then
    delete from order_items where id = p_item_id;
  else
    update order_items set quantity = p_new_quantity where id = p_item_id;
  end if;

  select coalesce(sum(quantity * unit_price), 0) into v_subtotal
    from order_items where order_id = p_order_id;

  update orders
    set subtotal = v_subtotal,
        total = greatest(v_subtotal + delivery_fee - discount_amount, 0),
        updated_at = now()
    where id = p_order_id;
end;
$$;

revoke execute on function public.admin_set_order_item_quantity(uuid, uuid, integer) from public;
grant execute on function public.admin_set_order_item_quantity(uuid, uuid, integer) to authenticated;
