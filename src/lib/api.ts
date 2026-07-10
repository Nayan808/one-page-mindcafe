import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  Address,
  Cart,
  CartItemWithVariant,
  OrderWithItems,
  PickupLocation,
  Profile,
  ProductWithVariants,
} from "@/types/domain";

// Normalized error shape thrown by every function below, so callers don't
// have to know about PostgREST's raw error format.
export class ApiError extends Error {
  readonly context: string;
  readonly cause?: unknown;

  constructor(context: string, cause?: unknown) {
    const message =
      cause && typeof cause === "object" && "message" in cause
        ? String((cause as { message: unknown }).message)
        : `Request failed: ${context}`;
    super(message);
    this.name = "ApiError";
    this.context = context;
    this.cause = cause;
  }
}

function throwOnError(context: string, error: unknown): void {
  if (error) throw new ApiError(context, error);
}

type Sb = SupabaseClient<Database>;

// --- Auth / profile ---------------------------------------------------

export async function fetchProfile(sb: Sb, userId: string): Promise<Profile | null> {
  const { data, error } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
  throwOnError("fetchProfile", error);
  return data;
}

// --- Products -----------------------------------------------------------

export async function getFeelzCatalog(sb: Sb): Promise<ProductWithVariants[]> {
  const { data, error } = await sb
    .from("products")
    .select("*, product_variants(*)")
    .eq("is_active", true)
    .order("name");
  throwOnError("getFeelzCatalog", error);
  return (data as ProductWithVariants[]) ?? [];
}

export async function getAvailableStock(sb: Sb, variantId: string, locationId: string | null = null) {
  const { data, error } = await sb.rpc("available_stock", { p_variant_id: variantId, p_location_id: locationId });
  throwOnError("getAvailableStock", error);
  return data ?? 0;
}

// --- Cart -----------------------------------------------------------------

export async function getOrCreateCart(
  sb: Sb,
  identity: { userId: string | null; sessionId: string | null },
): Promise<Cart> {
  const { userId, sessionId } = identity;
  if (!userId && !sessionId) throw new ApiError("getOrCreateCart", { message: "no user or guest session id" });

  const query = sb.from("carts").select("*").eq("status", "active");
  const { data: existing, error: selectError } = userId
    ? await query.eq("user_id", userId).maybeSingle()
    : await query.eq("session_id", sessionId!).maybeSingle();
  throwOnError("getOrCreateCart.select", selectError);
  if (existing) return existing;

  const { data: created, error: insertError } = await sb
    .from("carts")
    .insert(userId ? { user_id: userId } : { session_id: sessionId })
    .select("*")
    .single();
  throwOnError("getOrCreateCart.insert", insertError);
  return created!;
}

export async function getCartItems(sb: Sb, cartId: string): Promise<CartItemWithVariant[]> {
  const { data, error } = await sb
    .from("cart_items")
    .select("*, product_variants(*, products(id, name, image_url, price))")
    .eq("cart_id", cartId);
  throwOnError("getCartItems", error);
  return (data as unknown as CartItemWithVariant[]) ?? [];
}

export async function addCartItem(sb: Sb, cartId: string, variantId: string, quantity: number) {
  const { data: existing } = await sb
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existing) return updateCartItemQuantity(sb, existing.id, existing.quantity + quantity);

  const { data, error } = await sb
    .from("cart_items")
    .insert({ cart_id: cartId, variant_id: variantId, quantity })
    .select("*")
    .single();
  throwOnError("addCartItem", error);
  return data!;
}

export async function updateCartItemQuantity(sb: Sb, cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    await removeCartItem(sb, cartItemId);
    return null;
  }
  const { data, error } = await sb.from("cart_items").update({ quantity }).eq("id", cartItemId).select("*").single();
  throwOnError("updateCartItemQuantity", error);
  return data!;
}

export async function removeCartItem(sb: Sb, cartItemId: string) {
  const { error } = await sb.from("cart_items").delete().eq("id", cartItemId);
  throwOnError("removeCartItem", error);
}

export async function mergeGuestCart(sb: Sb, guestSessionId: string): Promise<void> {
  try {
    await sb.functions.invoke("merge-guest-cart", { body: { guest_session_id: guestSessionId } });
  } catch {
    // best-effort — login must never be blocked by this failing
  }
}

// --- Addresses --------------------------------------------------------

export async function getUserAddresses(sb: Sb, userId: string): Promise<Address[]> {
  const { data, error } = await sb
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  throwOnError("getUserAddresses", error);
  return data ?? [];
}

export async function createAddress(
  sb: Sb,
  input: Database["public"]["Tables"]["addresses"]["Insert"],
): Promise<Address> {
  const { data, error } = await sb.from("addresses").insert(input).select("*").single();
  throwOnError("createAddress", error);
  return data!;
}

export async function checkPincodeServiceability(sb: Sb, pincode: string) {
  const { data, error } = await sb.from("serviceable_pincodes").select("*").eq("pincode", pincode).maybeSingle();
  throwOnError("checkPincodeServiceability", error);
  return data;
}

// --- Pickup locations (Zostel takeaway points) -----------------------

export async function getActivePickupLocations(sb: Sb, city?: string): Promise<PickupLocation[]> {
  let query = sb.from("pickup_locations").select("*").eq("is_active", true);
  if (city) query = query.eq("city", city);
  const { data, error } = await query.order("name");
  throwOnError("getActivePickupLocations", error);
  return data ?? [];
}

// --- Orders -------------------------------------------------------------

export async function getOrder(sb: Sb, orderId: string): Promise<OrderWithItems | null> {
  const { data, error } = await sb.from("orders").select("*, order_items(*)").eq("id", orderId).maybeSingle();
  throwOnError("getOrder", error);
  return data as unknown as OrderWithItems | null;
}

// --- Checkout (server-side price/coupon validation + Razorpay order) ---

export type CheckoutFulfillment =
  | { type: "delivery"; addressId?: string; address?: {
      full_name: string; phone: string; line1: string; line2?: string;
      city: string; state: string; pincode: string; landmark?: string;
    } }
  | { type: "takeaway"; locationId: string; pickupSlot?: string };

export type CheckoutInput = {
  cartId: string;
  items: { variantId: string; quantity: number }[];
  fulfillment: CheckoutFulfillment;
  couponCode?: string;
  guest?: { name: string; phone: string; email?: string };
};

export type CheckoutResponse = {
  order_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total: number;
};

// Invokes the create-order Edge Function: it looks up real prices,
// validates the coupon, reserves stock, creates the order, and creates the
// matching Razorpay order — all server-side, so nothing here can be
// tampered with client-side. Works for both signed-in and guest checkout.
export async function checkout(sb: Sb, input: CheckoutInput): Promise<CheckoutResponse> {
  const { data, error } = await sb.functions.invoke("create-order", {
    body: {
      cart_id: input.cartId,
      items: input.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      fulfillment:
        input.fulfillment.type === "delivery"
          ? { type: "delivery", address_id: input.fulfillment.addressId, address: input.fulfillment.address }
          : { type: "takeaway", location_id: input.fulfillment.locationId, pickup_slot: input.fulfillment.pickupSlot },
      coupon_code: input.couponCode || undefined,
      guest: input.guest,
    },
  });
  if (error) {
    // supabase-js surfaces a non-2xx Edge Function response as a generic
    // FunctionsHttpError — the actual { error: "..." } message create-order
    // sent is on the response body, not `error.message`.
    const detail = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new ApiError("checkout", { message: detail?.error ?? error.message });
  }
  return data as CheckoutResponse;
}
