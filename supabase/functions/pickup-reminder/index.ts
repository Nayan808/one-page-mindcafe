// Scheduled (see /api/cron-reminders in the Next.js app + vercel.json),
// not event-triggered like the other notifiers — there's no single write
// to react to for "it's been sitting there a while", only the absence of
// one. Finds takeaway orders that have been ready_for_pickup for at
// least REMINDER_AFTER_HOURS and haven't been reminded yet
// (pickup_reminder_sent_at is the dedup marker, set right after sending
// so a re-run of this function never double-emails the same order).
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { sendEmail } from "../_shared/email.ts";
import { jsonResponse } from "../_shared/cors.ts";

const REMINDER_AFTER_HOURS = 24;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");

  const sb = serviceRoleClient();
  const cutoff = new Date(Date.now() - REMINDER_AFTER_HOURS * 60 * 60 * 1000).toISOString();

  const { data: orders, error } = await sb
    .from("orders")
    .select("id, order_number, user_id, guest_email, pickup_code, pickup_locations:location_id(name, city)")
    .eq("status", "ready_for_pickup")
    .is("pickup_reminder_sent_at", null)
    .lt("updated_at", cutoff);

  if (error) {
    console.error("pickup-reminder: query failed", error);
    return jsonResponse({ error: error.message }, 500);
  }

  let sent = 0;
  for (const order of orders ?? []) {
    let email: string | null = order.guest_email;
    if (order.user_id) {
      const { data: authUser } = await sb.auth.admin.getUserById(order.user_id);
      email = authUser?.user?.email ?? email;
    }
    if (!email) continue;

    const location = order.pickup_locations as unknown as { name: string; city: string } | null;
    const locationNote = location ? ` at ${location.name}, ${location.city}` : "";

    await sendEmail(
      email,
      `Still waiting for you: order ${order.order_number}`,
      `Your order ${order.order_number} has been ready for pickup${locationNote} for over ${REMINDER_AFTER_HOURS} hours. Show code ${order.pickup_code ?? "on your confirmation page"} whenever you're ready to collect it.`,
    );
    await sb.from("orders").update({ pickup_reminder_sent_at: new Date().toISOString() }).eq("id", order.id);
    sent++;
  }

  return jsonResponse({ checked: orders?.length ?? 0, sent });
});
