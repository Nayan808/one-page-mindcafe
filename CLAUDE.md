# mindcafe — live production safety

This is a **live site with real customers**, backed by a Supabase
project on the **Free plan (no backups, no point-in-time recovery)**.
There is no local staging environment (no Docker installed), so
production is the only environment there is. Treat **every** backend
change this way — orders, appointments, inventory, experts, business
leads, contact messages, auth, all of it — not just whichever table
happens to be under discussion. A mistake here isn't reversible.

Before pushing anything to Supabase (a migration or an edge function),
go through this checklist. It applies to every table and every admin
page, not just the ones in the examples below — those are illustrations
of the failure mode, not the full list of what it applies to.

1. **Verify joins/embeds, don't assume them — on any table.** Before
   adding a nested `.select()` relation (e.g.
   `orders.select("*, profiles(...)")`), grep `supabase/setup.sql` and
   `supabase/migrations/` to confirm a real foreign key exists directly
   between those two tables. PostgREST cannot embed across a
   shared-parent relationship (e.g. both tables only FK to
   `auth.users`) — it silently errors the *entire* query instead of
   just omitting the field.
   - This isn't specific to orders. Every table below only has a
     `user_id`/`reporter_user_id` FK to `auth.users`, never to
     `public.profiles` — the same trap applies to all of them:
     `addresses`, `carts`, `orders`, `appointments`, `assessments`,
     `feeds_posts`, `feeds_reports`. If a future change to any admin or
     account page needs a name/phone/email alongside rows from one of
     these tables, use the two-query merge pattern already in
     `getAppointmentsAdmin` / `getOrdersAdmin` (fetch the rows, then a
     separate `profiles` query by the collected `user_id`s, merge in
     JS) — not a nested embed. Before assuming any *other* table can
     embed `profiles` (or any other relation) directly, check for the
     FK first; don't extrapolate from one working example.
   - Getting this wrong previously broke `/admin/orders` entirely
     (showed "No orders" for real, brand-new orders) with no visible
     error, because the empty-state UI looks identical to a query that
     silently failed. The same silent failure mode can hit any page
     built on any of these tables, or any future table with the same
     shape.

2. **Read every migration in a push, not just the new one — every
   time.** Before running `supabase db push`, list what's pending
   (`supabase migration list`) and explicitly call out anything
   destructive (`DELETE`, `DROP`, `TRUNCATE`, data-altering `ALTER`) and
   exactly what it affects, on *any* table — before the push runs, not
   as an after-the-fact caveat.
   - This project has learned this the hard way:
     `20260814000000_reset_feelz_order_numbering.sql` runs
     `delete from public.orders` and was written for a one-time reset
     against test data. Because the project had never been CLI-linked
     before, `db push` applied the *entire* migration history at once,
     including this one, against production — wiping 2 real live
     orders with no way to recover them (Free plan, no backups). The
     next destructive migration added for any other table (inventory,
     appointments, experts, whatever) carries the exact same risk if
     this step is skipped.

3. **Verify the actual data path after a change, not just that it
   builds — for whatever feature changed.** "TypeScript compiles" and
   "the route returns HTTP 200" are not sufficient for orders, staff,
   inventory, appointments, or any other page — a broken query and a
   genuinely empty table render identically. Load the real page and
   confirm real rows show up, for whatever was actually touched.

4. **Never deploy to the live Supabase project unprompted — for any
   change, however small it looks.** State plainly what's being pushed
   and whether it's reversible, and get explicit go-ahead first — every
   time, not just when reminded, and not just for changes that look
   risky at a glance.
