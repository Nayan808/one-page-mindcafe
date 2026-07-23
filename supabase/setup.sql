-- ==========================================================
-- Feelz / one-page-mindcafe — full database bootstrap
-- ==========================================================
-- One-shot setup script: paste this whole file into the Supabase
-- SQL editor (or run `psql` against a fresh project) and run it
-- once. It builds the entire schema, functions, RLS policies, dev
-- seed data, and enables Realtime on every table, in the same
-- order as the numbered migrations this was generated from.
--
-- Safe to re-run on the SAME project it was already run on — every
-- statement is genuinely idempotent: CREATE TABLE/INDEX/SEQUENCE all use
-- IF NOT EXISTS, triggers use CREATE OR REPLACE TRIGGER (Postgres 14+),
-- every policy is preceded by a matching DROP POLICY IF EXISTS, ALTER
-- TABLE ... ADD COLUMN uses IF NOT EXISTS, the two ALTER TABLE ... ADD
-- CONSTRAINT statements are preceded by DROP CONSTRAINT IF EXISTS, seed
-- inserts use ON CONFLICT DO NOTHING, and the Realtime block checks
-- pg_publication_tables before adding each table. Only run this against a
-- project you want this exact schema in — it is not meant to be layered
-- onto an unrelated existing database.
-- ==========================================================

-- ---- from migrations/0001_extensions.sql ----
-- Extensions required across the schema.
create extension if not exists pgcrypto with schema extensions;

-- ---- from migrations/0002_profiles.sql ----
-- Extends Supabase's built-in auth.users with app-level profile data.
-- A row is auto-created for every new auth user by the handle_new_user()
-- trigger in 0027_functions_profile_trigger.sql — never insert here manually.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  gender text,
  auth_provider text not null default 'email' check (auth_provider in ('email', 'google')),
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'expert', 'employer', 'admin', 'super_admin')),
  created_at timestamptz not null default now()
);

-- Loosens an already-deployed database's role check constraint to match
-- the above (adds 'super_admin') — idempotent, safe to re-run.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'expert', 'employer', 'admin', 'super_admin'));

comment on table public.profiles is 'App-level profile extending auth.users. role=admin/super_admin can only be set manually (see AUTH_AND_ROLES.md) or by admin-create-expert for role=expert. super_admin is a superset of admin (see is_admin()/is_super_admin()) that additionally can change anyone''s role — plain admin cannot change roles at all, see prevent_role_self_escalation().';

-- ---- from migrations/0003_products.sql ----
-- One row per Feelz product line (Focus, Joy, Extrovert, Rest, ...).
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_is_active_idx on public.products (is_active);

-- ---- from migrations/0004_product_variants.sql ----
-- Pack sizes within a product (sachet / tin / bundle).
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_label text not null,
  price_override numeric(10, 2) check (price_override >= 0),
  sku text unique,
  created_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

-- ---- from migrations/0005_pickup_locations.sql ----
-- Physical pickup points (Zostel branches today, future retail).
create table if not exists public.pickup_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  lat double precision,
  lng double precision,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists pickup_locations_city_idx on public.pickup_locations (city);

-- ---- from migrations/0006_inventory.sql ----
-- Stock count per variant, per location. location_id = null means the
-- central warehouse used for delivery orders.
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  location_id uuid references public.pickup_locations (id) on delete cascade,
  quantity_available integer not null default 0 check (quantity_available >= 0),
  updated_at timestamptz not null default now()
);

-- Postgres treats multiple NULLs as distinct under a plain unique constraint,
-- so the "one central-warehouse row per variant" rule needs a partial index.
create unique index if not exists inventory_variant_central_uidx on public.inventory (variant_id) where location_id is null;
create unique index if not exists inventory_variant_location_uidx on public.inventory (variant_id, location_id) where location_id is not null;

-- ---- from migrations/0007_serviceable_pincodes.sql ----
-- Which pincodes can currently receive delivery, and at what fee.
create table if not exists public.serviceable_pincodes (
  id uuid primary key default gen_random_uuid(),
  pincode text not null unique,
  city text not null,
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  free_delivery_threshold numeric(10, 2),
  created_at timestamptz not null default now()
);

-- ---- from migrations/0008_addresses.sql ----
-- Saved delivery addresses per user.
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  landmark text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on public.addresses (user_id);

-- ---- from migrations/0009_carts.sql ----
-- One active cart per user (or per guest session_id). Guest carts have no
-- user_id; they merge into the user's cart via the merge-guest-cart Edge
-- Function right after login. session_id is a client-generated UUID
-- stored in a cookie.
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  session_id uuid,
  status text not null default 'active' check (status in ('active', 'merged', 'abandoned', 'converted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (user_id is not null or session_id is not null)
);

create unique index if not exists carts_user_active_uidx on public.carts (user_id) where status = 'active' and user_id is not null;
create unique index if not exists carts_session_active_uidx on public.carts (session_id) where status = 'active' and session_id is not null;

-- ---- from migrations/0010_cart_items.sql ----
-- Line items within a cart.
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);

-- ---- from migrations/0011_stock_reservations.sql ----
-- Short-lived soft-hold on stock during checkout. Does NOT touch
-- inventory.quantity_available directly — available_stock() subtracts live
-- reservations from real stock at read time. Expires automatically; cleaned
-- up every 5 minutes by the cleanup-reservations Edge Function calling
-- expire_stock_reservations() (see 0026_functions_stock.sql).
create table if not exists public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  location_id uuid references public.pickup_locations (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists stock_reservations_variant_location_idx on public.stock_reservations (variant_id, location_id, expires_at);
create index if not exists stock_reservations_cart_id_idx on public.stock_reservations (cart_id);

-- ---- from migrations/0012_orders.sql ----
-- A placed order. payment_method/shiprocket_* columns are folded in here
-- rather than a separate migration per the plan.
--
-- Stock-safety rule (non-negotiable, see 0026_functions_stock.sql):
-- stock is only ever decremented when an order reaches status='confirmed',
-- either via the Razorpay payment webhook or, for cash_on_pickup orders,
-- immediately at placement. Never at add-to-cart or checkout start.
create sequence if not exists public.orders_order_number_seq;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  -- the cart this order was placed from; used to clean up its stock_reservations
  -- once the order is confirmed or cancelled (see 0026_functions_stock.sql)
  source_cart_id uuid references public.carts (id) on delete set null,
  fulfillment_type text not null check (fulfillment_type in ('delivery', 'takeaway')),
  address_id uuid references public.addresses (id) on delete set null,
  location_id uuid references public.pickup_locations (id) on delete set null,
  pickup_slot text,
  status text not null default 'placed' check (
    status in ('placed', 'confirmed', 'packed', 'ready_for_pickup', 'picked_up', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')
  ),
  payment_method text not null check (payment_method in ('razorpay', 'cash_on_pickup')),
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'pending_cash', 'paid', 'refund_required', 'refunded', 'failed')
  ),
  payment_ref text,
  razorpay_order_id text,
  -- populated only for fulfillment_type='delivery' once create-shiprocket-shipment runs
  shiprocket_order_id text,
  shiprocket_shipment_id text,
  awb_code text,
  tracking_url text,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_delivery_needs_address check (fulfillment_type <> 'delivery' or address_id is not null),
  constraint orders_takeaway_needs_location check (fulfillment_type <> 'takeaway' or location_id is not null)
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);

