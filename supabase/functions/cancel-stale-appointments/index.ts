// Scheduled via pg_cron every 5 minutes (see migration 20260724070000 for
// the SQL function this calls, and 20260724080000 for the cron job
// pointing at this function). Cancels appointments still "awaiting
// payment" (status = 'pending', payment_status <> 'paid' -- same
// definition the expert dashboard's "awaiting payment" section uses) 30
// minutes after creation.
//
// Routed through an edge function rather than pg_cron calling the SQL
// function directly: prevent_customer_appointment_tampering() only
// allows a status change from service_role, an admin, or the assigned
// expert -- auth.role() only resolves to 'service_role' for a request
// that actually goes through the Supabase API with the service-role key,
// which serviceRoleClient() here provides. A bare pg_cron -> SQL call has
// no such auth context and gets rejected by that trigger.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (_req) => {
  const sb = serviceRoleClient();
  const { error } = await sb.rpc("cancel_stale_pending_appointments");

  if (error) {
    console.error("cancel_stale_pending_appointments failed", error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ ok: true });
});
