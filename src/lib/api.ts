import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  Address,
  Appointment,
  AppointmentWithExpert,
  Cart,
  CartItemWithVariant,
  Expert,
  Faq,
  Milestone,
  OrderWithItemDetails,
  OrderWithItems,
  PickupLocation,
  Product,
  Profile,
  ProductWithVariants,
  Review,
  TherapyCategory,
} from "@/types/domain";
import type { Json } from "@/types/supabase";

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

export async function updateProfile(
  sb: Sb,
  userId: string,
  input: Database["public"]["Tables"]["profiles"]["Update"],
): Promise<Profile> {
  const { data, error } = await sb.from("profiles").update(input).eq("id", userId).select("*").single();
  throwOnError("updateProfile", error);
  return data!;
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

// Lighter than getFeelzCatalog — the homepage teaser only shows name+image,
// no pricing/variant data, so there's no reason to fetch or couple to it.
export async function getFeelzTeaser(sb: Sb, limit = 4): Promise<Pick<Product, "id" | "name" | "image_url">[]> {
  const { data, error } = await sb
    .from("products")
    .select("id, name, image_url")
    .eq("is_active", true)
    .order("name")
    .limit(limit);
  throwOnError("getFeelzTeaser", error);
  return data ?? [];
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

export async function updateAddress(
  sb: Sb,
  addressId: string,
  input: Database["public"]["Tables"]["addresses"]["Update"],
): Promise<Address> {
  const { data, error } = await sb.from("addresses").update(input).eq("id", addressId).select("*").single();
  throwOnError("updateAddress", error);
  return data!;
}

export async function deleteAddress(sb: Sb, addressId: string): Promise<void> {
  const { error } = await sb.from("addresses").delete().eq("id", addressId);
  throwOnError("deleteAddress", error);
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

// --- Marketing / CMS (site_settings, newsletter, reviews) -----------------

// Generic key/value CMS store — the announcement bar and homepage stat
// chips read from this so marketing can change copy without a deploy.
// Returns null (not a thrown error) when the key hasn't been configured
// yet, so callers can fall back to a sensible hardcoded default.
export async function getSiteSetting<T = unknown>(sb: Sb, key: string): Promise<T | null> {
  const { data, error } = await sb.from("site_settings").select("value").eq("key", key).maybeSingle();
  throwOnError("getSiteSetting", error);
  return (data?.value as T | undefined) ?? null;
}

// Public insert-only per RLS — a duplicate email is a user-facing
// "already subscribed" state, not an error to surface as broken.
export async function subscribeToNewsletter(sb: Sb, email: string): Promise<{ alreadySubscribed: boolean }> {
  const { error } = await sb.from("newsletter_subscribers").insert({ email: email.trim().toLowerCase() });
  if (error) {
    if (error.code === "23505") return { alreadySubscribed: true };
    throw new ApiError("subscribeToNewsletter", error);
  }
  return { alreadySubscribed: false };
}

export async function getRecentReviews(sb: Sb, limit = 4): Promise<Review[]> {
  const { data, error } = await sb.from("reviews").select("*").order("created_at", { ascending: false }).limit(limit);
  throwOnError("getRecentReviews", error);
  return data ?? [];
}

// Full /reviews page — paginated, optionally filtered to a star rating.
export async function getReviewsPage(
  sb: Sb,
  options: { page: number; pageSize: number; rating?: number },
): Promise<{ reviews: Review[]; total: number }> {
  const from = options.page * options.pageSize;
  const to = from + options.pageSize - 1;
  let query = sb.from("reviews").select("*", { count: "exact" }).eq("is_corporate", false);
  if (options.rating) query = query.eq("rating", options.rating);
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  throwOnError("getReviewsPage", error);
  return { reviews: data ?? [], total: count ?? 0 };
}

// --- Counselling (experts, therapy categories) -----------------------------

// Public read is already scoped to is_active by RLS (experts_select), but
// filtering here too keeps the query self-documenting and lets a future
// admin-only view reuse the same table without a second function.
export async function getActiveExperts(sb: Sb, specialty?: string): Promise<Expert[]> {
  let query = sb.from("experts").select("*").eq("is_active", true);
  if (specialty) query = query.contains("specialties", [specialty]);
  const { data, error } = await query.order("rating", { ascending: false, nullsFirst: false });
  throwOnError("getActiveExperts", error);
  return data ?? [];
}

export async function getTherapyCategories(sb: Sb): Promise<TherapyCategory[]> {
  const { data, error } = await sb.from("therapy_categories").select("*").order("title");
  throwOnError("getTherapyCategories", error);
  return data ?? [];
}

export async function getTherapyCategory(sb: Sb, slug: string): Promise<TherapyCategory | null> {
  const { data, error } = await sb.from("therapy_categories").select("*").eq("slug", slug).maybeSingle();
  throwOnError("getTherapyCategory", error);
  return data;
}

// --- Appointments -----------------------------------------------------------

// Direct client insert (not an Edge Function): unlike orders, there's no
// price/stock integrity to protect here — RLS's `user_id = auth.uid()`
// check is what actually stops someone from booking on another account's
// behalf. Always lands on 'pending' (the table default) since there's no
// real-time expert availability to confirm against yet.
export async function createAppointment(
  sb: Sb,
  input: {
    userId: string;
    therapyCategory: string;
    expertId?: string;
    scheduledAt?: string;
    notes?: string;
  },
): Promise<Appointment> {
  const { data, error } = await sb
    .from("appointments")
    .insert({
      user_id: input.userId,
      therapy_category: input.therapyCategory,
      expert_id: input.expertId,
      scheduled_at: input.scheduledAt,
      notes: input.notes,
    })
    .select("*")
    .single();
  throwOnError("createAppointment", error);
  return data!;
}

export async function getAppointment(sb: Sb, appointmentId: string): Promise<AppointmentWithExpert | null> {
  const { data, error } = await sb
    .from("appointments")
    .select("*, experts(name, photo_url)")
    .eq("id", appointmentId)
    .maybeSingle();
  throwOnError("getAppointment", error);
  return data as unknown as AppointmentWithExpert | null;
}

export async function getUserAppointments(sb: Sb, userId: string): Promise<AppointmentWithExpert[]> {
  const { data, error } = await sb
    .from("appointments")
    .select("*, experts(name, photo_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  throwOnError("getUserAppointments", error);
  return (data as unknown as AppointmentWithExpert[]) ?? [];
}

// --- Expert dashboard ---------------------------------------------------

export async function getExpertByProfileId(sb: Sb, profileId: string): Promise<Expert | null> {
  const { data, error } = await sb.from("experts").select("*").eq("profile_id", profileId).maybeSingle();
  throwOnError("getExpertByProfileId", error);
  return data;
}

export async function getExpertAppointments(sb: Sb, expertId: string): Promise<Appointment[]> {
  const { data, error } = await sb
    .from("appointments")
    .select("*")
    .eq("expert_id", expertId)
    .order("created_at", { ascending: false });
  throwOnError("getExpertAppointments", error);
  return data ?? [];
}

// RLS (appointments_update) only lets the assigned expert or an admin do
// this — the same guard that stops a customer from marking their own
// booking "completed".
export async function updateAppointmentStatus(
  sb: Sb,
  appointmentId: string,
  status: Appointment["status"],
): Promise<void> {
  const { error } = await sb.from("appointments").update({ status }).eq("id", appointmentId);
  throwOnError("updateAppointmentStatus", error);
}

// --- Self-assessment ---------------------------------------------------------

// Scoring happens client-side (spec 4.10 allows either) — this just
// persists the answers + result. Works signed-in or guest, mirroring the
// cart's guest_session_id pattern; RLS treats user_id IS NULL rows as
// world-writable/readable, the same accepted tradeoff carts already use.
export async function submitAssessment(
  sb: Sb,
  input: { userId?: string; guestSessionId?: string; answers: Json; recommendedCategory: string },
): Promise<void> {
  const { error } = await sb.from("assessments").insert({
    user_id: input.userId,
    guest_session_id: input.guestSessionId,
    answers: input.answers,
    recommended_category: input.recommendedCategory,
  });
  throwOnError("submitAssessment", error);
}

// --- Coupons --------------------------------------------------------------

export type CouponPreview = { code: string; discountAmount: number };

// Client-side "Apply" preview only — reads the same public, RLS-gated
// coupons row (coupons_select already restricts this to is_active +
// unexpired) and reproduces create-order's discount math so the checkout
// summary can show the real number before payment. This is NOT the
// authoritative check: create-order revalidates everything (including
// usage_limit, which this preview can't safely enforce client-side
// without a race) server-side at pay time regardless of what this
// returns, so there's nothing to trust here beyond UX.
export async function validateCoupon(sb: Sb, code: string, subtotal: number): Promise<CouponPreview> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new ApiError("validateCoupon", { message: "Enter a coupon code" });

  const { data: coupon, error } = await sb.from("coupons").select("*").eq("code", normalized).maybeSingle();
  throwOnError("validateCoupon", error);

  if (!coupon || !coupon.is_active || (coupon.expires_at && new Date(coupon.expires_at) < new Date())) {
    throw new ApiError("validateCoupon", { message: "Invalid or expired coupon code" });
  }
  if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
    throw new ApiError("validateCoupon", { message: "This coupon has reached its usage limit" });
  }
  if (subtotal < Number(coupon.min_order_amount)) {
    throw new ApiError("validateCoupon", {
      message: `This coupon needs a minimum order of ₹${coupon.min_order_amount}`,
    });
  }

  let discountAmount =
    coupon.discount_type === "percent" ? subtotal * (Number(coupon.discount_value) / 100) : Number(coupon.discount_value);
  if (coupon.max_discount_amount !== null) discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
  discountAmount = Math.min(discountAmount, subtotal);

  return { code: coupon.code, discountAmount };
}

// --- Orders -------------------------------------------------------------

export async function getOrder(sb: Sb, orderId: string): Promise<OrderWithItems | null> {
  const { data, error } = await sb.from("orders").select("*, order_items(*)").eq("id", orderId).maybeSingle();
  throwOnError("getOrder", error);
  return data as unknown as OrderWithItems | null;
}

// "Your orders" — order_items joined with the variant/product so the list
// can show what was actually bought, not just totals.
export async function getUserOrders(sb: Sb, userId: string): Promise<OrderWithItemDetails[]> {
  const { data, error } = await sb
    .from("orders")
    .select("*, order_items(*, product_variants(variant_label, products(name)))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  throwOnError("getUserOrders", error);
  return (data as unknown as OrderWithItemDetails[]) ?? [];
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

// --- Business leads (corporate/EAP contact form) ----------------------------

// Public insert-only per RLS — the sales team reads these from the
// dashboard (or a future admin view), not the frontend.
export async function submitBusinessLead(
  sb: Sb,
  input: { companyName: string; contactName: string; email: string; phone?: string; message?: string },
): Promise<void> {
  const { error } = await sb.from("business_leads").insert({
    company_name: input.companyName,
    contact_name: input.contactName,
    email: input.email,
    phone: input.phone,
    message: input.message,
  });
  throwOnError("submitBusinessLead", error);
}

// --- FAQs, milestones (CMS content) ------------------------------------------

export async function getFaqs(sb: Sb, category?: string): Promise<Faq[]> {
  let query = sb.from("faqs").select("*");
  if (category) query = query.eq("category", category);
  const { data, error } = await query.order("category").order("sort_order");
  throwOnError("getFaqs", error);
  return data ?? [];
}

export async function getMilestones(sb: Sb): Promise<Milestone[]> {
  const { data, error } = await sb.from("milestones").select("*").order("sort_order");
  throwOnError("getMilestones", error);
  return data ?? [];
}
