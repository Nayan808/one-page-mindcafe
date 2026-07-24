// Triggered by a Supabase Database Webhook on `orders` UPDATE (configure
// alongside order-status-notifier: Database -> Webhooks -> orders ->
// UPDATE -> this function's URL). Fires only when a delivery order just
// transitioned to 'confirmed', and creates the real Shiprocket shipment.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { jsonResponse } from "../_shared/cors.ts";

type DbWebhookPayload = {
  type: "UPDATE";
  table: string;
  record: {
    id: string;
    status: string;
    fulfillment_type: string;
    shiprocket_order_id: string | null;
  };
  old_record: { status: string } | null;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getShiprocketToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: Deno.env.get("SHIPROCKET_EMAIL"),
      password: Deno.env.get("SHIPROCKET_PASSWORD"),
    }),
  });

  if (!res.ok) throw new Error(`Shiprocket auth failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  // Shiprocket tokens are valid ~10 days; cache conservatively per warm
  // function instance so we're not re-authenticating on every call.
  cachedToken = { token: data.token, expiresAt: Date.now() + 60 * 60 * 1000 };
  return cachedToken.token;
}

Deno.serve(async (req) => {
  const payload = (await req.json()) as DbWebhookPayload;
  const { record, old_record } = payload;

  const justConfirmed = record.status === "confirmed" && old_record?.status !== "confirmed";
  if (!justConfirmed || record.fulfillment_type !== "delivery" || record.shiprocket_order_id) {
    return jsonResponse({ skipped: true });
  }

  const sb = serviceRoleClient();

  const { data: order, error } = await sb
    .from("orders")
    .select(
      "id, order_number, subtotal, created_at, addresses:address_id(full_name, phone, line1, line2, city, state, pincode), order_items(quantity, unit_price, product_variants(variant_label, products(name)))",
    )
    .eq("id", record.id)
    .single();

  if (error || !order || !order.addresses) {
    console.error("create-shiprocket-shipment: order or address missing", record.id, error);
    return jsonResponse({ error: "Order or address not found" }, 404);
  }

  const address = order.addresses as unknown as {
    full_name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  const orderItems = order.order_items as unknown as Array<{
    quantity: number;
    unit_price: number;
    product_variants: { variant_label: string; products: { name: string } };
  }>;

  const token = await getShiprocketToken();

  // Shiprocket's create-order payload wants first/last name as separate
  // fields, not one combined name — split on the first space; a
  // single-word name (no space) just leaves billing_last_name empty
  // rather than duplicating the name into both fields.
  const spaceIndex = address.full_name.indexOf(" ");
  const billingFirstName = spaceIndex === -1 ? address.full_name : address.full_name.slice(0, spaceIndex);
  const billingLastName = spaceIndex === -1 ? "" : address.full_name.slice(spaceIndex + 1);

  // NOTE: length/breadth/height/weight are placeholders — this schema
  // doesn't carry physical product attributes yet. Add e.g. weight_kg /
  // dimensions_cm to product_variants and compute real totals here before
  // going live; Shiprocket requires accurate values for rate/courier
  // selection.
  const shiprocketRes = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: order.order_number,
      order_date: new Date(order.created_at).toISOString().slice(0, 19).replace("T", " "),
      // Nickname of the pickup address registered in the Shiprocket
      // dashboard (Settings -> Pickup Addresses) — must match exactly.
      // Configurable rather than hardcoded so renaming it there doesn't
      // require redeploying this function.
      pickup_location: Deno.env.get("SHIPROCKET_PICKUP_LOCATION"),
      billing_customer_name: billingFirstName,
      billing_last_name: billingLastName,
      billing_address: address.line1,
      billing_address_2: address.line2 ?? "",
      billing_city: address.city,
      billing_state: address.state,
      billing_pincode: address.pincode,
      billing_country: "India",
      billing_phone: address.phone,
      shipping_is_billing: true,
      order_items: orderItems.map((item) => ({
        name: `${item.product_variants.products.name} — ${item.product_variants.variant_label}`,
        units: item.quantity,
        selling_price: item.unit_price,
      })),
      payment_method: "Prepaid",
      sub_total: order.subtotal,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    }),
  });

  if (!shiprocketRes.ok) {
    console.error("Shiprocket order creation failed", await shiprocketRes.text());
    return jsonResponse({ error: "Shiprocket order creation failed" }, 502);
  }

  const shiprocketOrder = await shiprocketRes.json();

  await sb
    .from("orders")
    .update({
      shiprocket_order_id: String(shiprocketOrder.order_id ?? ""),
      shiprocket_shipment_id: String(shiprocketOrder.shipment_id ?? ""),
    })
    .eq("id", order.id);

  // AWB assignment (courier selection + tracking number/URL) is a
  // separate Shiprocket call that needs a courier_id — left as a
  // follow-up step (via the Shiprocket dashboard or a courier-selection
  // function added later) rather than guessing a courier here.
  // shiprocket-tracking-webhook picks up the AWB once it's assigned.

  return jsonResponse({ created: true, shiprocket_order_id: shiprocketOrder.order_id });
});