create or replace function public.set_order_number() returns trigger
language plpgsql as $$
begin
  if new.order_number is null then
    new.order_number := 'MC-' || lpad(nextval('public.orders_order_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create or replace trigger orders_set_order_number
  before insert on public.orders
  for each row execute function public.set_order_number();

-- ---- from migrations/0013_order_items.sql ----
-- Line items within an order. unit_price is a snapshot taken at the moment
-- of purchase — never recompute historical order totals from the live
-- product price if it changes later.
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ---- from migrations/0014_experts.sql ----
-- Certified counsellors/psychologists. profile_id optionally links to a
-- profiles row with role='expert' (for an expert who has platform login
-- access, created only via the admin-create-expert Edge Function, never a
-- direct client insert). Nullable because a directory listing shouldn't
-- require a login-capable account to exist — e.g. featured experts seeded
-- from marketing content before they're onboarded with real credentials.
create table if not exists public.experts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete cascade,
  name text not null,
  photo_url text,
  bio text,
  specialties text[] not null default '{}',
  certifications text[] not null default '{}',
  rating numeric(2, 1) check (rating >= 0 and rating <= 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Loosens an already-deployed database's profile_id to match the above —
-- safe/idempotent to re-run (no-ops once already nullable).
alter table public.experts alter column profile_id drop not null;

create index if not exists experts_is_active_idx on public.experts (is_active);

-- ---- from migrations/0015_appointments.sql ----
-- Booked counselling sessions.
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expert_id uuid references public.experts (id) on delete set null,
  therapy_category text not null check (
    therapy_category in ('individual', 'child-adolescent', 'family-relationship', 'specialized')
  ),
  scheduled_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists appointments_user_id_idx on public.appointments (user_id);
create index if not exists appointments_expert_id_idx on public.appointments (expert_id);

-- ---- from migrations/0016_assessments.sql ----
-- Self-assessment quiz submissions. guest_session_id mirrors the cart's
-- guest-session pattern so anonymous quiz-takers can still be matched to
-- their own submission without an account.
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  guest_session_id uuid,
  answers jsonb not null,
  recommended_category text,
  created_at timestamptz not null default now(),
  constraint assessments_owner_check check (user_id is not null or guest_session_id is not null)
);

-- ---- from migrations/0017_reviews.sql ----
-- Customer/client reviews. is_corporate flags reviews reused on the
-- /business page (frontend doc Section 4.7).
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references auth.users (id) on delete set null,
  reviewer_name text not null,
  city text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  related_expert_id uuid references public.experts (id) on delete set null,
  is_corporate boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists reviews_created_at_idx on public.reviews (created_at desc);

-- ---- from migrations/0018_newsletter_subscribers.sql ----
-- Footer newsletter signups.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now(),
  confirmed boolean not null default false
);

-- ---- from migrations/0019_business_leads.sql ----
-- Corporate/EAP query form submissions from /business.
create table if not exists public.business_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

-- ---- from migrations/0020_feeds_posts.sql ----
-- Mind Feeds anonymous community posts (optional module — frontend only
-- ships a stub page for /community pending stakeholder confirmation, but
-- the schema is created now so it's ready if the module proceeds).
create table if not exists public.feeds_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  display_alias text not null,
  content text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now()
);

create index if not exists feeds_posts_status_idx on public.feeds_posts (status);

-- ---- from migrations/0021_feeds_reports.sql ----
-- Abuse reports on community posts.
create table if not exists public.feeds_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feeds_posts (id) on delete cascade,
  reporter_user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- ---- from migrations/0022_site_settings.sql ----
-- Key-value store for content marketing can change without a deploy:
-- announcement bar message, homepage stat chips, etc. (frontend doc
-- Sections 3.2 and 4.1). Not explicitly schema'd in the backend doc —
-- designed here to satisfy the frontend's requirement.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---- from migrations/0023_faqs.sql ----
-- FAQ accordion content, filterable by category (e.g. 'feelz', 'general').
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists faqs_category_idx on public.faqs (category);

-- ---- from migrations/0024_therapy_categories.sql ----
-- Editable content for the shared /therapy/:category page (frontend doc
-- Section 4.8) so copy changes don't need a redeploy.
create table if not exists public.therapy_categories (
  slug text primary key,
  title text not null,
  body text,
  hero_image text
);

-- ---- from migrations/0025_milestones.sql ----
-- About page milestone timeline (frontend doc Section 4.6). Low priority —
-- /about ships as a content-TBD stub this pass, table exists so it's ready.
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  title text not null,
  description text,
  sort_order integer not null default 0
);

-- ---- from migrations/0026_functions_stock.sql ----
-- Stock-safe selling logic (backend doc Section 5). This is the core
-- correctness boundary of the whole app:
--
--   1. Stock is only ever reduced at the moment an order is confirmed —
--      never at add-to-cart, never at checkout start.
--   2. At the payment step, a short-lived reservation is placed so the
--      *displayed* available number accounts for stock someone else is
--      mid-checkout on, without touching real inventory.
--   3. Confirmation (via payment webhook or immediate cash-order placement)
--      atomically decrements real stock, and only succeeds if enough stock
--      is genuinely available at that instant.

-- ---------------------------------------------------------------------
-- available_stock: real inventory minus live (unexpired) reservations
-- for that variant/location. This is what the frontend displays and
-- re-checks right before checkout proceeds.
-- ---------------------------------------------------------------------
create or replace function public.available_stock(
  p_variant_id uuid,
  p_location_id uuid default null
) returns integer
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(i.quantity_available, 0)
    - coalesce((
        select sum(r.quantity)
        from stock_reservations r
        where r.variant_id = p_variant_id
          and r.location_id is not distinct from p_location_id
          and r.expires_at > now()
      ), 0)
  from inventory i
  where i.variant_id = p_variant_id
    and i.location_id is not distinct from p_location_id
$$;

