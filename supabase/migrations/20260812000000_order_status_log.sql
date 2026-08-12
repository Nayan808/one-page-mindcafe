-- Order status history/log, specifically for tracking staff-side pickup
-- actions (the "Zostel Staff End" request) — records who, at which
-- location, changed an order's status, and when. Every write to this
-- table happens server-side (security definer function / edge function),
-- never from the client directly, so it can't be spoofed or skipped.
--
-- Review this file before running it. Apply via the Supabase SQL editor,
-- or `supabase db push` if you're using the CLI locally.

create table if not exists public.order_status_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  location_id uuid references public.pickup_locations(id) on delete set null,
  old_status text,
  new_status text not null,
  changed_by text not null default 'staff', -- 'staff' (this migration's scope) or 'admin', for when/if the admin panel's own status changes get logged here too
  created_at timestamptz not null default now()
);

create index if not exists order_status_log_order_id_idx on public.order_status_log(order_id);
create index if not exists order_status_log_location_id_idx on public.order_status_log(location_id);

alter table public.order_status_log enable row level security;

-- Read-only for admins (the log viewer you'll want to build lives in
-- /admin), writes only ever happen via mark_order_collected below
-- (security definer, so RLS doesn't block its own inserts).
create policy "order_status_log_admin_select" on public.order_status_log
  for select using (public.is_admin());

-- Extends the existing mark_order_collected function (defined in
-- supabase/setup.sql) with a log insert. This REPLACES that function —
-- the body is identical except for the new insert right before the
-- update, so behavior for the staff dashboard doesn't otherwise change.
create or replace function public.mark_order_collected(p_order_id uuid) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND: %', p_order_id;
  end if;

  if v_order.fulfillment_type <> 'takeaway' then
    raise exception 'NOT_A_PICKUP_ORDER';
  end if;

  if v_order.status = 'picked_up' then
    return 'already_collected';
  end if;

  if v_order.status <> 'ready_for_pickup' then
    raise exception 'ORDER_NOT_READY: status is %', v_order.status;
  end if;

  insert into public.order_status_log (order_id, location_id, old_status, new_status, changed_by)
    values (p_order_id, v_order.location_id, v_order.status, 'picked_up', 'staff');

  update orders
    set status = 'picked_up', pickup_code_collected_at = now(), updated_at = now()
    where id = p_order_id;

  return 'collected';
end;
$$;

revoke execute on function public.mark_order_collected(uuid) from public;
