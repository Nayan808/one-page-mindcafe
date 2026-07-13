// Admin-only data access — every function here assumes the caller's RLS
// identity is is_admin() (or is_super_admin() for the role-management
// ones). Nothing here does its own authorization check client-side
// beyond that; the database is what actually enforces it (see
// AUTH_AND_ROLES.md). Kept separate from lib/api.ts, which is the public-
// facing surface every signed-out visitor's browser also loads.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";
import { ApiError } from "@/lib/api";
import type {
  Appointment,
  AppointmentWithExpert,
  BusinessLead,
  Coupon,
  Expert,
  Faq,
  InventoryWithVariant,
  Milestone,
  NewsletterSubscriber,
  OrderWithItems,
  PickupLocation,
  ProductVariant,
  ProductWithVariants,
  Review,
  SiteSetting,
  TherapyCategory,
} from "@/types/domain";

type Sb = SupabaseClient<Database>;

function throwOnError(context: string, error: unknown): void {
  if (error) throw new ApiError(context, error);
}

// --- Sales / analytics ---------------------------------------------------

export type SalesSummary = {
  totalRevenue: number;
  paidOrderCount: number;
  ordersByStatus: Record<string, number>;
  revenueLast30Days: { date: string; revenue: number }[];
  pendingAppointments: number;
  newBusinessLeads: number;
  newsletterSubscribers: number;
};

export async function getSalesSummary(sb: Sb): Promise<SalesSummary> {
  const [ordersRes, appointmentsRes, leadsRes, subscribersRes] = await Promise.all([
    sb.from("orders").select("total, status, payment_status, created_at"),
    sb.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("business_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    sb.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
  ]);
  throwOnError("getSalesSummary.orders", ordersRes.error);
  throwOnError("getSalesSummary.appointments", appointmentsRes.error);
  throwOnError("getSalesSummary.leads", leadsRes.error);
  throwOnError("getSalesSummary.subscribers", subscribersRes.error);

  const orders = ordersRes.data ?? [];
  const paid = orders.filter((o) => o.payment_status === "paid");
  const totalRevenue = paid.reduce((sum, o) => sum + Number(o.total), 0);

  const ordersByStatus: Record<string, number> = {};
  for (const o of orders) ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const byDay = new Map<string, number>();
  for (const o of paid) {
    const createdAt = new Date(o.created_at);
    if (createdAt < thirtyDaysAgo) continue;
    const day = createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + Number(o.total));
  }
  const revenueLast30Days = Array.from(byDay.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalRevenue,
    paidOrderCount: paid.length,
    ordersByStatus,
    revenueLast30Days,
    pendingAppointments: appointmentsRes.count ?? 0,
    newBusinessLeads: leadsRes.count ?? 0,
    newsletterSubscribers: subscribersRes.count ?? 0,
  };
}

// --- Orders ---------------------------------------------------------------

export async function getOrdersAdmin(
  sb: Sb,
  options: { page: number; pageSize: number; status?: string },
): Promise<{ orders: OrderWithItems[]; total: number }> {
  const from = options.page * options.pageSize;
  const to = from + options.pageSize - 1;
  let query = sb.from("orders").select("*, order_items(*)", { count: "exact" });
  if (options.status) {
    query = query.eq("status", options.status as Database["public"]["Tables"]["orders"]["Row"]["status"]);
  }
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  throwOnError("getOrdersAdmin", error);
  return { orders: (data as unknown as OrderWithItems[]) ?? [], total: count ?? 0 };
}

export async function updateOrderStatusAdmin(
  sb: Sb,
  orderId: string,
  status: Database["public"]["Tables"]["orders"]["Row"]["status"],
): Promise<void> {
  const { error } = await sb.from("orders").update({ status }).eq("id", orderId);
  throwOnError("updateOrderStatusAdmin", error);
}

// --- Appointments -----------------------------------------------------------

export async function getAppointmentsAdmin(
  sb: Sb,
  options: { page: number; pageSize: number; status?: string },
): Promise<{ appointments: AppointmentWithExpert[]; total: number }> {
  const from = options.page * options.pageSize;
  const to = from + options.pageSize - 1;
  let query = sb.from("appointments").select("*, experts(name, photo_url)", { count: "exact" });
  if (options.status) {
    query = query.eq("status", options.status as Database["public"]["Tables"]["appointments"]["Row"]["status"]);
  }
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  throwOnError("getAppointmentsAdmin", error);
  return { appointments: (data as unknown as AppointmentWithExpert[]) ?? [], total: count ?? 0 };
}