revoke execute on function public.available_stock(uuid, uuid) from public;
grant execute on function public.available_stock(uuid, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- create_stock_reservation: called only when checkout reaches the payment
-- step (never at add-to-cart). Re-verifies availability and inserts the
-- ~15 minute soft hold in the same transaction to avoid a check/insert
-- race. Replaces any existing reservation this cart already holds for the
-- same variant/location.
-- ---------------------------------------------------------------------
create or replace function public.create_stock_reservation(
  p_cart_id uuid,
  p_variant_id uuid,
  p_location_id uuid,
  p_quantity integer
) returns public.stock_reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available integer;
  v_row public.stock_reservations;
begin
  delete from stock_reservations
    where cart_id = p_cart_id
      and variant_id = p_variant_id
      and location_id is not distinct from p_location_id;

  select public.available_stock(p_variant_id, p_location_id) into v_available;
  if v_available < p_quantity then
    raise exception 'INSUFFICIENT_STOCK: only % available', v_available using errcode = 'P0001';
  end if;

  insert into stock_reservations (cart_id, variant_id, location_id, quantity, expires_at)
  values (p_cart_id, p_variant_id, p_location_id, p_quantity, now() + interval '15 minutes')
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.create_stock_reservation(uuid, uuid, uuid, integer) from public;
grant execute on function public.create_stock_reservation(uuid, uuid, uuid, integer) to anon, authenticated;

-- ---------------------------------------------------------------------
-- expire_stock_reservations: called every 5 minutes by the
-- cleanup-reservations Edge Function.
-- ---------------------------------------------------------------------
create or replace function public.expire_stock_reservations() returns integer
language sql
security definer
set search_path = public
as $$
  with deleted as (
    delete from stock_reservations where expires_at <= now() returning 1
  )
  select count(*)::integer from deleted;
$$;

revoke execute on function public.expire_stock_reservations() from public;
grant execute on function public.expire_stock_reservations() to service_role;

-- ---------------------------------------------------------------------
-- _decrement_stock_for_order: internal helper shared by the two order-
-- confirmation paths below. Atomically decrements each order line with a
-- row-count-checked guard (WHERE quantity_available >= x) — this is what
-- makes two simultaneous purchases on the last unit resolve safely: the
-- row lock on UPDATE serializes the two competing decrements, so only one
-- can succeed. Returns false (without raising) if any line is short, so
-- the caller can decide how to fail the order — never partially confirms.
-- ---------------------------------------------------------------------
create or replace function public._decrement_stock_for_order(p_order_id uuid) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_updated integer;
  v_location_id uuid;
begin
  select location_id into v_location_id from orders where id = p_order_id;

  for v_item in
    select variant_id, quantity from order_items where order_id = p_order_id
  loop
    update inventory
      set quantity_available = quantity_available - v_item.quantity, updated_at = now()
      where variant_id = v_item.variant_id
        and location_id is not distinct from v_location_id
        and quantity_available >= v_item.quantity;

    get diagnostics v_updated = row_count;

    if v_updated = 0 then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

revoke execute on function public._decrement_stock_for_order(uuid) from public;

-- ---------------------------------------------------------------------
-- confirm_order_and_decrement_stock: callable ONLY by the payment-webhook
-- Edge Function via the service_role key — never exposed to anon/
-- authenticated. This is the critical correctness boundary: the frontend
-- never marks an order paid on its own.
--
-- Idempotent: locks the order row and no-ops (returns the current status)
-- if it's already past 'placed', so a retried webhook delivery can't
-- double-decrement stock.
--
-- If stock is insufficient at confirmation time (someone else bought the
-- last unit a moment earlier), the order is marked cancelled /
-- refund_required instead of confirmed — the webhook caller is
-- responsible for triggering the actual Razorpay refund using
-- payment_ref, since that's an external API call this DB function must
-- not make itself.
-- ---------------------------------------------------------------------
create or replace function public.confirm_order_and_decrement_stock(
  p_order_id uuid,
  p_payment_ref text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_ok boolean;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND: %', p_order_id;
  end if;

  if v_order.status <> 'placed' then
    return v_order.status;
  end if;

  v_ok := public._decrement_stock_for_order(p_order_id);

  if v_ok then
    if v_order.source_cart_id is not null then
      delete from stock_reservations where cart_id = v_order.source_cart_id;
    end if;
    update orders
      set status = 'confirmed', payment_status = 'paid', payment_ref = p_payment_ref, updated_at = now()
      where id = p_order_id;
    return 'confirmed';
  else
    update orders
      set status = 'cancelled', payment_status = 'refund_required', payment_ref = p_payment_ref, updated_at = now()
      where id = p_order_id;
    return 'cancelled_insufficient_stock';
  end if;
end;
$$;

revoke execute on function public.confirm_order_and_decrement_stock(uuid, text) from public;
grant execute on function public.confirm_order_and_decrement_stock(uuid, text) to service_role;

-- ---------------------------------------------------------------------
-- confirm_cash_order: the cash-on-pickup equivalent of the payment
-- webhook. Called directly by the app right after inserting a
-- payment_method='cash_on_pickup' order — there is no external payment
-- event to wait for, so this IS the firm-commitment point. Restricted to
-- the order's own owner and to cash_on_pickup orders only. If stock turns
-- out to be insufficient, the order is rejected (cancelled) immediately
-- rather than being created and left dangling.
-- ---------------------------------------------------------------------
create or replace function public.confirm_cash_order(p_order_id uuid) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_ok boolean;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND: %', p_order_id;
  end if;

  if v_order.payment_method <> 'cash_on_pickup' then
    raise exception 'WRONG_PAYMENT_METHOD';
  end if;

  if v_order.user_id is distinct from auth.uid() then
    raise exception 'FORBIDDEN';
  end if;

  if v_order.status <> 'placed' then
    return v_order.status;
  end if;

  v_ok := public._decrement_stock_for_order(p_order_id);

  if v_ok then
    if v_order.source_cart_id is not null then
      delete from stock_reservations where cart_id = v_order.source_cart_id;
    end if;
    update orders
      set status = 'confirmed', payment_status = 'pending_cash', updated_at = now()
      where id = p_order_id;
    return 'confirmed';
  else
    update orders
      set status = 'cancelled', payment_status = 'failed', updated_at = now()
      where id = p_order_id;
    return 'cancelled_insufficient_stock';
  end if;
end;
$$;

revoke execute on function public.confirm_cash_order(uuid) from public;
grant execute on function public.confirm_cash_order(uuid) to authenticated;

-- ---- from migrations/0027_functions_profile_trigger.sql ----
-- Auto-create a profiles row for every new auth user, and a helper used
-- throughout the RLS policy map to grant admins a bypass without
-- repeating the role-check subquery on every table.

create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, auth_provider, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case when new.raw_app_meta_data ->> 'provider' = 'google' then 'google' else 'email' end,
    new.raw_user_meta_data ->> 'avatar_url',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- NOTE: if a customer originally signed up with email/password and later
-- signs in with Google using the same *verified* email, Supabase Auth
-- should match/merge identities under the existing auth.users row rather
-- than creating a second one — this depends on enabling manual identity
-- linking in the Supabase Auth dashboard settings (Authentication ->
-- Providers -> Google, plus the "allow identity linking" project setting).
-- This trigger only ever sees auth.users rows Supabase already decided to
-- create, so it cannot enforce the merge on its own. See MANUAL_SETUP.md
-- step 4 (Google OAuth) for the dashboard setting this depends on.

-- super_admin is a superset of admin for every ordinary admin-gated
-- action (products, coupons, business_leads, etc. RLS all key off this) —
-- the two roles only diverge for role-management itself, guarded
-- separately by is_super_admin() below.
create or replace function public.is_admin() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')
  )
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Strictly super_admin only — used solely to gate changing someone's
-- role (see prevent_role_self_escalation()). A plain admin passes
-- is_admin() but not this.
create or replace function public.is_super_admin() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'super_admin'
  )
$$;

revoke execute on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to anon, authenticated;

-- ---- from migrations/0028_rls_policies.sql ----
-- Consolidated Row Level Security policy map (backend doc Section 4).
-- Every table defaults to fully locked down (RLS enabled, no policies =
-- deny all); policies below add back exactly what's needed. Kept in one
-- file, in table order, because the RLS map is one conceptual matrix —
-- easier to audit as a whole than fragmented across 22 files.
--
-- is_admin() (0027) gives admins a bypass on every table instead of
-- repeating the role-check subquery. Most mutating operations that need
-- elevated privilege (confirming orders, decrementing stock, creating
-- expert accounts) go through SECURITY DEFINER functions / Edge Functions
-- instead of relying on a client-side admin bypass for the write itself —
-- the is_admin() write policies below cover the /admin dashboard's direct
-- CRUD (e.g. editing a product), not the stock/payment-safety paths.

-- ============================================================
-- Data API grants
--
-- Supabase's Data API (PostgREST) only reaches tables that have an
-- explicit GRANT to the anon/authenticated roles — this project's
-- config.toml does not set api.auto_expose_new_tables, which matches the
-- current Supabase cloud default of NOT auto-exposing new tables. RLS
-- policies below are the real row-level boundary; these GRANTs just open
-- the table-level door so RLS has something to filter (e.g. authenticated
-- can attempt an UPDATE on products, but the products_admin_write policy
-- blocks it unless is_admin()).
-- ============================================================
grant usage on schema public to anon, authenticated;

grant select on
  public.products, public.product_variants, public.pickup_locations,
  public.serviceable_pincodes, public.inventory, public.experts,
  public.reviews, public.site_settings, public.faqs,
  public.therapy_categories, public.milestones, public.feeds_posts
to anon, authenticated;

grant insert, update, delete on
  public.products, public.product_variants, public.pickup_locations,
  public.serviceable_pincodes, public.inventory, public.experts,
  public.site_settings, public.faqs, public.therapy_categories, public.milestones
to authenticated;

grant insert, update, delete on public.reviews to authenticated;

-- guest-accessible tables (anon writes scoped by RLS + app-level
-- session_id filtering, per the accepted tradeoff documented below)
grant select, insert, update, delete on public.carts, public.cart_items to anon, authenticated;
grant select, insert, update on public.assessments to anon, authenticated;
grant select on public.stock_reservations to anon, authenticated;

-- authenticated-only tables
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select, insert, update on public.appointments to authenticated;
grant insert, update, delete on public.feeds_posts to authenticated;
grant select, insert on public.feeds_reports to authenticated;

-- public-insert-only lead capture tables. business_leads also needs
-- update (admin status dropdown in /admin/business-leads) — newsletter
-- subscribers has no admin-facing status field, so stays insert/select-only.
grant insert on public.newsletter_subscribers, public.business_leads to anon, authenticated;
grant select on public.newsletter_subscribers, public.business_leads to authenticated;
grant update on public.business_leads to authenticated;

