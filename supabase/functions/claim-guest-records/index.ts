// Called right after a phone/WhatsApp sign-in (alongside merge-guest-cart)
// to reattach any guest orders/appointments placed with the same phone
// number to the now-authenticated account, so "I ordered as a guest, then
// signed up with that same number" lands on one account instead of two.
//
// Only ever claims rows where user_id IS NULL — an unclaimed guest order/
// appointment has no owner to protect, so reassigning it to whoever just
// proved (via WhatsApp OTP) they control the phone number it was placed
// under is safe. This never touches a row that already belongs to a
// *different* authenticated account — matching guest_phone text against
// another customer's delivery/consultation phone would let anyone who
// happens to control that number today absorb someone else's order
// history, which is exactly the account-takeover shape this avoids.
//
// The phone used for matching always comes from the caller's own verified
// JWT (via sb.auth.getUser()), never from the request body — a client
// can't pass an arbitrary phone number to go claim other people's guest
// orders.
import { userScopedClient, serviceRoleClient } from "../_shared/supabaseClients.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

function last10Digits(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const sb = userScopedClient(req);
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  const callerDigits = last10Digits(user.phone);
  if (!callerDigits) return jsonResponse({ claimed_orders: 0, claimed_appointments: 0, reason: "no verified phone" });

  const admin = serviceRoleClient();

  async function claim(table: "orders" | "appointments"): Promise<number> {
    const { data: candidates } = await admin.from(table).select("id, guest_phone").is("user_id", null).not("guest_phone", "is", null);

    const matchIds = (candidates ?? [])
      .filter((row: { guest_phone: string | null }) => last10Digits(row.guest_phone) === callerDigits)
      .map((row: { id: string }) => row.id);

    if (matchIds.length === 0) return 0;

    const { error } = await admin.from(table).update({ user_id: user.id }).in("id", matchIds);
    return error ? 0 : matchIds.length;
  }

  const [claimedOrders, claimedAppointments] = await Promise.all([claim("orders"), claim("appointments")]);

  return jsonResponse({ claimed_orders: claimedOrders, claimed_appointments: claimedAppointments });
});