export async function updateAppointmentAdmin(
  sb: Sb,
  appointmentId: string,
  input: Database["public"]["Tables"]["appointments"]["Update"],
): Promise<void> {
  const { error } = await sb.from("appointments").update(input).eq("id", appointmentId);
  throwOnError("updateAppointmentAdmin", error);
}

// --- Products & variants ----------------------------------------------------

export async function getProductsAdmin(sb: Sb): Promise<ProductWithVariants[]> {
  const { data, error } = await sb.from("products").select("*, product_variants(*)").order("name");
  throwOnError("getProductsAdmin", error);
  return (data as ProductWithVariants[]) ?? [];
}

export async function createProductAdmin(
  sb: Sb,
  input: Database["public"]["Tables"]["products"]["Insert"],
) {
  const { data, error } = await sb.from("products").insert(input).select("*").single();
  throwOnError("createProductAdmin", error);
  return data!;
}

export async function updateProductAdmin(
  sb: Sb,
  id: string,
  input: Database["public"]["Tables"]["products"]["Update"],
) {
  const { error } = await sb.from("products").update(input).eq("id", id);
  throwOnError("updateProductAdmin", error);
}

export async function deleteProductAdmin(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("products").delete().eq("id", id);
  throwOnError("deleteProductAdmin", error);
}

export async function createVariantAdmin(
  sb: Sb,
  input: Database["public"]["Tables"]["product_variants"]["Insert"],
): Promise<ProductVariant> {
  const { data, error } = await sb.from("product_variants").insert(input).select("*").single();
  throwOnError("createVariantAdmin", error);
  return data!;
}

export async function updateVariantAdmin(
  sb: Sb,
  id: string,
  input: Database["public"]["Tables"]["product_variants"]["Update"],
): Promise<void> {
  const { error } = await sb.from("product_variants").update(input).eq("id", id);
  throwOnError("updateVariantAdmin", error);
}

export async function deleteVariantAdmin(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("product_variants").delete().eq("id", id);
  throwOnError("deleteVariantAdmin", error);
}

// --- Coupons ----------------------------------------------------------------

export async function getCouponsAdmin(sb: Sb): Promise<Coupon[]> {
  const { data, error } = await sb.from("coupons").select("*").order("created_at", { ascending: false });
  throwOnError("getCouponsAdmin", error);
  return data ?? [];
}

export async function createCouponAdmin(sb: Sb, input: Database["public"]["Tables"]["coupons"]["Insert"]) {
  const { data, error } = await sb.from("coupons").insert(input).select("*").single();
  throwOnError("createCouponAdmin", error);
  return data!;
}

export async function updateCouponAdmin(
  sb: Sb,
  id: string,
  input: Database["public"]["Tables"]["coupons"]["Update"],
): Promise<void> {
  const { error } = await sb.from("coupons").update(input).eq("id", id);
  throwOnError("updateCouponAdmin", error);
}

export async function deleteCouponAdmin(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("coupons").delete().eq("id", id);
  throwOnError("deleteCouponAdmin", error);
}

// --- Pickup locations ---------------------------------------------------

export async function getPickupLocationsAdmin(sb: Sb): Promise<PickupLocation[]> {
  const { data, error } = await sb.from("pickup_locations").select("*").order("name");
  throwOnError("getPickupLocationsAdmin", error);
  return data ?? [];
}

export async function createPickupLocationAdmin(
  sb: Sb,
  input: Database["public"]["Tables"]["pickup_locations"]["Insert"],
) {
  const { data, error } = await sb.from("pickup_locations").insert(input).select("*").single();
  throwOnError("createPickupLocationAdmin", error);
  return data!;
}

export async function updatePickupLocationAdmin(
  sb: Sb,
  id: string,
  input: Database["public"]["Tables"]["pickup_locations"]["Update"],
): Promise<void> {
  const { error } = await sb.from("pickup_locations").update(input).eq("id", id);
  throwOnError("updatePickupLocationAdmin", error);
}

export async function deletePickupLocationAdmin(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("pickup_locations").delete().eq("id", id);
  throwOnError("deletePickupLocationAdmin", error);
}

// --- Inventory (per-location stock) ---------------------------------------

