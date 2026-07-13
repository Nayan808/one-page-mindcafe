// Backs the staff pickup dashboard: lookup by scanned/typed pickup code,
// mark an order collected, and list the current pickup queue.
//
// Two ways in, both checked here (never via RLS — there's no Supabase
// identity backing either):
//   - `password` — the shared STAFF_DASHBOARD_PASSWORD, sees every
//     location's queue. For whoever runs pickups centrally.
//   - `pin` — a single pickup_locations.staff_pin, scoped to just that
//     location: list_pending only returns that location's orders, and
//     lookup/collect 404 on an order placed for a different location
//     (same response as "not found" — a scoped PIN holder shouldn't be
//     able to tell a code exists at all, just that it's not theirs).
// A request that fails both checks never touches any order data.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type RequestBody =
  | { action: "lookup"; password?: string; pin?: string; code: string }
  | { action: "collect"; password?: string; pin?: string; order_id: string }
  | { action: "list_pending"; password?: string; pin?: string };

const ORDER_SELECT =
  "id, order_number, status, payment_status, pickup_code, pickup_code_collected_at, created_at, " +
  "guest_name, guest_phone, location_id, pickup_slot, total, " +
  "order_items(quantity, unit_price, product_variants(variant_label, products(name))), " +
  "pickup_locations:location_id(name, city)";

type Auth = { ok: true; locationId: string | null } | { ok: false; locationId: null };

async function authenticate(body: RequestBody, sb: ReturnType<typeof serviceRoleClient>): Promise<Auth> {
  const masterPassword = Deno.env.get("STAFF_DASHBOARD_PASSWORD");
  if (body.password && masterPassword && body.password === masterPassword) {
    return { ok: true, locationId: null };
  }

  const pin = body.pin?.trim().toUpperCase();
  if (pin) {
    const { data: location } = await sb.from("pickup_locations").select("id").eq("staff_pin", pin).maybeSingle();
    if (location) return { ok: true, locationId: location.id };
  }

  return { ok: false, locationId: null };
}

function customerLabel(order: { guest_name: string | null }): string {
  // Account orders don't carry a name on the order row itself — this
  // dashboard only needs *a* label to show staff, not full profile detail.
  return order.guest_name ?? "Account customer";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const sb = serviceRoleClient();
  const auth = await authenticate(body, sb);
  if (!auth.ok) return jsonResponse({ error: "Incorrect password or PIN" }, 401);
  const { locationId } = auth;

  if (body.action === "lookup") {
    const code = body.code?.trim().toUpperCase();
    if (!code) return jsonResponse({ error: "code is required" }, 400);

    const { data: order, error } = await sb.from("orders").select(ORDER_SELECT).eq("pickup_code", code).maybeSingle();
    if (error || !order) return jsonResponse({ error: "No order found for that code" }, 404);
    if (locationId !== null && order.location_id !== locationId) {
      return jsonResponse({ error: "No order found for that code" }, 404);
    }

    return jsonResponse({ order: { ...order, customer_name: customerLabel(order) } });
  }

  if (body.action === "collect") {
    if (!body.order_id) return jsonResponse({ error: "order_id is required" }, 400);

    if (locationId !== null) {
      const { data: order } = await sb.from("orders").select("location_id").eq("id", body.order_id).maybeSingle();
      if (!order || order.location_id !== locationId) return jsonResponse({ error: "Order not found" }, 404);
    }

    const { data: result, error } = await sb.rpc("mark_order_collected", { p_order_id: body.order_id });
    if (error) return jsonResponse({ error: error.message }, 400);

    return jsonResponse({ result });
  }

  if (body.action === "list_pending") {
    // Not date-filtered to "today" — a backlog from yesterday is still
    // pending and staff should still see it, not have it silently drop
    // off the list at midnight.
    let query = sb.from("orders").select(ORDER_SELECT).eq("status", "ready_for_pickup");
    if (locationId !== null) query = query.eq("location_id", locationId);

    const { data: orders, error } = await query.order("created_at", { ascending: true });
    if (error) return jsonResponse({ error: "Failed to list pending pickups" }, 500);

    // Lets the dashboard show "unlocked for Zostel Goa" instead of a bare
    // password prompt — only relevant for a PIN unlock, null for master.
    let location: { id: string; name: string; city: string } | null = null;
    if (locationId !== null) {
      const { data } = await sb.from("pickup_locations").select("id, name, city").eq("id", locationId).maybeSingle();
      location = data ?? null;
    }

    return jsonResponse({ orders: (orders ?? []).map((o) => ({ ...o, customer_name: customerLabel(o) })), location });
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