-- ============================================================
-- profiles
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- RLS alone can't stop a user from setting their own role='admin' via the
-- above update policy (id = auth.uid() still matches). Guard the role
-- column specifically with a trigger.
--
-- Deliberately gated on is_super_admin(), not is_admin(): a plain admin
-- can update any other field on any profile (profiles_update above), but
-- role changes are a super_admin-only action — including promoting
-- someone TO admin, so a compromised/rogue admin account can't mint more
-- admins or demote other admins on its own.
create or replace function public.prevent_role_self_escalation() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role (used by the admin-create-expert Edge Function to
  -- promote a freshly-created profile to role='expert') has no auth.uid(),
  -- so is_super_admin() would always read false for it — explicitly
  -- exempt it rather than block a legitimate, already-privileged caller.
  if new.role is distinct from old.role and not public.is_super_admin() and auth.role() <> 'service_role' then
    raise exception 'Only a super_admin can change role';
  end if;
  return new;
end;
$$;

create or replace trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- ============================================================
-- products / product_variants / pickup_locations — public read, admin write
-- ============================================================
alter table public.products enable row level security;
drop policy if exists products_select on public.products;
create policy products_select on public.products for select using (true);
drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products for all using (public.is_admin()) with check (public.is_admin());

alter table public.product_variants enable row level security;
drop policy if exists product_variants_select on public.product_variants;
create policy product_variants_select on public.product_variants for select using (true);
drop policy if exists product_variants_admin_write on public.product_variants;
create policy product_variants_admin_write on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

alter table public.pickup_locations enable row level security;
drop policy if exists pickup_locations_select on public.pickup_locations;
create policy pickup_locations_select on public.pickup_locations for select using (true);
drop policy if exists pickup_locations_admin_write on public.pickup_locations;
create policy pickup_locations_admin_write on public.pickup_locations for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- inventory — public read (storefront stock display), admin write.
-- The safe decrement itself happens through the SECURITY DEFINER
-- functions in 0026, which bypass RLS entirely.
-- ============================================================
alter table public.inventory enable row level security;
drop policy if exists inventory_select on public.inventory;
create policy inventory_select on public.inventory for select using (true);
drop policy if exists inventory_admin_write on public.inventory;
create policy inventory_admin_write on public.inventory for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- serviceable_pincodes — public read, admin write
-- ============================================================
alter table public.serviceable_pincodes enable row level security;
drop policy if exists serviceable_pincodes_select on public.serviceable_pincodes;
create policy serviceable_pincodes_select on public.serviceable_pincodes for select using (true);
drop policy if exists serviceable_pincodes_admin_write on public.serviceable_pincodes;
create policy serviceable_pincodes_admin_write on public.serviceable_pincodes for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- addresses — owner only, both directions
-- ============================================================
alter table public.addresses enable row level security;
drop policy if exists addresses_owner on public.addresses;
create policy addresses_owner on public.addresses
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- carts / cart_items — owner, or the guest matching that session.
--
-- KNOWN ACCEPTED TRADEOFF: a guest has no auth to scope RLS against, so
-- rows with user_id IS NULL are open to the anon role rather than scoped
-- to a specific session_id at the database level — the app filters by
-- session_id in every query. This means a guest could theoretically
-- enumerate another guest's cart by guessing its UUID. Accepted for this
-- pass because a guest cart holds no PII, only product selections.
-- Revisit if guest carts ever gain sensitive data.
-- ============================================================
alter table public.carts enable row level security;
drop policy if exists carts_owner_or_guest on public.carts;
create policy carts_owner_or_guest on public.carts
  for all using (user_id = auth.uid() or user_id is null or public.is_admin())
  with check (user_id = auth.uid() or user_id is null or public.is_admin());

alter table public.cart_items enable row level security;
drop policy if exists cart_items_owner_or_guest on public.cart_items;
create policy cart_items_owner_or_guest on public.cart_items
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
        and (c.user_id = auth.uid() or c.user_id is null)
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
        and (c.user_id = auth.uid() or c.user_id is null)
    )
  );

-- ============================================================
-- stock_reservations — read-only for the cart owner; all writes go
-- through create_stock_reservation()/expire_stock_reservations()
-- (SECURITY DEFINER, bypass RLS) so no insert/update/delete policy exists
-- here — direct client mutation is denied by default.
-- ============================================================
alter table public.stock_reservations enable row level security;
drop policy if exists stock_reservations_select on public.stock_reservations;
create policy stock_reservations_select on public.stock_reservations
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.carts c
      where c.id = stock_reservations.cart_id
        and (c.user_id = auth.uid() or c.user_id is null)
    )
  );

-- ============================================================
-- orders / order_items — owner-or-admin read; owner can create; only
-- admin/service_role (via the SECURITY DEFINER functions) can update
-- status.
-- ============================================================
alter table public.orders enable row level security;
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

alter table public.order_items enable row level security;
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items
  for insert with check (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid() and o.status = 'placed')
  );

-- ============================================================
-- experts — public directory (active only) + admin sees all; writes are
-- admin-only for edits, but account CREATION always goes through the
-- admin-create-expert Edge Function (service_role), never a direct client
-- insert, because it also has to create the auth.users row.
-- ============================================================
alter table public.experts enable row level security;
drop policy if exists experts_select on public.experts;
create policy experts_select on public.experts
  for select using (is_active = true or public.is_admin());

drop policy if exists experts_admin_write on public.experts;
create policy experts_admin_write on public.experts
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- appointments — the customer who booked it, the assigned expert, or admin
-- ============================================================
alter table public.appointments enable row level security;
drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.experts e
      where e.id = appointments.expert_id and e.profile_id = auth.uid()
    )
  );

drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists appointments_update on public.appointments;
create policy appointments_update on public.appointments
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.experts e
      where e.id = appointments.expert_id and e.profile_id = auth.uid()
    )
  );

-- ============================================================
-- assessments — owner, or anonymous guest match (same accepted tradeoff
-- as carts: guest rows are open, scoped by guest_session_id in the app)
-- ============================================================
alter table public.assessments enable row level security;
drop policy if exists assessments_owner_or_guest on public.assessments;
create policy assessments_owner_or_guest on public.assessments
  for all using (user_id = auth.uid() or user_id is null or public.is_admin())
  with check (user_id = auth.uid() or user_id is null or public.is_admin());

-- ============================================================
-- reviews — public read; any logged-in user can submit one
-- ============================================================
alter table public.reviews enable row level security;
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews for select using (true);
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews for insert with check (auth.uid() is not null);
drop policy if exists reviews_admin_write on public.reviews;
create policy reviews_admin_write on public.reviews for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists reviews_admin_delete on public.reviews;
create policy reviews_admin_delete on public.reviews for delete using (public.is_admin());

-- ============================================================
-- newsletter_subscribers — admin read, anyone can insert (subscribe)
-- ============================================================
alter table public.newsletter_subscribers enable row level security;
drop policy if exists newsletter_select on public.newsletter_subscribers;
create policy newsletter_select on public.newsletter_subscribers for select using (public.is_admin());
drop policy if exists newsletter_insert on public.newsletter_subscribers;
create policy newsletter_insert on public.newsletter_subscribers for insert with check (true);

-- ============================================================
-- business_leads — admin read, anyone can insert (submit the form)
-- ============================================================
alter table public.business_leads enable row level security;
drop policy if exists business_leads_select on public.business_leads;
create policy business_leads_select on public.business_leads for select using (public.is_admin());
drop policy if exists business_leads_insert on public.business_leads;
create policy business_leads_insert on public.business_leads for insert with check (true);
drop policy if exists business_leads_admin_update on public.business_leads;
create policy business_leads_admin_update on public.business_leads
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- feeds_posts / feeds_reports — optional community module. Schema and RLS
-- exist so the module is ready if it proceeds; the frontend only ships a
-- stub page this pass.
-- ============================================================
alter table public.feeds_posts enable row level security;
drop policy if exists feeds_posts_select on public.feeds_posts;
create policy feeds_posts_select on public.feeds_posts
  for select using (status = 'visible' or user_id = auth.uid() or public.is_admin());