// location_id = null is the central/online pool (used for delivery
// orders); every other value is a specific pickup_locations row's
// takeaway stock. Kept as two separate rows per variant on purpose (see
// setup.sql's inventory table) — an online sale and a walk-in sale at a
// Zostel never compete for the same units.
export async function getInventoryAdmin(sb: Sb, locationId: string | null): Promise<InventoryWithVariant[]> {
  let query = sb.from("inventory").select("*, product_variants(*, products(name))");
  query = locationId === null ? query.is("location_id", null) : query.eq("location_id", locationId);
  const { data, error } = await query;
  throwOnError("getInventoryAdmin", error);
  return (data as unknown as InventoryWithVariant[]) ?? [];
}

export async function updateInventoryQuantityAdmin(sb: Sb, id: string, quantity: number): Promise<void> {
  const { error } = await sb.from("inventory").update({ quantity_available: quantity }).eq("id", id);
  throwOnError("updateInventoryQuantityAdmin", error);
}

// --- Serviceable pincodes -------------------------------------------------

export async function getPincodesAdmin(sb: Sb) {
  const { data, error } = await sb.from("serviceable_pincodes").select("*").order("pincode");
  throwOnError("getPincodesAdmin", error);
  return data ?? [];
}

export async function createPincodeAdmin(
  sb: Sb,
  input: Database["public"]["Tables"]["serviceable_pincodes"]["Insert"],
) {
  const { data, error } = await sb.from("serviceable_pincodes").insert(input).select("*").single();
  throwOnError("createPincodeAdmin", error);
  return data!;
}

export async function updatePincodeAdmin(
  sb: Sb,
  id: string,
  input: Database["public"]["Tables"]["serviceable_pincodes"]["Update"],
): Promise<void> {
  const { error } = await sb.from("serviceable_pincodes").update(input).eq("id", id);
  throwOnError("updatePincodeAdmin", error);
}

export async function deletePincodeAdmin(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("serviceable_pincodes").delete().eq("id", id);
  throwOnError("deletePincodeAdmin", error);
}

// --- Experts (edit/moderate — creation stays in admin-create-expert) -----

export async function getAllExpertsAdmin(sb: Sb): Promise<Expert[]> {
  const { data, error } = await sb.from("experts").select("*").order("name");
  throwOnError("getAllExpertsAdmin", error);
  return data ?? [];
}

export async function updateExpertAdmin(
  sb: Sb,
  id: string,
  input: Database["public"]["Tables"]["experts"]["Update"],
): Promise<void> {
  const { error } = await sb.from("experts").update(input).eq("id", id);
  throwOnError("updateExpertAdmin", error);
}

export async function deleteExpertAdmin(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("experts").delete().eq("id", id);
  throwOnError("deleteExpertAdmin", error);
}

// Links an ALREADY-SIGNED-UP account to a directory-only expert row (the
// other path to expert login access, alongside admin-create-expert which
// creates a brand-new account). Two writes, deliberately in this order:
// the role change is attempted first because it's the one that requires
// super_admin (prevent_role_self_escalation) — if it fails, nothing about
// the experts row has changed yet, so there's no partial link left behind
// for a plain admin who tries this.
export async function linkExistingUserAsExpertAdmin(sb: Sb, expertId: string, userId: string): Promise<void> {
  const { error: roleError } = await sb.from("profiles").update({ role: "expert" }).eq("id", userId);
  throwOnError("linkExistingUserAsExpertAdmin.role", roleError);

  const { error: linkError } = await sb.from("experts").update({ profile_id: userId }).eq("id", expertId);
  throwOnError("linkExistingUserAsExpertAdmin.link", linkError);
}

// Removes login access without touching the person's role — deciding
// whether they should also stop being 'expert' is a separate call (the
// /admin/users role dropdown), not implied by unlinking the directory
// entry.
export async function unlinkExpertAdmin(sb: Sb, expertId: string): Promise<void> {
  const { error } = await sb.from("experts").update({ profile_id: null }).eq("id", expertId);
  throwOnError("unlinkExpertAdmin", error);
}

// --- Business leads -----------------------------------------------------

export async function getBusinessLeadsAdmin(sb: Sb): Promise<BusinessLead[]> {
  const { data, error } = await sb.from("business_leads").select("*").order("created_at", { ascending: false });
  throwOnError("getBusinessLeadsAdmin", error);
  return data ?? [];
}

export async function updateBusinessLeadAdmin(
  sb: Sb,
  id: string,
  status: BusinessLead["status"],
): Promise<void> {
  const { error } = await sb.from("business_leads").update({ status }).eq("id", id);
  throwOnError("updateBusinessLeadAdmin", error);
}

// --- FAQs -----------------------------------------------------------------

