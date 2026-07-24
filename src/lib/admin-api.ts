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
  AppointmentWithDetails,
  AppointmentWithExpert,
  BusinessLead,
  ContactMessage,
  Coupon,
  Expert,
  ExpertApplication,
  Faq,
  FeelzPreorder,
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

export type DashboardRange = "1d" | "7d" | "30d" | "all";

// Two different kinds of number here, deliberately kept apart instead of
// both being "affected by the date picker": pendingAppointments and
// newBusinessLeadsQueue are the *current* operational queue (appointments
// nobody's confirmed yet, leads nobody's followed up on) — showing "leads
// in the last 24h" there would hide a lead that came in 3 days ago and is
// still sitting unactioned. Everything under `range` is genuinely
// historical and does move with the picker.
export type SalesSummary = {
  pendingAppointments: number;
  newBusinessLeadsQueue: number;
  feelzPreordersTotal: number;
  range: {
    option: DashboardRange;
    // Combined across both revenue streams — Feelz product orders AND
    // paid counselling sessions. Kept split out below too
    // (productRevenue/appointmentRevenue) since they're different
    // businesses under one roof and collapsing them into one number
    // alone would hide which one is actually driving growth.
    totalRevenue: number;
    productRevenue: number;
    appointmentRevenue: number;
    paidOrderCount: number;
    paidAppointmentCount: number;
    newAppointments: number;
    newBusinessLeads: number;
    newNewsletterSubscribers: number;
    newFeelzPreorders: number;
    // Split per-day so a segment toggle (feelz-only / counselling-only) can
    // chart just its own stream instead of only ever showing the combined
    // total.
    dailyRevenue: { date: string; revenue: number; productRevenue: number; appointmentRevenue: number }[];
    ordersByStatus: Record<string, number>;
    appointmentsByStatus: Record<string, number>;
    orders: { order_number: string; created_at: string; status: string; payment_status: string; fulfillment_type: string; total: number }[];
  };
};

