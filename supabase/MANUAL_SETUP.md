# Manual setup checklist

Everything in this project that can't be scripted — dashboard clicks,
third-party accounts, secrets. Fully self-contained: schema (`setup.sql`)
and Edge Function source (`functions/`) both live right here in this
`supabase/` folder, no other project/folder needed. Go through in order;
later steps depend on earlier ones.

Replace `<project-ref>` below with your actual Supabase project ref
(Dashboard → Project Settings → General → Reference ID).

For how login routes, roles (customer/expert/employer/admin), and the
staff dashboard password all fit together — including the one manual step
needed to create your first admin account — see
[`AUTH_AND_ROLES.md`](./AUTH_AND_ROLES.md).

## 1. Create the Supabase project (if you haven't already)

[supabase.com/dashboard](https://supabase.com/dashboard) → New project.
Pick a region, set a database password (save it somewhere safe — you
won't need it for the app itself, but you'll want it if you ever connect
via `psql`).

## 2. Run the database schema

Dashboard → SQL Editor → New query → paste the entire contents of
[`setup.sql`](./setup.sql) → Run. Builds every table, function, and RLS
policy, seeds the 4 Feelz products + 2 Zostel pickup points, and enables
Realtime on all 25 tables. Idempotent — safe to re-run if something only
partially applied.

## 3. Frontend env vars

Dashboard → Project Settings → API → copy **Project URL** and the
**anon / public** key into `one_page-mindcafe/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from dashboard>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<razorpay key id, see step 7>
```

Then the same three vars on Vercel: Project → Settings → Environment
Variables, for both **Production** and **Development** (and **Preview**
if you want branch deploys to work too).

## 4. Google OAuth (sign-in)

1. [Google Cloud Console](https://console.cloud.google.com) → APIs &
   Services → Credentials → **Create OAuth client ID** → Application type
   **Web application**.
2. Authorized redirect URI:
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → **Google** → paste
   the Client ID + Client Secret → Enable.
4. Authentication → URL Configuration → add your site URL(s) (production
   domain once deployed, plus `http://localhost:3000` for local dev) to
   the allowed redirect list — otherwise the OAuth callback will bounce.

## 5. Link the CLI and deploy Edge Functions

From this project's root (`one_page-mindcafe/`):

```bash
supabase link --project-ref <project-ref>
cd supabase
supabase functions deploy create-order --no-verify-jwt
supabase functions deploy create-razorpay-order --no-verify-jwt
supabase functions deploy payment-webhook --no-verify-jwt
supabase functions deploy create-shiprocket-shipment --no-verify-jwt
supabase functions deploy shiprocket-tracking-webhook --no-verify-jwt
supabase functions deploy order-status-notifier --no-verify-jwt
supabase functions deploy appointment-notifier --no-verify-jwt
supabase functions deploy merge-guest-cart --no-verify-jwt
supabase functions deploy cleanup-reservations --no-verify-jwt
supabase functions deploy staff-pickup --no-verify-jwt
supabase functions deploy admin-create-expert --no-verify-jwt
```

`--no-verify-jwt` matters — `create-order` and `merge-guest-cart` accept
guest/anon callers and do their own auth checks internally; the
platform-level JWT gate would otherwise reject guest calls before the
function ever runs.

## 6. Edge Function secrets

Dashboard → Edge Functions → Manage secrets, or:

```bash
supabase secrets set RAZORPAY_KEY_ID=...
```

| Secret | Used by | Where to get it |
| --- | --- | --- |
| `RAZORPAY_KEY_ID` | `create-order`, `create-razorpay-order`, `payment-webhook` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | same | same |
| `RAZORPAY_WEBHOOK_SECRET` | `payment-webhook` | Set when you create the webhook in step 7 |
| `SHIPROCKET_EMAIL` | `create-shiprocket-shipment` | Your Shiprocket account login |
| `SHIPROCKET_PASSWORD` | `create-shiprocket-shipment` | Same |
| `SHIPROCKET_WEBHOOK_SECRET` | `shiprocket-tracking-webhook` | Make up any random string — you set this same value in both the secret and the Shiprocket webhook URL (step 8) |
| `EMAIL_PROVIDER_API_KEY` | `order-status-notifier` | [Resend](https://resend.com) API key (or swap the provider in that function) |
| `STAFF_DASHBOARD_PASSWORD` | `staff-pickup` | Make up a password — this is what `/staff` is gated behind |

`SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` are
auto-injected into every Edge Function — don't set those yourself.

Nothing above needs to be pasted into chat — enter values directly in the
dashboard or CLI.

## 7. Razorpay

1. [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API
   Keys → generate a key pair. Put the key id in
   `NEXT_PUBLIC_RAZORPAY_KEY_ID` (step 3) and both values in the
   `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` secrets (step 6).
2. Settings → Webhooks → **Add New Webhook**:
   - URL: `https://<project-ref>.supabase.co/functions/v1/payment-webhook`
   - Active events: `payment.captured`, `payment.failed`
   - Copy the webhook secret it generates into `RAZORPAY_WEBHOOK_SECRET`
     (step 6) — `payment-webhook` verifies every request against this and
     rejects anything that doesn't match, so this has to be exact.
3. Start in **Test Mode** and use Razorpay's test card numbers until
   you've been through the testing checklist, then switch to live keys.

## 8. Shiprocket

1. Create/log into a [Shiprocket](https://www.shiprocket.in) account.
2. Settings → API → generate API access (this is what
   `SHIPROCKET_EMAIL`/`SHIPROCKET_PASSWORD` authenticate as).
3. Add a pickup location named exactly **Primary** (Settings → Pickup
   Addresses) — `create-shiprocket-shipment` hardcodes `pickup_location:
   "Primary"` when creating orders, so the name has to match.
4. Settings → API → Webhooks → add:
   `https://<project-ref>.supabase.co/functions/v1/shiprocket-tracking-webhook?secret=<SHIPROCKET_WEBHOOK_SECRET>`
   using the same secret you set in step 6.
5. AWB/courier assignment is **not automated** — after a shipment is
   created you still need to assign a courier from the Shiprocket
   dashboard per order (or build a follow-up automation later).
6. Package weight/dimensions sent to Shiprocket are currently hardcoded
   placeholders in `create-shiprocket-shipment` (10×10×10cm, 0.5kg) —
   fine for wellness strips, but revisit if that changes.

## 9. Database Webhooks (the two DB-triggered functions)

Dashboard → Database → Webhooks → **Create a new hook**, twice:

| Table | Events | Type | URL |
| --- | --- | --- | --- |
| `orders` | Update | HTTP Request | `https://<project-ref>.supabase.co/functions/v1/order-status-notifier` |
| `orders` | Update | HTTP Request | `https://<project-ref>.supabase.co/functions/v1/create-shiprocket-shipment` |
| `appointments` | Insert, Update | HTTP Request | `https://<project-ref>.supabase.co/functions/v1/appointment-notifier` |

All three no-op harmlessly on events they don't care about, so it's safe
to point the `orders` ones at every UPDATE and the `appointments` one at
every Insert + Update.

## 10. Schedule `cleanup-reservations`

Releases expired stock holds every 5 minutes. Dashboard → Edge Functions
→ `cleanup-reservations` → Cron, schedule `*/5 * * * *`. (Or `pg_cron`
calling it via `pg_net` if you'd rather do it from SQL.)

## 11. Staff dashboard

Nothing to configure beyond `STAFF_DASHBOARD_PASSWORD` (step 6) — visit
`/staff` on the deployed site and enter that password.

## 12. Coupons (optional)

No admin UI for these yet — create them directly via SQL Editor:

```sql
insert into public.coupons (code, discount_type, discount_value, min_order_amount)
values ('FEELZ10', 'percent', 10, 0);
```

## 13. Before going live

- Switch Razorpay from test to live keys (step 7) once the testing
  checklist passes.
- Run one real end-to-end order of each kind (delivery, Zostel pickup)
  with a real small amount before announcing the site.
- Confirm Realtime actually shows live status updates: place a test
  order and watch the confirmation screen flip from "pending" to
  "confirmed"/"ready for pickup" without refreshing.