export async function createFaqAdmin(sb: Sb, input: Database["public"]["Tables"]["faqs"]["Insert"]): Promise<Faq> {
  const { data, error } = await sb.from("faqs").insert(input).select("*").single();
  throwOnError("createFaqAdmin", error);
  return data!;
}

export async function updateFaqAdmin(
  sb: Sb,
  id: string,
  input: Database["public"]["Tables"]["faqs"]["Update"],
): Promise<void> {
  const { error } = await sb.from("faqs").update(input).eq("id", id);
  throwOnError("updateFaqAdmin", error);
}

export async function deleteFaqAdmin(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("faqs").delete().eq("id", id);
  throwOnError("deleteFaqAdmin", error);
}

// --- Therapy categories ---------------------------------------------------

export async function updateTherapyCategoryAdmin(
  sb: Sb,
  slug: string,
  input: Database["public"]["Tables"]["therapy_categories"]["Update"],
): Promise<void> {
  const { error } = await sb.from("therapy_categories").update(input).eq("slug", slug);
  throwOnError("updateTherapyCategoryAdmin", error);
}

// --- Milestones -------------------------------------------------------------

export async function createMilestoneAdmin(
  sb: Sb,
  input: Database["public"]["Tables"]["milestones"]["Insert"],
): Promise<Milestone> {
  const { data, error } = await sb.from("milestones").insert(input).select("*").single();
  throwOnError("createMilestoneAdmin", error);
  return data!;
}

export async function updateMilestoneAdmin(
  sb: Sb,
  id: string,
  input: Database["public"]["Tables"]["milestones"]["Update"],
): Promise<void> {
  const { error } = await sb.from("milestones").update(input).eq("id", id);
  throwOnError("updateMilestoneAdmin", error);
}

export async function deleteMilestoneAdmin(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("milestones").delete().eq("id", id);
  throwOnError("deleteMilestoneAdmin", error);
}

// --- Site settings ----------------------------------------------------------

export async function getAllSiteSettingsAdmin(sb: Sb): Promise<SiteSetting[]> {
  const { data, error } = await sb.from("site_settings").select("*").order("key");
  throwOnError("getAllSiteSettingsAdmin", error);
  return data ?? [];
}

export async function upsertSiteSettingAdmin(sb: Sb, key: string, value: Json): Promise<void> {
  const { error } = await sb.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  throwOnError("upsertSiteSettingAdmin", error);
}

export async function deleteSiteSettingAdmin(sb: Sb, key: string): Promise<void> {
  const { error } = await sb.from("site_settings").delete().eq("key", key);
  throwOnError("deleteSiteSettingAdmin", error);
}

// --- Reviews ----------------------------------------------------------------

export async function getAllReviewsAdmin(sb: Sb): Promise<Review[]> {
  const { data, error } = await sb.from("reviews").select("*").order("created_at", { ascending: false });
  throwOnError("getAllReviewsAdmin", error);
  return data ?? [];
}

export async function updateReviewAdmin(
  sb: Sb,
  id: string,
  input: Database["public"]["Tables"]["reviews"]["Update"],
): Promise<void> {
  const { error } = await sb.from("reviews").update(input).eq("id", id);
  throwOnError("updateReviewAdmin", error);
}

export async function deleteReviewAdmin(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("reviews").delete().eq("id", id);
  throwOnError("deleteReviewAdmin", error);
}

// --- Newsletter -------------------------------------------------------------

export async function getNewsletterSubscribersAdmin(sb: Sb): Promise<NewsletterSubscriber[]> {
  const { data, error } = await sb.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false });
  throwOnError("getNewsletterSubscribersAdmin", error);
  return data ?? [];
}

// --- Users & roles (list via Edge Function; role change is a direct,
// RLS-enforced table update — only actually succeeds for a super_admin
// caller, see prevent_role_self_escalation() in setup.sql) -------------

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Database["public"]["Tables"]["profiles"]["Row"]["role"];
  created_at: string;
};

export async function listUsersAdmin(sb: Sb): Promise<AdminUserRow[]> {
  const { data, error } = await sb.functions.invoke("admin-list-users", { body: {} });
  if (error) {
    const detail = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new ApiError("listUsersAdmin", { message: detail?.error ?? error.message });
  }
  return (data as { users: AdminUserRow[] }).users;
}

export async function updateUserRoleAdmin(
  sb: Sb,
  userId: string,
  role: Database["public"]["Tables"]["profiles"]["Row"]["role"],
): Promise<void> {
  const { error } = await sb.from("profiles").update({ role }).eq("id", userId);
  throwOnError("updateUserRoleAdmin", error);
}