drop policy if exists feeds_posts_insert on public.feeds_posts;
create policy feeds_posts_insert on public.feeds_posts
  for insert with check (user_id = auth.uid());
drop policy if exists feeds_posts_admin_moderate on public.feeds_posts;
create policy feeds_posts_admin_moderate on public.feeds_posts
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists feeds_posts_admin_delete on public.feeds_posts;
create policy feeds_posts_admin_delete on public.feeds_posts
  for delete using (public.is_admin());

alter table public.feeds_reports enable row level security;
drop policy if exists feeds_reports_select on public.feeds_reports;
create policy feeds_reports_select on public.feeds_reports for select using (public.is_admin());
drop policy if exists feeds_reports_insert on public.feeds_reports;
create policy feeds_reports_insert on public.feeds_reports for insert with check (reporter_user_id = auth.uid());

-- ============================================================
-- site_settings / faqs / therapy_categories / milestones — public read
-- (marketing/CMS-style content), admin write
-- ============================================================
alter table public.site_settings enable row level security;
drop policy if exists site_settings_select on public.site_settings;
create policy site_settings_select on public.site_settings for select using (true);
drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

alter table public.faqs enable row level security;
drop policy if exists faqs_select on public.faqs;
create policy faqs_select on public.faqs for select using (true);
drop policy if exists faqs_admin_write on public.faqs;
create policy faqs_admin_write on public.faqs for all using (public.is_admin()) with check (public.is_admin());

alter table public.therapy_categories enable row level security;
drop policy if exists therapy_categories_select on public.therapy_categories;
create policy therapy_categories_select on public.therapy_categories for select using (true);
drop policy if exists therapy_categories_admin_write on public.therapy_categories;
create policy therapy_categories_admin_write on public.therapy_categories for all using (public.is_admin()) with check (public.is_admin());

alter table public.milestones enable row level security;
drop policy if exists milestones_select on public.milestones;
create policy milestones_select on public.milestones for select using (true);
drop policy if exists milestones_admin_write on public.milestones;
create policy milestones_admin_write on public.milestones for all using (public.is_admin()) with check (public.is_admin());

-- ---- from migrations/0029_seed_dev.sql ----
-- OPTIONAL dev-only seed data so /feelz has something to render locally
-- right after running migrations. Do NOT run this against production.
insert into public.products (name, slug, description, price, is_active) values
  ('Focus', 'focus', 'A calming blend to help you concentrate.', 290.00, true),
  ('Joy', 'joy', 'A mood-lifting daily ritual.', 290.00, true),
  ('Extrovert', 'extrovert', 'For social energy and confidence.', 290.00, true),
  ('Rest', 'rest', 'Wind down and sleep better.', 290.00, true)
on conflict (slug) do nothing;

-- Re-running this script against a project where these rows already exist
-- (ON CONFLICT DO NOTHING above is a no-op then) still corrects the price
-- on the existing rows, so this stays the actual source of truth for it.
update public.products set price = 290.00
where slug in ('focus', 'joy', 'extrovert', 'rest');

insert into public.product_variants (product_id, variant_label, sku)
select id, 'Sachet (10 pack)', slug || '-sachet-10' from public.products
on conflict (sku) do nothing;

insert into public.pickup_locations (name, address, city, is_active) values
  ('Zostel Delhi', 'Main Bazaar, Paharganj', 'Delhi', true),
  ('Zostel Jaipur', 'Hathroi Fort, Jaipur', 'Jaipur', true)
on conflict do nothing;

insert into public.inventory (variant_id, location_id, quantity_available)
select v.id, null, 50 from public.product_variants v
on conflict do nothing;

insert into public.serviceable_pincodes (pincode, city, delivery_fee, free_delivery_threshold) values
  ('110001', 'Delhi', 40.00, 500.00),
  ('302001', 'Jaipur', 40.00, 500.00)
on conflict (pincode) do nothing;

-- ---- from migrations/0031_coupons_and_pickup_codes.sql ----
-- Adds three things needed for the Feelz landing page's guest checkout +
-- Zostel pickup flow, all additive so the existing 3-step /checkout in the
-- main app keeps working unmodified:
--   1. coupons — validated server-side only, inside create-order.
--   2. Guest contact/address fields on orders, so someone can buy without
--      creating an account (spec: pickup needs name/phone/email; delivery
--      needs a full address either way — Shiprocket requires it).
--   3. pickup_code — generated at confirmation time for takeaway orders,
--      shown as a QR/code the customer presents at the pickup point, and
--      looked up by the staff dashboard.

-- ============================================================
-- coupons
-- ============================================================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  min_order_amount numeric(10, 2) not null default 0 check (min_order_amount >= 0),
  max_discount_amount numeric(10, 2) check (max_discount_amount is null or max_discount_amount > 0),
  is_active boolean not null default true,
  expires_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  times_used integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists coupons_code_upper_idx on public.coupons (upper(code));

alter table public.coupons enable row level security;

-- Public can only see coupons that are currently redeemable, so listing
-- them client-side (e.g. an "available offers" hint) can't leak disabled/
-- expired codes. The real, authoritative check still happens server-side
-- in create-order regardless of what a client sends.
drop policy if exists coupons_select on public.coupons;
create policy coupons_select on public.coupons
  for select using (
    public.is_admin()
    or (is_active and (expires_at is null or expires_at > now()))
  );

drop policy if exists coupons_admin_write on public.coupons;
create policy coupons_admin_write on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.coupons to anon, authenticated;
grant insert, update, delete on public.coupons to authenticated;

-- ============================================================
-- orders — guest checkout + coupon + pickup-code columns
-- ============================================================
alter table public.orders
  add column if not exists guest_name text,
  add column if not exists guest_phone text,
  add column if not exists guest_email text,
  add column if not exists guest_address_line1 text,
  add column if not exists guest_address_line2 text,
  add column if not exists guest_address_city text,
  add column if not exists guest_address_state text,
  add column if not exists guest_address_pincode text,
  add column if not exists coupon_code text references public.coupons (code) on delete set null,
  add column if not exists discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  add column if not exists pickup_code text unique,
  add column if not exists pickup_code_collected_at timestamptz;

-- A guest delivery order has no addresses row (that table requires a real
-- auth.users id) — it satisfies this constraint via the inline
-- guest_address_* fields instead. Existing rows are unaffected: every
-- current delivery order already has address_id set, so the OR is a pure
-- loosening.
alter table public.orders drop constraint if exists orders_delivery_needs_address;
alter table public.orders add constraint orders_delivery_needs_address check (
  fulfillment_type <> 'delivery' or address_id is not null or guest_address_line1 is not null
);

-- Guest orders (user_id is null) are only ever inserted by create-order via
-- service_role, which does its own contact-info validation before insert —
-- this constraint is a second line of defense against a row silently
-- having neither an account nor any way to reach the customer.
alter table public.orders drop constraint if exists orders_guest_needs_contact;
alter table public.orders add constraint orders_guest_needs_contact check (
  user_id is not null or (guest_name is not null and guest_phone is not null)
);

create index if not exists orders_pickup_code_idx on public.orders (pickup_code) where pickup_code is not null;

