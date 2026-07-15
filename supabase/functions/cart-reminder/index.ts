// Scheduled, same shape as pickup-reminder. Signed-in carts only — a
// guest cart has no email captured until checkout's payment step
// (guest.email is on the order, not the cart), so there's genuinely
// nothing to email a guest at before they've placed an order. Extending
// this to guests would need collecting an email earlier in the funnel,
// which is a UX change, not a notifications one.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { sendEmail } from "../_shared/email.ts";
import { jsonResponse } from "../_shared/cors.ts";

const REMINDER_AFTER_HOURS = 24;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");

  const sb = serviceRoleClient();
  const cutoff = new Date(Date.now() - REMINDER_AFTER_HOURS * 60 * 60 * 1000).toISOString();

  const { data: carts, error } = await sb
    .from("carts")
    .select("id, user_id, cart_items(id)")
    .eq("status", "active")
    .not("user_id", "is", null)
    .is("reminder_sent_at", null)
    .lt("updated_at", cutoff);

  if (error) {
    console.error("cart-reminder: query failed", error);
    return jsonResponse({ error: error.message }, 500);
  }

  let sent = 0;
  for (const cart of carts ?? []) {
    if (!cart.cart_items || cart.cart_items.length === 0) continue;
    if (!cart.user_id) continue;

    const { data: authUser } = await sb.auth.admin.getUserById(cart.user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    await sendEmail(
      email,
      "You left something in your cart — MindCafe",
      "Your feelz are still waiting in your cart. Head back to /feelz to pick up where you left off.",
    );
    await sb.from("carts").update({ reminder_sent_at: new Date().toISOString() }).eq("id", cart.id);
    sent++;
  }

  return jsonResponse({ checked: carts?.length ?? 0, sent });
});
