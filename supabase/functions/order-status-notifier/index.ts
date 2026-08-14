// Triggered by the trg_notify_order_status DB trigger (setup.sql,
// pg_net-based — see notify_webhook()) on `orders` INSERT and UPDATE.
// INSERT is a no-op now (see the comment further down) — everything here
// runs off UPDATE:
//   - status first reaching 'confirmed' — alert the admin/sales inbox
//     that a real (paid, or legitimately free) order came in.
//   - status changing to any other customer-facing milestone — notify
//     the customer.
//   - payment_status moving to a refund state — notify the customer
//     separately, regardless of whether the status-message branch above
//     also fired in the same write.
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

  // INSERT used to email the admin here, for every checkout attempt —
  // including ones the customer then cancelled/abandoned at the Razorpay
  // step, which never became a real sale. create-order inserts the row
  // before payment even runs, so "new order" at INSERT time was really
  // "someone opened checkout," not "someone bought something." The admin
  // notification has moved below, to fire only once status genuinely
  // reaches 'confirmed' (real payment captured, or a fully-discounted
  // free order — both go through confirm_order_and_decrement_stock) —
  // same moment the customer's own "order confirmed" email already fires
  // from the STATUS_MESSAGES block, so admin and customer are notified
  // about the same real event, not two different ones. Abandoned orders
  // now age out silently via cancel_stale_pending_orders (see
  // 20260813000000_auto_cancel_stale_pending_orders.sql) without ever
  // paging anyone.
  if (type === "INSERT") return jsonResponse({ skipped: true, reason: "no longer emails on raw insert" });

  // UPDATE from here — status-change email and/or refund email, either
  // or both may apply depending on what changed in this one write.
  let sentAny = false;

  const statusChanged = record.status !== old_record?.status;
  const paymentChanged = record.payment_status !== old_record?.payment_status;

  if (statusChanged && record.status === "confirmed") {
    // Feelz order alerts go to the Feelz mailbox specifically, not the
    // general admin_notification_email (team@mindcafe.app — that one
    // still covers business leads and every other admin notification).
    const adminEmail = "feelz@mindcafe.app";
    const { text, html } = renderEmail({
      heading: `New order: ${record.order_number}`,
      paragraphs: [`A new ${record.fulfillment_type} order was confirmed and paid — total ₹${record.total}.`],
      cta: { label: "view in admin", url: `${SITE_URL}/admin/orders` },
    });
    await sendEmail(adminEmail, `New order: ${record.order_number}`, text, html);
    sentAny = true;
  }

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
