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
  | { action: "list_pending"; password?: string; pin?: string }
  | { action: "inventory"; password?: string; pin?: string; since?: string }
  | { action: "history"; password?: string; pin?: string; since?: string; search?: string };

const ORDER_SELECT =
  "id, order_number, status, payment_status, pickup_code, pickup_code_collected_at, created_at, " +
  "guest_name, guest_phone, guest_email, location_id, pickup_slot, total, notes, " +
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

  if (body.action === "inventory") {
    // View-only, deliberately — nothing in this dashboard writes to
    // inventory or product_variants. A PIN holder only ever sees their
    // own location's numbers; the master password sees every location
    // summed together, same shape either way.
    let stockQuery = sb
      .from("inventory")
      .select("quantity_available, variant_id, product_variants(variant_label, price_override, products(name, price))");
    if (locationId !== null) stockQuery = stockQuery.eq("location_id", locationId);
    const { data: stockRows, error: stockError } = await stockQuery;
    if (stockError) return jsonResponse({ error: "Failed to load inventory" }, 500);

    // Sold + revenue come from real completed takeaway orders, not a
    // manually maintained counter — a Zostel's own paid, picked-up orders
    // for the PIN-scoped case, every takeaway order for the master case.
    // `since` (an ISO timestamp the client computes from the range it has
    // selected — 24h / today / 3 days / week) filters this to that
    // window; omitted entirely means "all time".
    let ordersQuery = sb
      .from("orders")
      .select("id, location_id, order_items(quantity, unit_price, variant_id)")
      .eq("fulfillment_type", "takeaway")
      .eq("payment_status", "paid");
    if (locationId !== null) ordersQuery = ordersQuery.eq("location_id", locationId);
    if (body.since) ordersQuery = ordersQuery.gte("created_at", body.since);
    const { data: soldOrders, error: soldError } = await ordersQuery;
    if (soldError) return jsonResponse({ error: "Failed to load sales" }, 500);

    // Zostel's cut of every sale made at their property — now a per-location
    // rate (see pickup_locations.commission_percent), admin-editable via
    // /admin/pickup-locations. The master (all-locations) view has to look
    // each order's own location up individually here rather than applying
    // one flat rate, since different Zostels can now charge different cuts.
    const DEFAULT_COMMISSION_PERCENT = 10;
    const commissionPercentByLocation = new Map<string, number>();
    {
      const { data: allLocations } = await sb.from("pickup_locations").select("id, commission_percent");
      for (const l of allLocations ?? []) commissionPercentByLocation.set(l.id, Number(l.commission_percent));
    }

    const soldByVariant = new Map<string, { unitsSold: number; revenue: number; commission: number }>();
    for (const order of soldOrders ?? []) {
      const rate =
        (commissionPercentByLocation.get((order as { location_id: string | null }).location_id ?? "") ??
          DEFAULT_COMMISSION_PERCENT) / 100;
      for (const item of (order as unknown as { order_items: { quantity: number; unit_price: number; variant_id: string }[] }).order_items) {
        const existing = soldByVariant.get(item.variant_id) ?? { unitsSold: 0, revenue: 0, commission: 0 };
        const itemRevenue = item.quantity * Number(item.unit_price);
        existing.unitsSold += item.quantity;
        existing.revenue += itemRevenue;
        existing.commission += itemRevenue * rate;
        soldByVariant.set(item.variant_id, existing);
      }
    }

    const byVariant = new Map<
      string,
      { productName: string; variantLabel: string; price: number; unitsRemaining: number }
    >();
    for (const row of (stockRows ?? []) as unknown as Array<{
      quantity_available: number;
      variant_id: string;
      product_variants: { variant_label: string; price_override: number | null; products: { name: string; price: number } };
    }>) {
      const existing = byVariant.get(row.variant_id);
      if (existing) {
        existing.unitsRemaining += row.quantity_available;
      } else {
        byVariant.set(row.variant_id, {
          productName: row.product_variants.products.name,
          variantLabel: row.product_variants.variant_label,
          price: row.product_variants.price_override ?? row.product_variants.products.price,
          unitsRemaining: row.quantity_available,
        });
      }
    }

    const products = [...byVariant.entries()]
      .map(([variantId, v]) => {
        const sold = soldByVariant.get(variantId);
        return {
          variantId,
          productName: v.productName,
          variantLabel: v.variantLabel,
          price: v.price,
          unitsRemaining: v.unitsRemaining,
          unitsSold: sold?.unitsSold ?? 0,
          revenue: sold?.revenue ?? 0,
          commission: sold?.commission ?? 0,
        };
      })
      .sort((a, b) => a.productName.localeCompare(b.productName));

    let location: { id: string; name: string; city: string; commission_percent: number } | null = null;
    if (locationId !== null) {
      const { data } = await sb
        .from("pickup_locations")
        .select("id, name, city, commission_percent")
        .eq("id", locationId)
        .maybeSingle();
      location = data ?? null;
    }

    // Manual one-off corrections/bonuses/deductions (see /admin/pickup-
    // locations) on top of the calculated percent × revenue commission
    // above — same `since` window as everything else here, compared by
    // adjustment_date since that's a plain date, not a timestamptz.
    let adjustmentsQuery = sb.from("pickup_location_commission_adjustments").select("amount");
    if (locationId !== null) adjustmentsQuery = adjustmentsQuery.eq("location_id", locationId);
    if (body.since) adjustmentsQuery = adjustmentsQuery.gte("adjustment_date", body.since.slice(0, 10));
    const { data: adjustmentRows } = await adjustmentsQuery;
    const commissionAdjustment = (adjustmentRows ?? []).reduce((sum, a) => sum + Number(a.amount), 0);

    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const calculatedCommission = products.reduce((sum, p) => sum + p.commission, 0);
    const totalCommission = calculatedCommission + commissionAdjustment;

    return jsonResponse({
      location,
      products,
      totals: {
        unitsRemaining: products.reduce((sum, p) => sum + p.unitsRemaining, 0),
        unitsSold: products.reduce((sum, p) => sum + p.unitsSold, 0),
        revenue: totalRevenue,
        // A single rate only really means something when scoped to one
        // location (the master/combined view can span several different
        // rates now) — this is the blended effective rate either way:
        // exactly that location's own rate when scoped, a weighted
        // average across locations when combined. Computed off the
        // calculated commission only — manual adjustments are a flat ₹
        // correction, not part of the underlying rate.
        commissionRate: totalRevenue > 0 ? calculatedCommission / totalRevenue : 0,
        // What percent × revenue alone comes to, before adjustments.
        calculatedCommission,
        // The manual correction/bonus/deduction total for this scope —
        // 0 when there aren't any, shown separately so it's never
        // confused with the calculated figure above.
        commissionAdjustment,
        // calculatedCommission + commissionAdjustment — the actual
        // amount owed.
        commission: totalCommission,
      },
    });
  }

  if (body.action === "history") {
    // Order-level sold history — same underlying data as "inventory"
    // above (paid takeaway orders, same `since` range filter, same
    // location scoping), just returned per-order instead of summed into
    // per-product totals. `search` matches order number or customer name,
    // client-side-typed same as the "look up an order" box elsewhere on
    // this dashboard.
    let query = sb
      .from("orders")
      .select(
        "id, order_number, guest_name, guest_phone, guest_email, created_at, pickup_code_collected_at, notes, " +
          "order_items(quantity, unit_price, product_variants(variant_label, products(name)))",
      )
      .eq("fulfillment_type", "takeaway")
      .eq("payment_status", "paid");
    if (locationId !== null) query = query.eq("location_id", locationId);
    if (body.since) query = query.gte("created_at", body.since);

    const search = body.search?.trim();
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,guest_name.ilike.%${search}%`);
    }

    const { data: orders, error } = await query.order("created_at", { ascending: false }).limit(200);
    if (error) return jsonResponse({ error: "Failed to load order history" }, 500);

    let location: { id: string; name: string; city: string } | null = null;
    if (locationId !== null) {
      const { data } = await sb.from("pickup_locations").select("id, name, city").eq("id", locationId).maybeSingle();
      location = data ?? null;
    }

    return jsonResponse({
      location,
      orders: (orders ?? []).map((o) => ({ ...o, customer_name: customerLabel({ guest_name: o.guest_name }) })),
    });
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
