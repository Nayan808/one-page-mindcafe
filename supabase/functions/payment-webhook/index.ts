// Razorpay calls this directly when a payment is captured. Verifies the
// webhook signature, then confirms whichever kind of row the Razorpay
// order belongs to — a Feelz order (confirm_order_and_decrement_stock,
// refunding if stock turned out insufficient) or a counselling
// appointment (confirm_appointment_payment, no stock involved) — by
// razorpay_order_id. The frontend NEVER marks either paid on its own;
// this function is the single source of truth for both.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { jsonResponse } from "../_shared/cors.ts";

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

async function refundPayment(paymentId: string): Promise<void> {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const auth = btoa(`${keyId}:${keySecret}`);

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({}), // full refund
  });

  if (!res.ok) {
    console.error(`Refund failed for payment ${paymentId}: ${res.status} ${await res.text()}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

  const isValid = await verifySignature(rawBody, signature, secret);
  if (!isValid) return jsonResponse({ error: "Invalid signature" }, 401);

  const payload = JSON.parse(rawBody);

  // Only act on successful captures — acknowledge everything else so
  // Razorpay doesn't keep retrying events we don't care about.
  if (payload.event !== "payment.captured") {
    return jsonResponse({ received: true, ignored: payload.event });
  }

  const payment = payload.payload.payment.entity;
  const razorpayOrderId: string = payment.order_id;
  const paymentId: string = payment.id;

  const sb = serviceRoleClient();

  const { data: order } = await sb
    .from("orders")
    .select("id")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (order) {
    const { data: result, error: confirmError } = await sb.rpc("confirm_order_and_decrement_stock", {
      p_order_id: order.id,
      p_payment_ref: paymentId,
    });

    if (confirmError) {
      console.error("confirm_order_and_decrement_stock failed", confirmError);
      return jsonResponse({ error: confirmError.message }, 500);
    }

    if (result === "cancelled_insufficient_stock") {
      await refundPayment(paymentId);
      console.warn(`Order ${order.id} cancelled (insufficient stock); refunded payment ${paymentId}`);
    }

    return jsonResponse({ received: true, result });
  }

  const { data: appointment } = await sb
    .from("appointments")
    .select("id")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (appointment) {
    const { data: result, error: confirmError } = await sb.rpc("confirm_appointment_payment", {
      p_appointment_id: appointment.id,
      p_payment_ref: paymentId,
    });

    if (confirmError) {
      console.error("confirm_appointment_payment failed", confirmError);
      return jsonResponse({ error: confirmError.message }, 500);
    }

    return jsonResponse({ received: true, result });
  }

  console.error("No order or appointment found for razorpay_order_id", razorpayOrderId);
  return jsonResponse({ error: "Order not found" }, 404);
});
