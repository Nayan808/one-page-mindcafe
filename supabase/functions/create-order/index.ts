// Single server-side checkout entry point: given a cart + fulfillment
// choice + optional coupon, this looks up real prices, validates the
// coupon, checks/reserves stock, creates the order (+ order_items) row(s),
// and creates the matching Razorpay order — all in one call, so nothing
// about the amount ever has to be trusted from the client.
//
// Supports both signed-in and guest checkout: a guest just supplies
// name/phone(/email) instead of riding on an auth.users row. Delivery
// still needs a full address either way (Shiprocket requires it) — either
// an existing addresses row (signed-in only) or an inline address object.
import { userScopedClient, serviceRoleClient } from "../_shared/supabaseClients.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type CartItemInput = { variant_id: string; quantity: number };

type DeliveryFulfillment = {
  type: "delivery";
  address_id?: string;
  address?: {
    full_name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
};
type TakeawayFulfillment = { type: "takeaway"; location_id: string; pickup_slot?: string };

type RequestBody = {
  cart_id: string;
  items: CartItemInput[];
  fulfillment: DeliveryFulfillment | TakeawayFulfillment;
  coupon_code?: string;
  guest?: { name: string; phone: string; email?: string };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { cart_id, items, fulfillment, coupon_code, guest } = body ?? ({} as RequestBody);

  if (!cart_id || !Array.isArray(items) || items.length === 0) {
    return jsonResponse({ error: "cart_id and a non-empty items array are required" }, 400);
  }
  if (!fulfillment || (fulfillment.type !== "delivery" && fulfillment.type !== "takeaway")) {
    return jsonResponse({ error: "fulfillment.type must be 'delivery' or 'takeaway'" }, 400);
  }

  // The caller authenticates as themself (or anon) via the JWT
  // supabase.functions.invoke already attaches — we never take a user_id
  // from the request body itself.
  const callerClient = userScopedClient(req);
  const {
    data: { user },
  } = await callerClient.auth.getUser();

  if (!user && (!guest?.name || !guest?.phone)) {
    return jsonResponse({ error: "guest.name and guest.phone are required for guest checkout" }, 400);
  }

  const sb = serviceRoleClient();

  // --- Real prices, looked up server-side. Never trust a price/subtotal
  // sent from the client. ---
  const variantIds = items.map((i) => i.variant_id);
  const { data: variants, error: variantsError } = await sb
    .from("product_variants")
    .select("id, price_override, products(id, name, price, is_active)")
    .in("id", variantIds);

  if (variantsError || !variants) return jsonResponse({ error: "Failed to look up products" }, 500);

  const variantById = new Map(variants.map((v) => [v.id, v as unknown as {
    id: string;
    price_override: number | null;
    products: { id: string; name: string; price: number; is_active: boolean } | null;
  }]));

  let subtotal = 0;
  const orderItemsInput: { variantId: string; quantity: number; unitPrice: number }[] = [];

  for (const item of items) {
    const variant = variantById.get(item.variant_id);
    const quantity = Number(item.quantity);
    if (!variant || !variant.products?.is_active || !Number.isInteger(quantity) || quantity <= 0) {
      return jsonResponse({ error: `Invalid or inactive item: ${item.variant_id}` }, 400);
    }
    const unitPrice = Number(variant.price_override ?? variant.products.price);
    subtotal += unitPrice * quantity;
    orderItemsInput.push({ variantId: item.variant_id, quantity, unitPrice });
  }

  // --- Fulfillment-specific validation ---
  let addressId: string | null = null;
  let guestAddress: Record<string, string | null> | null = null;
  let locationId: string | null = null;
  let pickupSlot: string | null = null;
  let deliveryFee = 0;

  if (fulfillment.type === "delivery") {
    let pincode: string;

    if (fulfillment.address_id) {
      if (!user) return jsonResponse({ error: "address_id requires being signed in" }, 400);
      // Uses the caller's own JWT so RLS's owner-only policy is what
      // actually stops someone from checking out against a stranger's
      // saved address.
      const { data: address } = await callerClient
        .from("addresses")
        .select("*")
        .eq("id", fulfillment.address_id)
        .maybeSingle();
      if (!address) return jsonResponse({ error: "Address not found" }, 404);
      addressId = address.id;
      pincode = address.pincode;
    } else if (fulfillment.address) {
      const a = fulfillment.address;
      if (!a.full_name || !a.phone || !a.line1 || !a.city || !a.state || !a.pincode) {
        return jsonResponse({ error: "Incomplete delivery address" }, 400);
      }
      guestAddress = {
        guest_address_line1: a.line1,
        guest_address_line2: a.line2 ?? null,
        guest_address_city: a.city,
        guest_address_state: a.state,
        guest_address_pincode: a.pincode,
      };
      pincode = a.pincode;
    } else {
      return jsonResponse({ error: "fulfillment.address_id or fulfillment.address is required for delivery" }, 400);
    }

    const { data: serviceability } = await sb
      .from("serviceable_pincodes")
      .select("delivery_fee")
      .eq("pincode", pincode)
      .maybeSingle();
    if (!serviceability) return jsonResponse({ error: "This pincode isn't serviceable yet" }, 400);
    deliveryFee = Number(serviceability.delivery_fee);
  } else {
    if (!fulfillment.location_id) {
      return jsonResponse({ error: "fulfillment.location_id is required for takeaway" }, 400);
    }
    locationId = fulfillment.location_id;
    pickupSlot = fulfillment.pickup_slot ?? null;
  }

  // --- Coupon, validated and priced server-side — before reserving stock,
  // so an invalid code fails fast without holding reservations. ---
  let discountAmount = 0;
  let appliedCouponCode: string | null = null;

  if (coupon_code) {
    const { data: coupon } = await sb
      .from("coupons")
      .select("*")
      .eq("code", coupon_code.trim().toUpperCase())
      .maybeSingle();

    if (!coupon || !coupon.is_active || (coupon.expires_at && new Date(coupon.expires_at) < new Date())) {
      return jsonResponse({ error: "Invalid or expired coupon code" }, 400);
    }
    if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
      return jsonResponse({ error: "This coupon has reached its usage limit" }, 400);
    }
    if (subtotal < Number(coupon.min_order_amount)) {
      return jsonResponse({ error: `This coupon needs a minimum order of ₹${coupon.min_order_amount}` }, 400);
    }

    discountAmount =
      coupon.discount_type === "percent" ? subtotal * (Number(coupon.discount_value) / 100) : Number(coupon.discount_value);
    if (coupon.max_discount_amount !== null) discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
    discountAmount = Math.min(discountAmount, subtotal);
    appliedCouponCode = coupon.code;
  }

  // --- Stock check + short-lived reservation (re-verified atomically
  // inside the RPC, same guard the 3-step checkout uses). ---
  for (const item of orderItemsInput) {
    const { error: reserveError } = await sb.rpc("create_stock_reservation", {
      p_cart_id: cart_id,
      p_variant_id: item.variantId,
      p_location_id: locationId,
      p_quantity: item.quantity,
    });
    if (reserveError) {
      const insufficientStock = reserveError.message?.includes("INSUFFICIENT_STOCK");
      return jsonResponse(
        { error: insufficientStock ? "One of the items in your cart just went out of stock" : "Failed to reserve stock" },
        409,
      );
    }
  }

  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  const { data: order, error: orderError } = await sb
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      source_cart_id: cart_id,
      fulfillment_type: fulfillment.type,
      address_id: addressId,
      location_id: locationId,
      pickup_slot: pickupSlot,
      payment_method: "razorpay",
      subtotal,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      coupon_code: appliedCouponCode,
      total,
      guest_name: user ? null : guest!.name,
      guest_phone: user ? null : guest!.phone,
      guest_email: user ? null : (guest!.email ?? null),
      ...(guestAddress ?? {}),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("create-order: failed to insert order", orderError);
    return jsonResponse({ error: "Failed to create order" }, 500);
  }

  const { error: itemsError } = await sb
    .from("order_items")
    .insert(orderItemsInput.map((i) => ({ order_id: order.id, variant_id: i.variantId, quantity: i.quantity, unit_price: i.unitPrice })));

  if (itemsError) {
    console.error("create-order: failed to insert order_items", itemsError);
    return jsonResponse({ error: "Failed to create order items" }, 500);
  }

  if (appliedCouponCode) {
    await sb.rpc("increment_coupon_usage", { p_code: appliedCouponCode });
  }

  // Cart's job is done once its contents are snapshotted into the order.
  await sb.from("cart_items").delete().eq("cart_id", cart_id);

  // --- Razorpay order, same two-step flow create-razorpay-order used:
  // amount is fixed server-side before Checkout.js ever opens. ---
  const amountPaise = Math.round(total * 100);
  const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const auth = btoa(`${keyId}:${keySecret}`);

  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: order.id }),
  });

  if (!razorpayRes.ok) {
    console.error("create-order: Razorpay order creation failed", await razorpayRes.text());
    // The order row already exists as 'placed' with no razorpay_order_id —
    // same abandoned-order shape the 3-step checkout can leave behind on
    // this failure path today; nothing further to clean up here.
    return jsonResponse({ error: "Failed to create Razorpay order" }, 502);
  }

  const razorpayOrder = await razorpayRes.json();
  await sb.from("orders").update({ razorpay_order_id: razorpayOrder.id }).eq("id", order.id);

  return jsonResponse({
    order_id: order.id,
    razorpay_order_id: razorpayOrder.id,
    amount: amountPaise,
    currency: "INR",
    key_id: keyId,
    subtotal,
    discount_amount: discountAmount,
    delivery_fee: deliveryFee,
    total,
  });
});
