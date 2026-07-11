// Backs the staff pickup dashboard: lookup by scanned/typed pickup code,
// mark an order collected, and list the current pickup queue. Gated by a
// single shared password (STAFF_DASHBOARD_PASSWORD) rather than a Supabase
// identity per spec — there's no per-staff login at this stage, so
// authorization happens here, not via RLS. This function always uses the
// service-role client for that reason; a request that fails the password
// check never touches the database.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type RequestBody =
  | { action: "lookup"; password: string; code: string }
  | { action: "collect"; password: string; order_id: string }
  | { action: "list_pending"; password: string };

const ORDER_SELECT =
  "id, order_number, status, payment_status, pickup_code, pickup_code_collected_at, created_at, " +
  "guest_name, guest_phone, location_id, pickup_slot, total, " +
  "order_items(quantity, unit_price, product_variants(variant_label, products(name))), " +
  "pickup_locations:location_id(name, city)";

function checkPassword(body: RequestBody): boolean {
  const expected = Deno.env.get("STAFF_DASHBOARD_PASSWORD");
  return Boolean(expected) && body.password === expected;
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

  if (!checkPassword(body)) return jsonResponse({ error: "Incorrect password" }, 401);

  const sb = serviceRoleClient();

  if (body.action === "lookup") {
    const code = body.code?.trim().toUpperCase();
    if (!code) return jsonResponse({ error: "code is required" }, 400);

    const { data: order, error } = await sb.from("orders").select(ORDER_SELECT).eq("pickup_code", code).maybeSingle();
    if (error || !order) return jsonResponse({ error: "No order found for that code" }, 404);

    return jsonResponse({ order: { ...order, customer_name: customerLabel(order) } });
  }

  if (body.action === "collect") {
    if (!body.order_id) return jsonResponse({ error: "order_id is required" }, 400);

    const { data: result, error } = await sb.rpc("mark_order_collected", { p_order_id: body.order_id });
    if (error) return jsonResponse({ error: error.message }, 400);

    return jsonResponse({ result });
  }

  if (body.action === "list_pending") {
    // Not date-filtered to "today" — a backlog from yesterday is still
    // pending and staff should still see it, not have it silently drop
    // off the list at midnight.
    const { data: orders, error } = await sb
      .from("orders")
      .select(ORDER_SELECT)
      .eq("status", "ready_for_pickup")
      .order("created_at", { ascending: true });

    if (error) return jsonResponse({ error: "Failed to list pending pickups" }, 500);

    return jsonResponse({ orders: (orders ?? []).map((o) => ({ ...o, customer_name: customerLabel(o) })) });
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
