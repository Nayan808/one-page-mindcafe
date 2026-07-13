# Auth, login routes & roles — how it's all wired up

One Supabase Auth instance backs everything on this site — there's no
separate login system per role. What changes per route is (a) which
providers are offered and (b) what `profiles.role` value is required to
get past the door. This doc is the map.

## 1. Every login route

| Route | Who it's for | Providers | On success | Self-signup? |
| --- | --- | --- | --- | --- |
| `/login` | Customers | Google OAuth + email/password | `?returnTo=` path, or `/` | Yes, at `/signup` |
| `/signup` | Customers | Google OAuth + email/password | Same as `/login` | — |
| `/expert/login` | Experts | Email/password only | `/expert/dashboard` | **No** — admin-provisioned only |
| `/employer/login` | Employers | Email/password only | `/employer/dashboard` | **No** — provisioned only (manually, see §4) |
| `/staff` | Pickup-desk staff | **Not Supabase Auth at all** — a single shared password | Same page, unlocked | N/A |

**Why expert/employer login skips Google and signup:** these aren't
public self-serve accounts — someone (an admin, or you by hand) has to
grant the role first. Google OAuth would let anyone create an account,
but a fresh Google sign-in always lands as `role='customer'` (see §2), so
it wouldn't get them anywhere on those two routes anyway. Keeping it to
email/password only avoids a confusing "why did Google sign-in not work"
moment.

**`/staff` is a completely separate mechanism.** It doesn't use
`auth.users`/`profiles` at all — it's gated by either the
`STAFF_DASHBOARD_PASSWORD` Edge Function secret (see `MANUAL_SETUP.md` §6,
§11), which sees every pickup location's queue, or a single location's
`pickup_locations.staff_pin` (set/rotated at `/admin/pickup-locations`),
which scopes the dashboard to only that location's pickups — a PIN holder
gets a 404 on another location's pickup code, not just a filtered list.
Either way there's no per-person staff account, no role, no connection to
anything below.

## 2. How role-gating actually works

Every account has exactly one row in `public.profiles`, with a `role`
column: `'customer' | 'expert' | 'employer' | 'admin' | 'super_admin'`.

- **New sign-up (any provider, any route) always lands as `role='customer'`.**
  This is hardcoded in the `handle_new_user()` trigger (`setup.sql`) — it
  fires on every `auth.users` insert, no exceptions, and always inserts
  `role: 'customer'`.
- **Nothing in the frontend can change your own role.** There's a
  database trigger, `prevent_role_self_escalation()`, that blocks any
  `UPDATE` to `profiles.role` unless the caller already has
  `role='super_admin'`, or the update comes from the `service_role` key
  (Edge Functions only, never exposed to the browser).
- **`/expert/login` and `/employer/login` check the role after sign-in**
  (`RoleLoginForm.tsx`): if `profiles.role` doesn't match what the route
  expects, it shows an error and immediately signs the account back out —
  a customer account can authenticate there, it just won't get in.

This means: **the only way an account ever becomes `expert`/`employer`/
`admin`/`super_admin` is a deliberate, privileged action** — either an
existing super_admin doing it, or a direct database write. There is no
self-service path, by design.

### `admin` vs `super_admin`

These two are **not** independent roles — `super_admin` is a strict
superset. `is_admin()` (the function nearly every RLS write policy on
this project keys off — `products`, `coupons`, `pickup_locations`,
`faqs`, `therapy_categories`, `milestones`, `site_settings`,
`business_leads`, and the gate on `admin-create-expert`) returns true for
**both** `role='admin'` and `role='super_admin'`. So a super_admin can do
everything an admin can, with no extra step.

They diverge on exactly one thing: **changing someone's role.**
`prevent_role_self_escalation()` checks `is_super_admin()` specifically,
not `is_admin()` — so a plain `admin` account cannot promote a customer to
`expert`, cannot mint another `admin`, and cannot demote anyone, even
though `admin` can otherwise reach almost every privileged table in the
app. Only `super_admin` (or the `service_role` key, i.e. Edge Functions)
can touch the `role` column at all.

**Why split it this way:** without this, any admin account — including
one that's compromised or just careless — could grant itself or anyone
else more admins, or strip access from other admins, using nothing more
than a normal authenticated API call (RLS's `profiles_update` policy lets
`is_admin()` update *any* profile row; only the trigger stopped role
specifically). Splitting role-management out to a smaller, separately-
gated tier means day-to-day admin work (managing coupons, pickup
locations, reviewing business leads, onboarding experts) doesn't require
trusting someone with the ability to reshape who has access to what.

## 3. ⚠️ You currently have zero admin *and* zero super_admin accounts

Checked the live database while writing this: **`profiles` has 0 rows
with `role in ('admin', 'super_admin')`.** This is a real bootstrap gap —
`admin-create-expert` requires an `admin`-or-higher caller, and *changing
anyone's role* requires a `super_admin` caller, so right now nothing in
the app can grant either tier.