-- ============================================================
-- generate_pickup_code — short, human-typeable code (staff read it off a
-- phone screen or a scan miss-fires) excluding visually ambiguous
-- characters (0/O, 1/I/L). Retries on the rare collision.
-- ============================================================
create or replace function public.generate_pickup_code() returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    end loop;

    select exists(select 1 from orders where pickup_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;

  return v_code;
end;
$$;

revoke execute on function public.generate_pickup_code() from public;

-- ============================================================
-- confirm_order_and_decrement_stock — extended so a takeaway order lands
-- directly on 'ready_for_pickup' (there's no packing/shipping step; the
-- item is already at the pickup point) with a pickup_code assigned in the
-- same transaction as the stock decrement, instead of a separate follow-up
-- write. Delivery orders are unchanged: they still land on 'confirmed',
-- which is what create-shiprocket-shipment's DB-webhook trigger watches
-- for.
-- ============================================================
create or replace function public.confirm_order_and_decrement_stock(
  p_order_id uuid,
  p_payment_ref text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_ok boolean;
  v_new_status text;
  v_pickup_code text;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND: %', p_order_id;
  end if;

  if v_order.status <> 'placed' then
    return v_order.status;
  end if;

  v_ok := public._decrement_stock_for_order(p_order_id);

  if v_ok then
    if v_order.source_cart_id is not null then
      delete from stock_reservations where cart_id = v_order.source_cart_id;
    end if;

    if v_order.fulfillment_type = 'takeaway' then
      v_new_status := 'ready_for_pickup';
      v_pickup_code := public.generate_pickup_code();
    else
      v_new_status := 'confirmed';
      v_pickup_code := null;
    end if;

    update orders
      set status = v_new_status,
          payment_status = 'paid',
          payment_ref = p_payment_ref,
          pickup_code = coalesce(pickup_code, v_pickup_code),
          updated_at = now()
      where id = p_order_id;

    return v_new_status;
  else
    update orders
      set status = 'cancelled', payment_status = 'refund_required', payment_ref = p_payment_ref, updated_at = now()
      where id = p_order_id;
    return 'cancelled_insufficient_stock';
  end if;
end;
$$;

-- ============================================================
-- mark_order_collected — the staff dashboard's "Mark as Collected" action.
-- Restricted to service_role: the dashboard has only a shared password,
-- not a Supabase-auth identity, so authorization happens in the
-- staff-pickup Edge Function before this is ever called, not via RLS.
-- Only fires from 'ready_for_pickup' so a duplicate scan/click is a no-op
-- rather than clobbering an already-collected order's timestamp.
-- ============================================================
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

  update orders
    set status = 'picked_up', pickup_code_collected_at = now(), updated_at = now()
    where id = p_order_id;

  return 'collected';
end;
$$;

revoke execute on function public.mark_order_collected(uuid) from public;
grant execute on function public.mark_order_collected(uuid) to service_role;

-- ============================================================
-- increment_coupon_usage — atomic column += 1, called by create-order
-- after a coupon-bearing order is successfully placed. A plain
-- supabase-js .update({times_used: n}) can't express "+1" without a
-- read-then-write race; this closes that race in a single statement.
-- ============================================================
create or replace function public.increment_coupon_usage(p_code text) returns void
language sql
security definer
set search_path = public
as $$
  update coupons set times_used = times_used + 1 where code = p_code;
$$;

revoke execute on function public.increment_coupon_usage(text) from public;
grant execute on function public.increment_coupon_usage(text) to service_role;

-- ============================================================
-- orders / order_items — reopen select for guest orders.
--
-- The original policy (0028) is `user_id = auth.uid() or is_admin()`. For
-- a guest order user_id IS NULL and auth.uid() IS NULL too, and
-- `null = null` evaluates to NULL, not true — so a guest could never read
-- back the very order they just placed, breaking the confirmation/
-- tracking screen entirely for guest checkout.
--
-- KNOWN ACCEPTED TRADEOFF, same shape as the guest-cart policy in 0028:
-- guest orders (user_id IS NULL) become readable by anyone who has the
-- order's id — there's no guest identity to scope RLS against otherwise.
-- Order ids are random UUIDs (not sequential, not the human-facing
-- order_number), so this requires already possessing an unguessable
-- token, not enumeration. Revisit if that stops being true (e.g. if
-- order ids ever get exposed in a predictable place like a URL slug).
-- ============================================================
drop policy orders_select on public.orders;
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select using (user_id = auth.uid() or user_id is null or public.is_admin());

drop policy order_items_select on public.order_items;
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and (o.user_id = auth.uid() or o.user_id is null)
    )
  );

