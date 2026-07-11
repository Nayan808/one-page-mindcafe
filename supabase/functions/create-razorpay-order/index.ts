// Creates a Razorpay order server-side before Checkout.js opens on the
// client — Razorpay requires this two-step flow so the amount can never
// be tampered with client-side. Called by the logged-in customer via
// supabase.functions.invoke right after they place an order.
//
// NOTE: for the Feelz one-pager checkout, create-order does this whole
// flow (price lookup + coupon + Razorpay order) in a single call — this
// function is kept for the older path where the order row already exists
// and just needs its Razorpay order created against an already-computed
// total.
import { userScopedClient, serviceRoleClient } from "../_shared/supabaseClients.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const { order_id } = await req.json();
  if (!order_id) return jsonResponse({ error: "order_id is required" }, 400);

  const callerClient = userScopedClient(req);
  const {
    data: { user },
  } = await callerClient.auth.getUser();
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  // orders_select RLS (owner-or-admin) is the ownership check here — a
  // caller can only fetch (and therefore only create a payment for)
  // their own order.
  const { data: order, error } = await callerClient
    .from("orders")
    .select("id, total, payment_method, status")
    .eq("id", order_id)
    .single();

  if (error || !order) return jsonResponse({ error: "Order not found" }, 404);
  if (order.payment_method !== "razorpay") return jsonResponse({ error: "Order is not a Razorpay order" }, 400);
  if (order.status !== "placed") return jsonResponse({ error: `Order already ${order.status}` }, 409);

  const amountPaise = Math.round(Number(order.total) * 100);
  const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const auth = btoa(`${keyId}:${keySecret}`);

  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: order.id }),
  });

  if (!razorpayRes.ok) {
    console.error("Razorpay order creation failed", await razorpayRes.text());
    return jsonResponse({ error: "Failed to create Razorpay order" }, 502);
  }

  const razorpayOrder = await razorpayRes.json();

  // Writing razorpay_order_id back requires service_role — orders' update
  // RLS policy is admin-only from a client's perspective, and this write
  // has already been authorized above via the ownership check.
  const sb = serviceRoleClient();
  await sb.from("orders").update({ razorpay_order_id: razorpayOrder.id }).eq("id", order.id);

  return jsonResponse({
    razorpay_order_id: razorpayOrder.id,
    amount: amountPaise,
    currency: "INR",
    key_id: keyId,
  });
});
