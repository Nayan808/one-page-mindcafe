# Shiprocket setup

Shipping/fulfillment integration for delivery orders (`orders.fulfillment_type
= 'delivery'`). This is a step-by-step guide for activating what's already
built in code — none of these steps can be done from this side, they all
happen in your own Shiprocket account and the Supabase dashboard.

## What already exists in code

- `supabase/functions/create-shiprocket-shipment/index.ts` — fires when a
  delivery order transitions to `confirmed` (via a database trigger, see
  step 5 below). Logs into Shiprocket, creates the shipment, writes
  `shiprocket_order_id`/`shiprocket_shipment_id` back onto the order.
- `supabase/functions/shiprocket-tracking-webhook/index.ts` — public
  endpoint Shiprocket calls with status updates. Updates `orders.status`/
  `awb_code`/`tracking_url` as the shipment moves through Shiprocket's
  lifecycle (picked up → shipped → out for delivery → delivered, or
  cancelled/RTO).
- `orders` table already has the columns these two functions read/write:
  `shiprocket_order_id`, `shiprocket_shipment_id`, `awb_code`,
  `tracking_url`.

## 1. Shiprocket account

1. Create/log into a [Shiprocket](https://www.shiprocket.in) account.
2. Settings → API → generate API access. This is just your normal login
   email/password — Shiprocket's API authenticates with those directly
   (`SHIPROCKET_EMAIL`/`SHIPROCKET_PASSWORD` below), not a separate API
   key like most other services.
3. Settings → Pickup Addresses → add a pickup location with your real
   warehouse/business address. Name it whatever you want — the nickname
   you choose here is what goes in `SHIPROCKET_PICKUP_LOCATION` (step 2).
   `create-shiprocket-shipment` reads that secret rather than a hardcoded
   name, so if you rename it later in Shiprocket, you just update the
   secret — no code change needed.

## 2. Set the secrets

Run these yourself (never paste an actual password/secret value into
chat — these are your credentials):

```bash
supabase secrets set SHIPROCKET_EMAIL=your-shiprocket-login-email
supabase secrets set SHIPROCKET_PASSWORD=your-shiprocket-login-password
supabase secrets set SHIPROCKET_PICKUP_LOCATION="the nickname from step 1.3"
supabase secrets set SHIPROCKET_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

For the last one, `openssl rand -hex 32` generates a random value for you —
run it, note down the value it prints (you'll need it again in step 3), then
set it.

## 3. Register the tracking webhook

Shiprocket dashboard → Settings → API → Webhooks → add:

```
https://<project-ref>.supabase.co/functions/v1/shiprocket-tracking-webhook?secret=<the SHIPROCKET_WEBHOOK_SECRET value from step 2>
```

Replace `<project-ref>` with your actual Supabase project ref, and the
secret with the real value you generated (not the literal placeholder text).

## 4. Deploy the functions

```bash
supabase functions deploy create-shiprocket-shipment --no-verify-jwt
supabase functions deploy shiprocket-tracking-webhook --no-verify-jwt
```

## 5. Trigger wiring (done — nothing for you to do here)

`create-shiprocket-shipment` fires via a plain database trigger
(`trg_notify_shiprocket_shipment`, migration `20260724030000`), the same
`notify_webhook()` pattern every other notifier in this codebase uses — not
a dashboard-configured Database Webhook. This was actually missing for a
while (the function existed and was deployed, but nothing ever called it)
until that migration landed. Nothing to configure manually.

## 6. Test end-to-end

1. Place a real order through checkout with delivery fulfillment, using an
   address whose pincode is in the `serviceable_pincodes` table.
2. Move the order to `confirmed` status (normal payment flow, or manually
   via the admin orders page).
3. Check Supabase Dashboard → Edge Functions →
   `create-shiprocket-shipment` → Logs. You should see either a success
   (and the order should now have `shiprocket_order_id`/
   `shiprocket_shipment_id` set), or a clear error from Shiprocket's API
   telling us exactly what's wrong — send that error here if it fails and
   we'll fix it.
4. In the Shiprocket dashboard, manually assign a courier/AWB to the new
   shipment (this step isn't automated yet — see Known limitations below).
5. Confirm the tracking webhook fires: check the order's `status`,
   `awb_code`, and `tracking_url` updated after courier assignment.

## Known limitations (not done yet, by design — see the codebase's own
comments for the reasoning)

- **Weight/dimensions are hardcoded** (10×10×10cm, 0.5kg for every order) —
  `products`/`product_variants` have no physical-attribute columns yet.
  Fine for lightweight items, but matters if real dimensions ever vary
  enough to affect shipping cost/serviceability.
- **AWB/courier assignment is manual** — after a shipment is created in
  Shiprocket, someone still has to pick a courier from the Shiprocket
  dashboard per order. Not automated.
- **No admin UI** shows `awb_code`/`tracking_url`/`shiprocket_order_id` on
  the `/admin/orders` page yet, even though the data is being written.