-- ---- from migrations/0032_staff_pins_and_appointment_payments.sql ----
-- Per-location staff PINs (staff-pickup dashboard access scoped to one
-- pickup location instead of the single shared STAFF_DASHBOARD_PASSWORD
-- seeing every location's queue), plus payment/coupon support for
-- counselling appointments (mirrors orders: price/discount/total looked
-- up server-side by an Edge Function, payment_status/razorpay_order_id/
-- payment_ref tracked the same way, confirmed by the same webhook).

-- generate_staff_pin — 8-char strong PIN, same excluded-ambiguous-chars
-- alphabet as generate_pickup_code(), retried on collision. Used as the
-- staff_pin column's default so any new pickup_locations row (however
-- it's inserted) always gets one without a separate follow-up write.
create or replace function public.generate_staff_pin() returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_pin text;
  v_exists boolean;
begin
  loop
    v_pin := '';
    for i in 1..8 loop
      v_pin := v_pin || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    end loop;

    select exists(select 1 from pickup_locations where staff_pin = v_pin) into v_exists;
    exit when not v_exists;
  end loop;

  return v_pin;
end;
$$;

revoke execute on function public.generate_staff_pin() from public;

alter table public.pickup_locations add column if not exists staff_pin text;
update public.pickup_locations set staff_pin = public.generate_staff_pin() where staff_pin is null;
alter table public.pickup_locations alter column staff_pin set not null;
alter table public.pickup_locations alter column staff_pin set default public.generate_staff_pin();
create unique index if not exists pickup_locations_staff_pin_idx on public.pickup_locations (staff_pin);

-- coupons.applies_to — every existing coupon defaults to 'orders' (today's
-- only use), so nothing already live silently starts applying somewhere
-- new. create-appointment-order only honors codes with applies_to in
-- ('appointments', 'both'); create-order keeps checking 'orders'/'both'.
alter table public.coupons add column if not exists applies_to text not null default 'orders';
alter table public.coupons drop constraint if exists coupons_applies_to_check;
alter table public.coupons add constraint coupons_applies_to_check
  check (applies_to in ('orders', 'appointments', 'both'));

-- appointments — payment columns, same shape as orders' subtotal/discount/
-- total/payment_status/razorpay_order_id/payment_ref. price/total stay
-- nullable (a booking made before this migration has neither) rather than
-- defaulted to 0, so "no price attached" stays visibly distinct from
-- "free session".
alter table public.appointments add column if not exists price numeric(10, 2);
alter table public.appointments add column if not exists discount_amount numeric(10, 2) not null default 0;
alter table public.appointments add column if not exists coupon_code text;
alter table public.appointments add column if not exists total numeric(10, 2);
alter table public.appointments add column if not exists payment_status text not null default 'pending';
alter table public.appointments drop constraint if exists appointments_payment_status_check;
alter table public.appointments add constraint appointments_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed'));
alter table public.appointments add column if not exists razorpay_order_id text;
alter table public.appointments add column if not exists payment_ref text;

create index if not exists appointments_razorpay_order_id_idx on public.appointments (razorpay_order_id) where razorpay_order_id is not null;

-- ---- from migrations/20260722010000_appointment_reminders.sql ----
-- Dedup markers for the appointment-reminder Edge Function (24h-before and
-- 1h-before session reminders), same pattern as orders.
-- pickup_reminder_sent_at / carts.reminder_sent_at — set right after
-- sending so a re-run of the scheduled function never double-emails the
-- same appointment for the same reminder.
alter table public.appointments add column if not exists reminder_24h_sent_at timestamptz;
alter table public.appointments add column if not exists reminder_1h_sent_at timestamptz;

-- ============================================================
-- confirm_appointment_payment — the counselling-booking equivalent of
-- confirm_order_and_decrement_stock: called ONLY by the payment-webhook
-- (or create-appointment-order's free-coupon-covers-it-fully path) via
-- the service-role client, never by a browser. No stock/pickup-code logic
-- here — an appointment is a calendar slot, not inventory.
-- ============================================================
create or replace function public.confirm_appointment_payment(
  p_appointment_id uuid,
  p_payment_ref text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt record;
begin
  select * into v_appt from appointments where id = p_appointment_id for update;
  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND: %', p_appointment_id;
  end if;

  if v_appt.payment_status = 'paid' then
    return 'already_paid';
  end if;

  update appointments
    set payment_status = 'paid', payment_ref = p_payment_ref
    where id = p_appointment_id;

  return 'paid';
end;
$$;

revoke execute on function public.confirm_appointment_payment(uuid, text) from public;
grant execute on function public.confirm_appointment_payment(uuid, text) to service_role;

-- Sane default session price so create-appointment-order has something to
-- charge before anyone touches /admin/site-settings. Admin-editable after
-- the fact; this only seeds it if the key doesn't already exist.
insert into public.site_settings (key, value)
values ('counselling_session_price', '999'::jsonb)
on conflict (key) do nothing;

-- NAYANFREE — 100%-off counselling coupon for testing the booking/payment
-- UI end-to-end without a real Razorpay charge. Re-running this migration
-- keeps it active/100%-off/appointments-scoped even if someone edited it.
insert into public.coupons (code, discount_type, discount_value, min_order_amount, applies_to, is_active)
values ('NAYANFREE', 'percent', 100, 0, 'appointments', true)
on conflict (code) do update set
  discount_type = 'percent', discount_value = 100, applies_to = 'appointments', is_active = true;

-- ---- from migrations/0033_inventory_fix_and_staff_pin_lockdown.sql ----

-- available_stock — FIX: the previous version selected `available_stock`
-- FROM inventory, so a (variant, location) pair with no inventory row at
-- all produced no result row, not zero. In plpgsql, `if v_available <
-- p_quantity` with v_available = NULL evaluates to NULL, which IF treats
-- as false — so create_stock_reservation never raised INSUFFICIENT_STOCK
-- for a location with zero seeded inventory, silently allowing checkout
-- to proceed. It then failed at PAYMENT-CONFIRMATION time instead (inside
-- _decrement_stock_for_order's UPDATE, which correctly matches zero rows
-- and returns false), cancelling the order as 'refund_required' — AFTER
-- the customer had already paid via Razorpay. Every pickup_locations row
-- had exactly this problem: only the central (location_id IS NULL)
-- inventory was ever seeded, never per-Zostel stock. This rewrite drops
-- the shared FROM entirely so each side is its own coalesced scalar
-- subquery — a missing row now correctly reads as 0, not "unknown".
create or replace function public.available_stock(
  p_variant_id uuid,
  p_location_id uuid default null
) returns integer
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      select i.quantity_available from inventory i
      where i.variant_id = p_variant_id and i.location_id is not distinct from p_location_id
    ), 0)
    - coalesce((
        select sum(r.quantity)
        from stock_reservations r
        where r.variant_id = p_variant_id
          and r.location_id is not distinct from p_location_id
          and r.expires_at > now()
      ), 0)
$$;

-- Seed a starting per-location stock count for every existing pickup
-- location so takeaway ordering doesn't go from "silently unenforced" to
-- "everything shows out of stock" the moment the fix above ships. Smaller
-- than the 50-unit central/online seed (0029) since this represents
-- physical stock actually sitting at one branch, not a warehouse.
-- Admin-adjustable per location at /admin/inventory from here on.
insert into public.inventory (variant_id, location_id, quantity_available)
select v.id, l.id, 15
from public.product_variants v
cross join public.pickup_locations l
on conflict do nothing;

-- prevent_staff_pin_change — a Zostel's staff_pin is a bearer credential
-- (whoever has it sees that location's pickup queue), not a day-to-day
-- operational field like address/city/is_active — so it gets the same
-- tier restriction as changing someone's role (see prevent_role_self_
-- escalation): only super_admin or the service_role key can change it.
-- A plain admin can still see the current PIN (pickup_locations_admin_
-- write's is_admin() check still covers every other column and reads),
-- just not rotate it. The frontend additionally requires the acting
-- super_admin to re-enter their own password before calling this update
-- at all — this trigger is the actual enforcement boundary either way.
create or replace function public.prevent_staff_pin_change() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.staff_pin is distinct from old.staff_pin
     and not public.is_super_admin()
     and auth.role() <> 'service_role' then
    raise exception 'Only a super_admin can change a location''s staff PIN';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_staff_pin_change on public.pickup_locations;
create trigger trg_prevent_staff_pin_change
  before update on public.pickup_locations
  for each row execute function public.prevent_staff_pin_change();

-- ---- from migrations/0034_expert_photos_storage.sql ----
-- Public bucket for expert profile photos, uploaded directly from
-- /admin/experts instead of admins having to host an image somewhere
-- else first and paste a URL. Public read (every experts.photo_url is
-- already shown on public pages like /experts), admin-only write.
insert into storage.buckets (id, name, public)
values ('expert-photos', 'expert-photos', true)
on conflict (id) do nothing;

drop policy if exists expert_photos_select on storage.objects;
create policy expert_photos_select on storage.objects
  for select using (bucket_id = 'expert-photos');

drop policy if exists expert_photos_admin_insert on storage.objects;
create policy expert_photos_admin_insert on storage.objects
  for insert with check (bucket_id = 'expert-photos' and public.is_admin());

drop policy if exists expert_photos_admin_update on storage.objects;
create policy expert_photos_admin_update on storage.objects
  for update using (bucket_id = 'expert-photos' and public.is_admin());

drop policy if exists expert_photos_admin_delete on storage.objects;
create policy expert_photos_admin_delete on storage.objects
  for delete using (bucket_id = 'expert-photos' and public.is_admin());

-- ---- from migrations/0035_email_notifications.sql ----
-- Wires every "something happened" event that should email someone into
-- real Database Webhooks — implemented via pg_net directly in SQL rather
-- than the Supabase dashboard's Webhooks UI, so the whole notification
-- pipeline stays reproducible from this file like everything else here.
-- (Also worth knowing: neither of the two notifier functions this
-- project already had — order-status-notifier, appointment-notifier —
-- had ANY trigger wired to them before this migration, despite being
-- fully implemented; they were entirely dormant.)
create extension if not exists pg_net with schema extensions;

-- A fallback contact for booking emails when an expert has no login
-- account — experts.profile_id is null for a directory-only listing
-- (true for most seeded experts today, see AUTH_AND_ROLES.md). Without
-- this, a directory-only expert could never be emailed about a booking.
alter table public.experts add column if not exists notification_email text;

-- Dedup markers so the reminder crons (pickup-reminder, cart-reminder)
-- never email the same person twice for the same stale order/cart.
alter table public.orders add column if not exists pickup_reminder_sent_at timestamptz;
alter table public.carts add column if not exists reminder_sent_at timestamptz;

insert into public.site_settings (key, value)
values ('admin_notification_email', '"team@mindcafe.app"'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- notify_webhook — generic trigger function: POSTs the same
-- {type, table, record, old_record} shape Supabase's own Database
-- Webhooks send, to whichever Edge Function is named in TG_ARGV[0]. Runs
-- via pg_net (async, fire-and-forget) and never lets a notification
-- failure roll back the actual write — an order/booking/lead must still
-- save even if pg_net or the function it's calling is having a bad day.
--
-- The anon key embedded below is safe to hardcode — it's already public
-- (shipped in every browser bundle as NEXT_PUBLIC_SUPABASE_ANON_KEY).
-- The functions it calls are deployed with --no-verify-jwt and do their
-- own service-role work internally, so this key only has to get the
-- request past the gateway, not authorize anything sensitive. (A real
-- secret — e.g. the service_role key — must never be embedded in a
-- function body like this: pg_proc source is readable by any role that
-- can see the function exists, so this pattern only works because the
-- anon key is meant to be public in the first place.)
-- ============================================================
create or replace function public.notify_webhook() returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_function_name text := TG_ARGV[0];
  v_url text := 'https://tqjpzqozysmdsuujzvmy.supabase.co/functions/v1/' || v_function_name;
  v_payload jsonb;
begin
  v_payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', to_jsonb(NEW),
    'old_record', case when TG_OP = 'UPDATE' then to_jsonb(OLD) else null end
  );

  perform net.http_post(
    url := v_url,
    body := v_payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxanB6cW96eXNtZHN1dWp6dm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODIzOTgsImV4cCI6MjA5OTM1ODM5OH0.6YWG8kMwyv84LesjpihegRQoHwkTkLtHfAZyP2eM6oA'
    )
  );

  return NEW;
exception when others then
  raise warning 'notify_webhook failed for %: %', v_function_name, SQLERRM;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_order_status on public.orders;
create trigger trg_notify_order_status
  after insert or update on public.orders
  for each row execute function public.notify_webhook('order-status-notifier');

drop trigger if exists trg_notify_appointment on public.appointments;
create trigger trg_notify_appointment
  after insert or update on public.appointments
  for each row execute function public.notify_webhook('appointment-notifier');

drop trigger if exists trg_notify_business_lead on public.business_leads;
create trigger trg_notify_business_lead
  after insert on public.business_leads
  for each row execute function public.notify_webhook('business-lead-notifier');

drop trigger if exists trg_notify_newsletter on public.newsletter_subscribers;
create trigger trg_notify_newsletter
  after insert on public.newsletter_subscribers
  for each row execute function public.notify_webhook('newsletter-welcome-notifier');

-- Only the null -> not-null transition (an existing account getting
-- linked to a directory listing) — not every unrelated edit to an
-- expert's row (bio tweaks, rating changes, ...).
drop trigger if exists trg_notify_expert_linked on public.experts;
create trigger trg_notify_expert_linked
  after update on public.experts
  for each row
  when (OLD.profile_id is null and NEW.profile_id is not null)
  execute function public.notify_webhook('expert-linked-notifier');

-- ---- realtime (every table, not just orders/inventory) ----
-- Every table in this schema is added to the supabase_realtime publication,
-- so any client subscribed via postgres_changes gets live INSERT/UPDATE/
-- DELETE events for it. Postgres has no `ADD TABLE IF NOT EXISTS` for
-- publications, so this is wrapped in existence checks per table — safe to
-- re-run. Placed last since it references `coupons`, created above.
--
-- Note: Realtime still respects each table's RLS policies for who
-- receives which row's changes — turning this on doesn't bypass RLS, it
-- just adds a live-update channel on top of it.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'products', 'product_variants', 'pickup_locations', 'inventory',
    'serviceable_pincodes', 'addresses', 'carts', 'cart_items', 'stock_reservations',
    'orders', 'order_items', 'experts', 'appointments', 'assessments', 'reviews',
    'newsletter_subscribers', 'business_leads', 'feeds_posts', 'feeds_reports',
    'site_settings', 'faqs', 'therapy_categories', 'milestones', 'coupons'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- ---- from migrations/20260722000000_payment_confirmation_gate.sql ----
-- Neither appointment-notifier nor the expert/admin "confirm" actions
-- ever checked payment_status: an expert or admin could flip status to
-- 'confirmed'/'completed' (firing the "your session is confirmed!" email
-- to both customer and expert) on a booking that had never actually been
-- paid for, and the "booking request received" email additionally fired
-- the instant the appointments row was inserted, before the Razorpay
-- checkout modal even opened. This trigger makes an unpaid confirmation
-- impossible at the DB layer — the real enforcement boundary, same as
-- prevent_staff_pin_change — rather than relying on every caller (expert
-- dashboard, admin panel, any future one) to remember the check
-- themselves. service_role is exempt so the payment webhook / edge
-- functions are never blocked by their own writes.
create or replace function public.prevent_unpaid_appointment_confirm() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('confirmed', 'completed')
     and new.payment_status <> 'paid'
     and auth.role() <> 'service_role' then
    raise exception 'Cannot confirm or complete an appointment before payment is confirmed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_unpaid_appointment_confirm on public.appointments;
create trigger trg_prevent_unpaid_appointment_confirm
  before update on public.appointments
  for each row execute function public.prevent_unpaid_appointment_confirm();

-- Same class of gap on the Feelz order side: /admin/orders lets status be
-- set to 'confirmed' (or any later fulfillment stage) via a plain UPDATE
-- that never checks payment_status, even though
-- confirm_order_and_decrement_stock — the only payment-webhook-driven
-- path to 'confirmed' for a razorpay order — sets status and
-- payment_status together specifically so the two can never drift apart.
-- Scoped to payment_method = 'razorpay' only: cash_on_pickup orders
-- legitimately reach 'confirmed' with payment_status = 'pending_cash' via
-- confirm_cash_order (payment happens at pickup, not upfront) — blocking
-- those too would break that flow. 'placed' and 'cancelled' stay exempt:
-- cancelling an unpaid/abandoned order is normal cleanup, not something
-- that should require payment first.
create or replace function public.prevent_unpaid_order_confirm() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and new.status not in ('placed', 'cancelled')
     and new.payment_method = 'razorpay'
     and new.payment_status <> 'paid'
     and auth.role() <> 'service_role' then
    raise exception 'Cannot move an order past "placed" before payment is confirmed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_unpaid_order_confirm on public.orders;
create trigger trg_prevent_unpaid_order_confirm
  before update on public.orders
  for each row execute function public.prevent_unpaid_order_confirm();

-- ---- from migrations/20260723000000_expert_bookable_and_meet_link.sql ----
-- 1. experts.is_bookable — some directory listings (e.g. Arouba Kabir,
--    Harshita Gurbani) shouldn't show a "book with X" button at all; they're
--    still real listings (photo/bio/specialties), just not currently
--    accepting bookings through the site. Defaults true so every existing
--    expert keeps working exactly as before.
--
-- 2. appointments.meet_link + a trigger requiring one before an
--    appointment can reach 'confirmed' — up to now an expert could confirm
--    a session with nothing for the customer to actually join. Mirrors
--    prevent_unpaid_appointment_confirm's shape (block the bad transition
--    at the DB layer, exempt service_role) rather than trusting every
--    caller (expert dashboard today, admin panel potentially later) to
--    remember the check themselves.
alter table public.experts add column if not exists is_bookable boolean not null default true;

