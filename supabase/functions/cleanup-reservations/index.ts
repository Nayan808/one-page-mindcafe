// Scheduled to run every 5 minutes (Supabase Dashboard -> Edge Functions
// -> cleanup-reservations -> Cron, schedule `*/5 * * * *`). Releases any
// stock_reservations that expired without the customer completing
// checkout.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (_req) => {
  const sb = serviceRoleClient();
  const { data, error } = await sb.rpc("expire_stock_reservations");

  if (error) {
    console.error("expire_stock_reservations failed", error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ expired: data });
});