function rangeStartDate(range: DashboardRange): Date | null {
  if (range === "all") return null;
  const days = range === "1d" ? 1 : range === "7d" ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function getSalesSummary(sb: Sb, range: DashboardRange = "30d"): Promise<SalesSummary> {
  const rangeStart = rangeStartDate(range);
  const rangeStartIso = rangeStart?.toISOString();

  let ordersQuery = sb.from("orders").select("order_number, total, status, payment_status, fulfillment_type, created_at");
  if (rangeStartIso) ordersQuery = ordersQuery.gte("created_at", rangeStartIso);

  let appointmentsRangeQuery = sb.from("appointments").select("status", { count: "exact" });
  if (rangeStartIso) appointmentsRangeQuery = appointmentsRangeQuery.gte("created_at", rangeStartIso);

  // Paid appointments in-range — the counselling side of revenue, folded
  // into totalRevenue/dailyRevenue below alongside paid orders. Previously
  // this dashboard only ever counted product sales, silently excluding an
  // entire revenue stream.
  let paidAppointmentsQuery = sb.from("appointments").select("total, created_at").eq("payment_status", "paid");
  if (rangeStartIso) paidAppointmentsQuery = paidAppointmentsQuery.gte("created_at", rangeStartIso);

  let leadsRangeQuery = sb.from("business_leads").select("id", { count: "exact", head: true });
  if (rangeStartIso) leadsRangeQuery = leadsRangeQuery.gte("created_at", rangeStartIso);

  let subscribersRangeQuery = sb.from("newsletter_subscribers").select("id", { count: "exact", head: true });
  if (rangeStartIso) subscribersRangeQuery = subscribersRangeQuery.gte("subscribed_at", rangeStartIso);

  let preordersRangeQuery = sb.from("feelz_preorders").select("id", { count: "exact", head: true });
  if (rangeStartIso) preordersRangeQuery = preordersRangeQuery.gte("created_at", rangeStartIso);

  const [
    ordersRes,
    pendingAppointmentsRes,
    newLeadsQueueRes,
    appointmentsRangeRes,
    paidAppointmentsRes,
    leadsRangeRes,
    subscribersRangeRes,
    preordersTotalRes,
    preordersRangeRes,
  ] = await Promise.all([
    ordersQuery,
    sb.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("business_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    appointmentsRangeQuery,
    paidAppointmentsQuery,
    leadsRangeQuery,
    subscribersRangeQuery,
    sb.from("feelz_preorders").select("id", { count: "exact", head: true }),
    preordersRangeQuery,
  ]);
  throwOnError("getSalesSummary.orders", ordersRes.error);
  throwOnError("getSalesSummary.pendingAppointments", pendingAppointmentsRes.error);
  throwOnError("getSalesSummary.newLeadsQueue", newLeadsQueueRes.error);
  throwOnError("getSalesSummary.appointmentsRange", appointmentsRangeRes.error);
  throwOnError("getSalesSummary.paidAppointments", paidAppointmentsRes.error);
  throwOnError("getSalesSummary.leadsRange", leadsRangeRes.error);
  throwOnError("getSalesSummary.subscribersRange", subscribersRangeRes.error);
  throwOnError("getSalesSummary.preordersTotal", preordersTotalRes.error);
  throwOnError("getSalesSummary.preordersRange", preordersRangeRes.error);

  const orders = ordersRes.data ?? [];
  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const productRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

  const paidAppointments = (paidAppointmentsRes.data ?? []).filter((a) => a.total !== null);
  const appointmentRevenue = paidAppointments.reduce((sum, a) => sum + Number(a.total), 0);

  const totalRevenue = productRevenue + appointmentRevenue;

  const ordersByStatus: Record<string, number> = {};
  for (const o of orders) ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;

  const appointmentsByStatus: Record<string, number> = {};
  for (const a of appointmentsRangeRes.data ?? []) {
    appointmentsByStatus[a.status] = (appointmentsByStatus[a.status] ?? 0) + 1;
  }

  const byDay = new Map<string, { productRevenue: number; appointmentRevenue: number }>();
  for (const o of paidOrders) {
    const day = new Date(o.created_at).toISOString().slice(0, 10);
    const entry = byDay.get(day) ?? { productRevenue: 0, appointmentRevenue: 0 };
    entry.productRevenue += Number(o.total);
    byDay.set(day, entry);
  }
  for (const a of paidAppointments) {
    const day = new Date(a.created_at).toISOString().slice(0, 10);
    const entry = byDay.get(day) ?? { productRevenue: 0, appointmentRevenue: 0 };
    entry.appointmentRevenue += Number(a.total);
    byDay.set(day, entry);
  }
  const dailyRevenue = Array.from(byDay.entries())
    .map(([date, { productRevenue, appointmentRevenue }]) => ({
      date,
      revenue: productRevenue + appointmentRevenue,
      productRevenue,
      appointmentRevenue,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    pendingAppointments: pendingAppointmentsRes.count ?? 0,
    newBusinessLeadsQueue: newLeadsQueueRes.count ?? 0,
    feelzPreordersTotal: preordersTotalRes.count ?? 0,
    range: {
      option: range,
      totalRevenue,
      productRevenue,
      appointmentRevenue,
      paidOrderCount: paidOrders.length,
      paidAppointmentCount: paidAppointments.length,
      ordersByStatus,
      appointmentsByStatus,
      newAppointments: appointmentsRangeRes.count ?? 0,
      newBusinessLeads: leadsRangeRes.count ?? 0,
      newNewsletterSubscribers: subscribersRangeRes.count ?? 0,
      newFeelzPreorders: preordersRangeRes.count ?? 0,
      dailyRevenue,
      orders: orders
        .map((o) => ({ ...o, total: Number(o.total) }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    },
  };
}

// --- Orders ---------------------------------------------------------------

// PostgREST's .or() filter syntax uses "," and "()" as separators — a raw
// search term containing them would break the filter string rather than
// just fail to match, so they're stripped (not escaped; admin search
// input, not something that needs to preserve exact punctuation).
function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[,()]/g, "");
}

export async function getOrdersAdmin(
  sb: Sb,
  options: { page: number; pageSize: number; status?: string; search?: string },
): Promise<{ orders: OrderWithItems[]; total: number }> {
  const from = options.page * options.pageSize;
  const to = from + options.pageSize - 1;
  let query = sb.from("orders").select("*, order_items(*)", { count: "exact" });
  if (options.status) {
    query = query.eq("status", options.status as Database["public"]["Tables"]["orders"]["Row"]["status"]);
  }
  const term = options.search ? sanitizeSearchTerm(options.search) : "";
  if (term) {
    query = query.or(`order_number.ilike.%${term}%,guest_name.ilike.%${term}%,guest_phone.ilike.%${term}%`);
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
  options: { page: number; pageSize: number; status?: string; search?: string },
): Promise<{ appointments: AppointmentWithDetails[]; total: number }> {
  const from = options.page * options.pageSize;
  const to = from + options.pageSize - 1;
  let query = sb.from("appointments").select("*, experts(name, photo_url)", { count: "exact" });
  if (options.status) {
    query = query.eq("status", options.status as Database["public"]["Tables"]["appointments"]["Row"]["status"]);
  }
  // Only base-table columns are searchable via .or() — the joined expert's
  // name can't be combined into the same OR filter, so this covers notes/
  // category, not "search by customer or expert name".
  const term = options.search ? sanitizeSearchTerm(options.search) : "";
  if (term) {
    query = query.or(`notes.ilike.%${term}%,therapy_category.ilike.%${term}%`);
  }
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  throwOnError("getAppointmentsAdmin", error);

  // appointments.user_id has no FK to public.profiles (only to
  // auth.users), so the customer name/phone can't come along in the same
  // nested select above — same two-query merge pattern as
  // getExpertAppointments in lib/api.ts.
  const appointments = (data as unknown as AppointmentWithExpert[]) ?? [];
  const userIds = [...new Set(appointments.map((a) => a.user_id))];
  const profileById = new Map<string, { full_name: string | null; phone: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await sb.from("profiles").select("id, full_name, phone").in("id", userIds);
    throwOnError("getAppointmentsAdmin (profiles)", profilesError);
    for (const p of profiles ?? []) profileById.set(p.id, { full_name: p.full_name, phone: p.phone });
  }

  return {
    appointments: appointments.map((a) => ({ ...a, profiles: profileById.get(a.user_id) ?? null })) as AppointmentWithDetails[],
    total: count ?? 0,
  };
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
  const rows = (data as unknown as InventoryWithVariant[]) ?? [];
  // Without an explicit order, Postgres doesn't guarantee row order between
  // calls — an UPDATE can visibly reshuffle the list on the very next
  // refetch, which reads as "I changed the wrong row" even though nothing
  // is actually wrong. Sorted client-side (not via .order() on a joined
  // column, which the embedded product_variants(products(name)) shape
  // doesn't support directly) for a stable, human-readable order.
  return rows.sort((a, b) => {
    const nameCompare = a.product_variants.products.name.localeCompare(b.product_variants.products.name);
    return nameCompare !== 0 ? nameCompare : a.product_variants.variant_label.localeCompare(b.product_variants.variant_label);
  });
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

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Uploads directly to the public expert-photos bucket (see setup.sql —
// public read, is_admin() write) and returns the public URL to store on
// experts.photo_url. A random filename avoids collisions between two
// admins uploading around the same time; nothing here needs to be
// human-readable since it's never linked to from anywhere but that column.
export async function uploadExpertPhotoAdmin(sb: Sb, file: File): Promise<string> {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    throw new ApiError("uploadExpertPhotoAdmin", { message: "Please upload a JPEG, PNG, or WebP image" });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new ApiError("uploadExpertPhotoAdmin", { message: "Image must be under 5MB" });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await sb.storage.from("expert-photos").upload(path, file, { upsert: false });
  throwOnError("uploadExpertPhotoAdmin", uploadError);

  const { data } = sb.storage.from("expert-photos").getPublicUrl(path);
  return data.publicUrl;
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

// --- Contact messages -----------------------------------------------------

export async function getContactMessagesAdmin(sb: Sb): Promise<ContactMessage[]> {
  const { data, error } = await sb.from("contact_messages").select("*").order("created_at", { ascending: false });
  throwOnError("getContactMessagesAdmin", error);
  return data ?? [];
}

export async function updateContactMessageAdmin(
  sb: Sb,
  id: string,
  status: ContactMessage["status"],
): Promise<void> {
  const { error } = await sb.from("contact_messages").update({ status }).eq("id", id);
  throwOnError("updateContactMessageAdmin", error);
}

// --- Expert applications ("become an expert" submissions) -----------------

export async function getExpertApplicationsAdmin(sb: Sb): Promise<ExpertApplication[]> {
  const { data, error } = await sb.from("expert_applications").select("*").order("created_at", { ascending: false });
  throwOnError("getExpertApplicationsAdmin", error);
  return data ?? [];
}

export async function updateExpertApplicationAdmin(
  sb: Sb,
  id: string,
  status: ExpertApplication["status"],
): Promise<void> {
  const { error } = await sb.from("expert_applications").update({ status }).eq("id", id);
  throwOnError("updateExpertApplicationAdmin", error);
}

// --- Feelz preorders --------------------------------------------------------

export async function getFeelzPreordersAdmin(sb: Sb): Promise<FeelzPreorder[]> {
  const { data, error } = await sb.from("feelz_preorders").select("*").order("created_at", { ascending: false });
  throwOnError("getFeelzPreordersAdmin", error);
  return data ?? [];
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