update public.experts set is_bookable = false where name in ('Arouba Kabir', 'Harshita Gurbani');

alter table public.appointments add column if not exists meet_link text;

create or replace function public.prevent_confirm_without_meet_link() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and new.status = 'confirmed'
     and (new.meet_link is null or btrim(new.meet_link) = '')
     and auth.role() <> 'service_role' then
    raise exception 'A meet link is required to confirm an appointment';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_confirm_without_meet_link on public.appointments;
create trigger trg_prevent_confirm_without_meet_link
  before update on public.appointments
  for each row execute function public.prevent_confirm_without_meet_link();

-- =========================================================
-- NOT covered by this script — see MANUAL_SETUP.md for the full
-- walkthrough. Short version:
--   - Edge Functions (./functions/*, same folder as this file) — deploy
--     via `supabase functions deploy <name> --no-verify-jwt` for each one.
--   - Edge Function secrets (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
--     RAZORPAY_WEBHOOK_SECRET, SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD,
--     SHIPROCKET_WEBHOOK_SECRET, STAFF_DASHBOARD_PASSWORD,
--     EMAIL_PROVIDER_API_KEY) — set via `supabase secrets set NAME=value`
--     or the dashboard.
--   - Google OAuth provider — Authentication > Providers > Google in
--     the dashboard, needs a Google Cloud OAuth Client ID/Secret.
--   - Database Webhooks for order-status-notifier and
--     create-shiprocket-shipment — Database > Webhooks in the
--     dashboard, both firing on `orders` UPDATE.
--   - Frontend env vars (NEXT_PUBLIC_SUPABASE_URL,
--     NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_RAZORPAY_KEY_ID) —
--     from Project Settings > API, into .env.local / Vercel.
-- =========================================================
