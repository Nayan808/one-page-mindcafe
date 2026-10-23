-- Order tracking: a timestamped history of every order status change, and
-- a public lookup (order number + phone) for buyers without an account.
--
-- Purely additive — new table, new trigger, new function, and a backfill
-- that only INSERTs into the new table. No existing row is changed or
-- deleted.

-- 1. Status history -------------------------------------------------------

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_events_order_idx
  on public.order_status_events (order_id, created_at);

alter table public.order_status_events enable row level security;

-- Same visibility as the order itself (orders_select): the owner, guest
-- orders (user_id null — looked up by their unguessable id), and admins.
drop policy if exists order_status_events_select on public.order_status_events;
create policy order_status_events_select on public.order_status_events
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_status_events.order_id and (o.user_id = auth.uid() or o.user_id is null)
    )
  );

grant select on public.order_status_events to anon, authenticated;

-- Written only by this trigger (security definer), never by clients.
create or replace function public.log_order_status_event() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_events (order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_order_status_event on public.orders;
create trigger trg_log_order_status_event
  after insert or update of status on public.orders
  for each row execute function public.log_order_status_event();

-- Backfill for orders placed before this existed: "placed" at creation,
-- plus the current status at the last update. Steps in between have no
-- recorded time and show without one. Skips any order that already has
-- events, so re-running this file adds nothing twice.
insert into public.order_status_events (order_id, status, created_at)
select o.id, 'placed', o.created_at
from public.orders o
where not exists (select 1 from public.order_status_events e where e.order_id = o.id);

insert into public.order_status_events (order_id, status, created_at)
select o.id, o.status, o.updated_at
from public.orders o
where o.status <> 'placed'
  and not exists (select 1 from public.order_status_events e where e.order_id = o.id and e.status = o.status);

-- 2. Public lookup ----------------------------------------------------------
--
-- Returns a tracking summary only when the phone matches the order (guest
-- phone, delivery-address phone, or the account's phone). A wrong number
-- and a non-existent order both return null, so it can't be used to probe
-- which orders exist. Deliberately leaves out the buyer's name, address
-- and the pickup collection code.

create or replace function public.track_order(p_order_number text, p_phone text) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_digits text := regexp_replace(coalesce(p_order_number, ''), '\D', '', 'g');
  v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  v_order public.orders%rowtype;
  v_phones text[];
begin
  if v_digits = '' or length(v_phone) <> 10 then
    return null;
  end if;

  select * into v_order from public.orders
  where order_number = 'MC-' || lpad(ltrim(v_digits, '0'), 6, '0');
  if not found then
    return null;
  end if;

  select array_remove(array[
    v_order.guest_phone,
    (select a.phone from public.addresses a where a.id = v_order.address_id),
    (select p.phone from public.profiles p where p.id = v_order.user_id),
    (select u.phone from auth.users u where u.id = v_order.user_id)
  ], null) into v_phones;

  if not exists (
    select 1 from unnest(v_phones) ph
    where right(regexp_replace(ph, '\D', '', 'g'), 10) = v_phone
  ) then
    return null;
  end if;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'fulfillment_type', v_order.fulfillment_type,
    'created_at', v_order.created_at,
    'estimated_delivery', v_order.estimated_delivery,
    'awb_code', v_order.awb_code,
    'tracking_url', v_order.tracking_url,
    'total', v_order.total,
    'pickup_location', (select l.name from public.pickup_locations l where l.id = v_order.location_id),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('name', pr.name, 'quantity', oi.quantity) order by pr.name)
      from public.order_items oi
      join public.product_variants pv on pv.id = oi.variant_id
      join public.products pr on pr.id = pv.product_id
      where oi.order_id = v_order.id
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('status', e.status, 'created_at', e.created_at) order by e.created_at)
      from public.order_status_events e
      where e.order_id = v_order.id
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anon, authenticated;
