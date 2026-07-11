// Triggered by a Supabase Database Webhook on `orders` UPDATE (configure
// in the dashboard: Database -> Webhooks -> orders -> UPDATE -> this
// function's URL). Notifies the customer by email and SMS when status
// changes to something worth notifying about. Only acts when `status`
// actually changed, since the webhook fires on every column update.
//
// Works for both account and guest orders: account orders get the email
// from auth.users, guest orders get it from orders.guest_email/guest_phone
// (set by create-order at checkout). 'ready_for_pickup' additionally
// carries the pickup_code, since that's the customer's only proof-of-
// purchase at the pickup point if they've closed the confirmation tab.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { jsonResponse } from "../_shared/cors.ts";

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: "Your order has been confirmed!",
  packed: "Your order has been packed.",
  ready_for_pickup: "Your order is ready for pickup!",
  picked_up: "Your order has been collected. Thanks!",
  shipped: "Your order has shipped.",
  out_for_delivery: "Your order is out for delivery.",
  delivered: "Your order has been delivered.",
  cancelled: "Your order was cancelled.",
};

type DbWebhookPayload = {
  type: "UPDATE";
  table: string;
  record: { id: string; status: string; fulfillment_type: string; pickup_code: string | null; order_number: string };
  old_record: { status: string } | null;
};

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = Deno.env.get("EMAIL_PROVIDER_API_KEY");
  if (!apiKey) {
    console.warn("EMAIL_PROVIDER_API_KEY not set — skipping notification email");
    return;
  }

  // Swap this block for whichever provider you pick (Resend shown here as
  // an example — https://resend.com/docs/api-reference/emails/send-email).
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "MindCafe <orders@mindcafe.app>", to, subject, text }),
  });

  if (!res.ok) console.error("Email send failed", await res.text());
}

async function sendSms(to: string, text: string): Promise<void> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!accountSid || !authToken || !fromNumber) {
    console.warn("TWILIO_* env vars not set — skipping notification SMS");
    return;
  }

  // Swap this block for whichever SMS provider you pick — Twilio's
  // Messages API shown here (https://www.twilio.com/docs/sms/send-messages).
  const auth = btoa(`${accountSid}:${authToken}`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: fromNumber, Body: text }),
  });

  if (!res.ok) console.error("SMS send failed", await res.text());
}

Deno.serve(async (req) => {
  const payload = (await req.json()) as DbWebhookPayload;
  const { record, old_record } = payload;

  if (!record || record.status === old_record?.status) {
    return jsonResponse({ skipped: true });
  }

  const message = STATUS_MESSAGES[record.status];
  if (!message) return jsonResponse({ skipped: true });

  const sb = serviceRoleClient();

  const { data: order } = await sb
    .from("orders")
    .select("user_id, order_number, guest_email, guest_phone")
    .eq("id", record.id)
    .single();
  if (!order) return jsonResponse({ skipped: true, reason: "order not found" });

  let email: string | null = order.guest_email;
  let phone: string | null = order.guest_phone;

  if (order.user_id) {
    const { data: authUser } = await sb.auth.admin.getUserById(order.user_id);
    email = authUser?.user?.email ?? null;
    if (!phone) {
      const { data: profile } = await sb.from("profiles").select("phone").eq("id", order.user_id).maybeSingle();
      phone = profile?.phone ?? null;
    }
  }

  const pickupNote =
    record.status === "ready_for_pickup" && record.pickup_code
      ? ` Show code ${record.pickup_code} at pickup (or the QR code on your confirmation page).`
      : "";
  const fullMessage = `Order ${order.order_number}: ${message}${pickupNote}`;

  const sends: Promise<void>[] = [];
  if (email) sends.push(sendEmail(email, `Order ${order.order_number}: ${message}`, fullMessage));
  if (phone) sends.push(sendSms(phone, fullMessage));

  if (sends.length === 0) return jsonResponse({ skipped: true, reason: "no email or phone on this order" });

  await Promise.all(sends);
  return jsonResponse({ sent: true, email: Boolean(email), sms: Boolean(phone) });
});
