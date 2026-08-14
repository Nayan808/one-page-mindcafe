// Public endpoint Shiprocket calls with shipment status updates. Named
// "delivery-status-webhook" rather than anything containing "shiprocket"/
// "kartrocket"/"sr"/"kr" — Shiprocket's own webhook URL field rejects
// those keywords ("Address is not allowed"), so the function itself has
// to avoid them, not just the URL typed into their form.
//
// Configure this URL in the Shiprocket dashboard under Settings -> API ->
// Webhooks, with Auth Token Type "x-api-key" and Token =
// SHIPROCKET_WEBHOOK_SECRET — Shiprocket's current webhook UI sends the
// token as an `x-api-key` header, not a URL query param (also accepted
// here as a fallback, in case an older/different Shiprocket webhook flow
// is ever used instead). Shiprocket doesn't offer the kind of HMAC
// signature verification Razorpay does, so a shared secret is the
// pragmatic substitute — reject anything without the right one.
//
// NOTE: verify the exact payload field names against Shiprocket's current
// webhook documentation before going live — this maps the commonly
// documented fields (awb, current_status, order_id) defensively.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { jsonResponse } from "../_shared/cors.ts";

const STATUS_MAP: Record<string, string> = {
  "picked up": "shipped",
  shipped: "shipped",
  "in transit": "shipped",
  "out for delivery": "out_for_delivery",
  delivered: "delivered",
  cancelled: "cancelled",
  canceled: "cancelled",
  "rto initiated": "cancelled",
};

function normalize(status: string): string | null {
  const key = status.trim().toLowerCase();
  return STATUS_MAP[key] ?? null;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const secret = req.headers.get("x-api-key") ?? url.searchParams.get("secret");
  if (secret !== Deno.env.get("SHIPROCKET_WEBHOOK_SECRET")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const payload = await req.json();
  const awb: string | undefined = payload.awb ?? payload.awb_code;
  const shiprocketOrderId: string | undefined = payload.order_id ?? payload.sr_order_id;
  const rawStatus: string | undefined = payload.current_status ?? payload.shipment_status ?? payload.status;

  if (!rawStatus || (!awb && !shiprocketOrderId)) {
    return jsonResponse({ skipped: true, reason: "missing awb/order_id or status" });
  }

  const mappedStatus = normalize(rawStatus);
  if (!mappedStatus) {
    console.warn("Unmapped Shiprocket status", rawStatus);
    return jsonResponse({ skipped: true, reason: `unmapped status: ${rawStatus}` });
  }

  const sb = serviceRoleClient();

  let query = sb.from("orders").select("id");
  query = awb ? query.eq("awb_code", awb) : query.eq("shiprocket_order_id", shiprocketOrderId!);
  const { data: order, error } = await query.maybeSingle();

  if (error || !order) {
    console.error("No matching order for Shiprocket update", { awb, shiprocketOrderId }, error);
    return jsonResponse({ error: "Order not found" }, 404);
  }

  const update: Record<string, unknown> = { status: mappedStatus };
  if (awb) update.awb_code = awb;
  if (payload.tracking_url) update.tracking_url = payload.tracking_url;

  const { error: updateError } = await sb.from("orders").update(update).eq("id", order.id);
  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500);
  }

  return jsonResponse({ updated: true, status: mappedStatus });
});
