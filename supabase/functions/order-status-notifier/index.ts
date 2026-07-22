// Triggered by the trg_notify_order_status DB trigger (setup.sql,
// pg_net-based — see notify_webhook()) on `orders` INSERT and UPDATE.
// Two separate jobs depending on which:
//   - INSERT: alert the admin/sales inbox that a new order came in.
//   - UPDATE: notify the customer when status changes to something worth
//     telling them about, and separately notify them if payment_status
//     moves to a refund state (payment_status can change independently
//     of status in the same UPDATE, so this is checked regardless of
//     whether the status-message branch also fired).
//
// Works for both account and guest orders: account orders get the email
// from auth.users, guest orders get it from orders.guest_email (set by
// create-order at checkout). 'ready_for_pickup' additionally carries the
// pickup_code, since that's the customer's only proof-of-purchase at the
// pickup point if they've closed the confirmation tab. 'delivered' is the
// only status with a review-request CTA — nothing else invites a review.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { sendEmail, renderEmail, SITE_URL } from "../_shared/email.ts";
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

const REFUND_MESSAGES: Record<string, string> = {
  refund_required: "We're processing a refund for this order — it'll reach you shortly.",
  refunded: "Your refund has been issued.",
};

type OrderRecord = {
  id: string;
  status: string;
  payment_status: string;
  fulfillment_type: string;
  pickup_code: string | null;
  order_number: string;
  total: number;
};

type DbWebhookPayload = {
  type: "INSERT" | "UPDATE";
  table: string;
  record: OrderRecord;
  old_record: OrderRecord | null;
};

async function resolveCustomerEmail(
  sb: ReturnType<typeof serviceRoleClient>,
  orderId: string,
): Promise<{ email: string | null; order_number: string }> {
  const { data: order } = await sb
    .from("orders")
    .select("user_id, order_number, guest_email")
    .eq("id", orderId)
    .single();
  if (!order) return { email: null, order_number: "" };

  let email: string | null = order.guest_email;
  if (order.user_id) {
    const { data: authUser } = await sb.auth.admin.getUserById(order.user_id);
    email = authUser?.user?.email ?? null;
  }
  return { email, order_number: order.order_number };
}

Deno.serve(async (req) => {
  const payload = (await req.json()) as DbWebhookPayload;
  const { type, record, old_record } = payload;
  if (!record) return jsonResponse({ skipped: true });

  const sb = serviceRoleClient();

  if (type === "INSERT") {
    const { data: setting } = await sb.from("site_settings").select("value").eq("key", "admin_notification_email").maybeSingle();
    const adminEmail = (setting?.value as string) || "team@mindcafe.app";
    const { text, html } = renderEmail({
      heading: `New order: ${record.order_number}`,
      paragraphs: [`A new ${record.fulfillment_type} order came in — total ₹${record.total}.`],
      cta: { label: "view in admin", url: `${SITE_URL}/admin/orders` },
    });
    await sendEmail(adminEmail, `New order: ${record.order_number}`, text, html);
    return jsonResponse({ sent: true, kind: "admin_new_order" });
  }

  // UPDATE from here — status-change email and/or refund email, either
  // or both may apply depending on what changed in this one write.
  let sentAny = false;

  const statusChanged = record.status !== old_record?.status;
  const paymentChanged = record.payment_status !== old_record?.payment_status;

  if (statusChanged && STATUS_MESSAGES[record.status]) {
    const { email, order_number } = await resolveCustomerEmail(sb, record.id);
    if (email) {
      const paragraphs = [STATUS_MESSAGES[record.status]];
      if (record.status === "ready_for_pickup" && record.pickup_code) {
        paragraphs.push(`Show code ${record.pickup_code} at pickup (or the QR code on your confirmation page).`);
      }

      const cta =
        record.status === "delivered"
          ? { label: "leave a review", url: `${SITE_URL}/reviews` }
          : { label: "view your order", url: `${SITE_URL}/account` };

      const { text, html } = renderEmail({ heading: `Order ${order_number}`, paragraphs, cta });
      await sendEmail(email, `Order ${order_number}: ${STATUS_MESSAGES[record.status]}`, text, html);
      sentAny = true;
    }
  }

  if (paymentChanged && REFUND_MESSAGES[record.payment_status]) {
    const { email, order_number } = await resolveCustomerEmail(sb, record.id);
    if (email) {
      const { text, html } = renderEmail({
        heading: `Order ${order_number}: refund update`,
        paragraphs: [REFUND_MESSAGES[record.payment_status]],
        cta: { label: "view your order", url: `${SITE_URL}/account` },
      });
      await sendEmail(email, `Order ${order_number}: refund update`, text, html);
      sentAny = true;
    }
  }

  return jsonResponse(sentAny ? { sent: true } : { skipped: true });
});
