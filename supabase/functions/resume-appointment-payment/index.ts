// Lets a signed-in customer finish paying for a booking they started but
// never completed — /account's appointments dashboard "resume" action.
// Reuses the amount already fixed server-side at booking time
// (appointments.total — never recomputed or trusted from the client) and,
// where one already exists, the same Razorpay order id from the original
// attempt rather than minting a new one; only falls back to creating a
// fresh order if the appointment never got one in the first place (the
// original Razorpay order-creation call itself failed — a real, if rare,
// path create-appointment-order already documents and leaves behind).
import { userScopedClient, serviceRoleClient } from "../_shared/supabaseClients.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let body: { appointment_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const { appointment_id } = body ?? {};
  if (!appointment_id) return jsonResponse({ error: "appointment_id is required" }, 400);

  const callerClient = userScopedClient(req);
  const {
    data: { user },
  } = await callerClient.auth.getUser();
  if (!user) return jsonResponse({ error: "Not signed in" }, 401);

  const sb = serviceRoleClient();

  const { data: appointment, error } = await sb
    .from("appointments")
    .select("id, user_id, total, payment_status, razorpay_order_id")
    .eq("id", appointment_id)
    .maybeSingle();

  if (error || !appointment) return jsonResponse({ error: "Appointment not found" }, 404);
  // Ownership check — guest bookings (user_id null) have no account to
  // resume from here at all; this route is /account-only by design.
  if (appointment.user_id !== user.id) return jsonResponse({ error: "Not your appointment" }, 403);
  if (appointment.payment_status !== "pending" && appointment.payment_status !== "failed") {
    return jsonResponse({ error: "This booking doesn't need payment" }, 400);
  }

  const amountPaise = Math.round(Number(appointment.total) * 100);
  const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;

  if (appointment.razorpay_order_id) {
    return jsonResponse({
      razorpay_order_id: appointment.razorpay_order_id,
      amount: amountPaise,
      currency: "INR",
      key_id: keyId,
    });
  }

  // No order to reuse (the original creation attempt failed) — make one now.
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const auth = btoa(`${keyId}:${keySecret}`);
  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: appointment.id }),
  });

  if (!razorpayRes.ok) {
    console.error("resume-appointment-payment: Razorpay order creation failed", await razorpayRes.text());
    return jsonResponse({ error: "Failed to create Razorpay order" }, 502);
  }

  const razorpayOrder = await razorpayRes.json();
  await sb.from("appointments").update({ razorpay_order_id: razorpayOrder.id }).eq("id", appointment.id);

  return jsonResponse({
    razorpay_order_id: razorpayOrder.id,
    amount: amountPaise,
    currency: "INR",
    key_id: keyId,
  });
});
