// Public endpoint Shiprocket calls with shipment status updates. Configure
// this URL (with ?secret=<SHIPROCKET_WEBHOOK_SECRET>) in the Shiprocket
// dashboard under Settings -> API -> Webhooks. Shiprocket doesn't offer
// the kind of HMAC signature verification Razorpay does, so a shared
// secret in the URL is the pragmatic substitute — reject anything without
// the right one.
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
  const secret = url.searchParams.get("secret");
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
