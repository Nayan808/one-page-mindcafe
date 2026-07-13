// Server-side entry point for booking a paid counselling session: looks
// up the real session price (site_settings['counselling_session_price']),
// validates an optional coupon (must have applies_to in
// ('appointments','both') — an order-only coupon can't be used here),
// creates the appointment row, and either:
//   - the coupon brings the total to ₹0 — marks it paid immediately via
//     confirm_appointment_payment, no Razorpay order needed at all, or
//   - creates a matching Razorpay order the same way create-order does,
//     so nothing about the amount is ever trusted from the client.
import { userScopedClient, serviceRoleClient } from "../_shared/supabaseClients.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const VALID_CATEGORIES = ["individual", "child-adolescent", "family-relationship", "specialized"];
const DEFAULT_SESSION_PRICE = 999;

type RequestBody = {
  therapy_category: string;
  expert_id?: string;
  scheduled_at?: string;
  notes?: string;
  coupon_code?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { therapy_category, expert_id, scheduled_at, notes, coupon_code } = body ?? ({} as RequestBody);

  if (!therapy_category || !VALID_CATEGORIES.includes(therapy_category)) {
    return jsonResponse({ error: "Invalid therapy_category" }, 400);
  }

  // The caller authenticates as themself via the JWT supabase.functions.invoke
  // already attaches — booking always happens on the signed-in user's own
  // account, there's no guest-appointment path.
  const callerClient = userScopedClient(req);
  const {
    data: { user },
  } = await callerClient.auth.getUser();

  if (!user) return jsonResponse({ error: "Sign in required to book a session" }, 401);

  const sb = serviceRoleClient();

  if (expert_id) {
    const { data: expert } = await sb.from("experts").select("id").eq("id", expert_id).eq("is_active", true).maybeSingle();
    if (!expert) return jsonResponse({ error: "Selected expert is unavailable" }, 400);
  }

  const { data: priceSetting } = await sb.from("site_settings").select("value").eq("key", "counselling_session_price").maybeSingle();
  const price = Number(priceSetting?.value ?? DEFAULT_SESSION_PRICE);

  // --- Coupon, validated and priced server-side, same math create-order
  // uses — just restricted to codes that opt into appointments. ---
  let discountAmount = 0;
  let appliedCouponCode: string | null = null;

  if (coupon_code) {
    const { data: coupon } = await sb
      .from("coupons")
      .select("*")
      .eq("code", coupon_code.trim().toUpperCase())
      .maybeSingle();

    if (!coupon || !coupon.is_active || (coupon.expires_at && new Date(coupon.expires_at) < new Date())) {
      return jsonResponse({ error: "Invalid or expired coupon code" }, 400);
    }
    if (coupon.applies_to !== "appointments" && coupon.applies_to !== "both") {
      return jsonResponse({ error: "This coupon isn't valid for counselling sessions" }, 400);
    }
    if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
      return jsonResponse({ error: "This coupon has reached its usage limit" }, 400);
    }
    if (price < Number(coupon.min_order_amount)) {
      return jsonResponse({ error: `This coupon needs a minimum order of ₹${coupon.min_order_amount}` }, 400);
    }

    discountAmount =
      coupon.discount_type === "percent" ? price * (Number(coupon.discount_value) / 100) : Number(coupon.discount_value);
    if (coupon.max_discount_amount !== null) discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
    discountAmount = Math.min(discountAmount, price);
    appliedCouponCode = coupon.code;
  }

  const total = Math.max(0, price - discountAmount);

  const { data: appointment, error: insertError } = await sb
    .from("appointments")
    .insert({
      user_id: user.id,
      therapy_category,
      expert_id: expert_id ?? null,
      scheduled_at: scheduled_at ?? null,
      notes: notes ?? null,
      price,
      discount_amount: discountAmount,
      coupon_code: appliedCouponCode,
      total,
      payment_status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !appointment) {
    console.error("create-appointment-order: failed to insert appointment", insertError);
    return jsonResponse({ error: "Failed to create appointment" }, 500);
  }

  if (appliedCouponCode) {
    await sb.rpc("increment_coupon_usage", { p_code: appliedCouponCode });
  }

  if (total <= 0) {
    const { error: confirmError } = await sb.rpc("confirm_appointment_payment", {
      p_appointment_id: appointment.id,
      p_payment_ref: `coupon:${appliedCouponCode}`,
    });
    if (confirmError) {
      console.error("create-appointment-order: confirm_appointment_payment failed", confirmError);
      return jsonResponse({ error: "Failed to confirm free session" }, 500);
    }

    return jsonResponse({
      appointment_id: appointment.id,
      requires_payment: false,
      price,
      discount_amount: discountAmount,
      total: 0,
    });
  }

  // --- Razorpay order, same two-step flow create-order uses: amount is
  // fixed server-side before Checkout.js ever opens. ---
  const amountPaise = Math.round(total * 100);
  const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const auth = btoa(`${keyId}:${keySecret}`);

  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: appointment.id }),
  });

  if (!razorpayRes.ok) {
    console.error("create-appointment-order: Razorpay order creation failed", await razorpayRes.text());
    // The appointment row already exists as 'pending' payment with no
    // razorpay_order_id — same abandoned-booking shape create-order can
    // leave behind on this failure path today; nothing further to clean
    // up here.
    return jsonResponse({ error: "Failed to create Razorpay order" }, 502);
  }

  const razorpayOrder = await razorpayRes.json();
  await sb.from("appointments").update({ razorpay_order_id: razorpayOrder.id }).eq("id", appointment.id);

  return jsonResponse({
    appointment_id: appointment.id,
    requires_payment: true,
    razorpay_order_id: razorpayOrder.id,
    amount: amountPaise,
    currency: "INR",
    key_id: keyId,
    price,
    discount_amount: discountAmount,
    total,
  });
});