**To create your first super_admin**, run this once (replace the email
with whichever account should be first — sign up normally at `/signup` or
`/login` first if it doesn't exist yet). Bootstrap as `super_admin`, not
plain `admin` — only a super_admin can promote further accounts later,
so starting one tier down would just recreate this same bootstrap problem
for anyone you try to add next:

```bash
supabase db query --linked "
  update public.profiles set role = 'super_admin'
  where id = (select id from auth.users where email = 'you@example.com');
"
```

This is the one and only step that has to happen outside the app. From
there, promoting someone to `admin` (day-to-day operational access) or to
another `super_admin` (can also manage roles) is the same shape of
command — there's no admin UI for either yet (see §6), so it's still a
`db query` either way for now:

```bash
supabase db query --linked "
  update public.profiles set role = 'admin'  -- or 'super_admin'
  where id = (select id from auth.users where email = 'someone@example.com');
"
```

## 4. Creating expert & employer accounts

**Experts** — use the `admin-create-expert` Edge Function, called with an
`admin` or `super_admin` access token (creating a third party's account
doesn't touch the caller's own role, so plain `admin` is enough — see §2
for why role *changes* specifically are more restricted):

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/admin-create-expert \
  -H "Authorization: Bearer <admin's access token>" \
  -H "apikey: <anon key>" -H "Content-Type: application/json" \
  -d '{
    "email": "expert@example.com",
    "password": "a-temporary-password",
    "name": "Full Name",
    "photo_url": "https://...",
    "bio": "Short bio",
    "specialties": ["individual", "family-relationship"],
    "certifications": ["Clinical Psychologist"]
  }'
```

This does three things atomically-ish: creates the `auth.users` row,
promotes their `profiles.role` to `'expert'`, and creates the linked
`experts` row — all in one call, which is exactly why the function exists
rather than doing this by hand in three places. Use this when the person
**doesn't have an account yet**.

**If the person already signed up** (e.g. they used Google sign-in as a
regular customer before you were ready to onboard them) — don't create a
second account. Instead, in `/admin/experts`, edit their directory entry
and use **"link this account"**, which finds their existing profile by
email and links it instead of minting a new login. This is `super_admin`-
only (linking changes `profiles.role`, same restriction as any other role
change — see §2); a plain `admin` can see the directory entry is unlinked
but can't complete the link themselves.

**Important:** the 5 experts currently shown on `/experts` and
`/counselling` (Arouba Kabir, Swami Mukundananda, Anushka Gaur, Shreyasi
Walia, Harshita Gurbani) were seeded as **directory-only listings** —
real people, real photos, but **no login access**. `experts.profile_id`
is `null` for all five. They can't sign in at `/expert/login` until
someone runs `admin-create-expert` for them (or links an existing account
by hand). Don't be surprised when their real email/password doesn't work
there — there isn't one yet.

**Employers** — there's no equivalent function; `role='employer'` has no
supporting schema beyond the enum value itself (no `employers`/
`organizations` table, no employee-to-employer linking). To manually
provision one right now:

```bash
# 1. Have them sign up normally at /signup (or create via Admin API)
# 2. Promote the role:
supabase db query --linked "
  update public.profiles set role = 'employer'
  where id = (select id from auth.users where email = 'employer@example.com');
"
```

They'll then get into `/employer/dashboard` — which today is just a
"coming soon" placeholder (see Phase 4 summary), since there's nowhere to
pull real usage data from yet.

## 5. What each role actually sees once logged in

| Role | Landing page | What's there |
| --- | --- | --- |
| `customer` | `/account` | Profile edit, saved addresses, order history, counselling appointments |
| `expert` | `/expert/dashboard` | Their own appointment queue (pending → confirm/decline, confirmed → complete/cancel) — reads/writes are RLS-scoped to `experts.profile_id = auth.uid()`, they can't see anyone else's bookings |
| `employer` | `/employer/dashboard` | Placeholder only — no real data source yet |
| `admin` | *(nothing dedicated)* | No admin UI exists. Admin status matters entirely at the RLS layer — `is_admin()` unlocks write access to `products`, `coupons`, `pickup_locations`, `faqs`, `therapy_categories`, `milestones`, `site_settings`, read access to `business_leads`, and is the gate on `admin-create-expert`. All of that is exercised via `supabase db query` / SQL Editor / direct Edge Function calls today, not a page in this app. **Cannot** change anyone's role. |
| `super_admin` | *(nothing dedicated)* | Everything `admin` can do, **plus** the only role that can change `profiles.role` (promote/demote anyone, including other admins) — see §2. Still no dedicated UI; still exercised via `db query`/Edge Functions. |
| *(none / staff password)* | `/staff` | Pickup-code lookup, mark-collected, pending-pickup queue — entirely separate from everything above |

## 6. Not built (by design, for now)

- **No admin dashboard/UI.** Every admin action (create a coupon, edit a
  therapy category) and every role change (which now needs `super_admin`
  specifically) goes through `supabase db query` or the SQL Editor. Fine
  at current scale; worth a real UI once someone other than you needs to
  do this regularly.
- **No self-service "become an expert" flow**, and there shouldn't be —
  anyone claiming to be a certified counsellor needs a human to verify
  that first.
- **No employer→employee linking.** `role='employer'` exists but nothing
  connects an employer account to which customers work at that company,
  so there's no way to compute real EAP usage stats yet even if you
  wanted to build the dashboard out further.
