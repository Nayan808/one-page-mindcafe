"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ClipboardCheck,
  HeartHandshake,
  HelpCircle,
  House,
  MapPin,
  Pencil,
  Receipt,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useAddresses, useUserAppointments, useUserOrders, queryKeys } from "@/lib/query/hooks";
import { createClient } from "@/lib/supabase/client";
import { getFeelzCatalog, updateProfile } from "@/lib/api";
import { AddressForm, type AddressFormValues } from "@/components/AddressForm";
import { LinkPhoneSection } from "@/components/LinkPhoneSection";
import { OrderConfirmation, STATUS_LABELS } from "@/components/OrderConfirmation";
import { AppointmentConfirmation } from "@/components/AppointmentConfirmation";
import {
  CardHead,
  DashCard,
  DashboardShell,
  Eyebrow,
  IconTile,
  PageHead,
  SectionTitle,
  StatusPill,
  shortDate,
  shortTime,
  type PillTone,
} from "@/components/dashboard/DashboardUi";
import { formatDate, formatDateTime, formatInr } from "@/lib/utils";
import type { AppointmentWithExpert } from "@/types/domain";

const profileSchema = z.object({
  full_name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  gender: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const ORDER_TONES: Record<string, PillTone> = {
  placed: "amber",
  confirmed: "mauve",
  packed: "mauve",
  ready_for_pickup: "amber",
  picked_up: "green",
  shipped: "mauve",
  out_for_delivery: "mauve",
  delivered: "green",
  cancelled: "grey",
};

function categoryLabel(category: string) {
  return category.replace("-", " & ");
}

function scrollToSection(id: string) {
  window.requestAnimationFrame(() =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
}

function ProfileSection() {
  const { user, profile, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      gender: profile?.gender ?? "",
    },
  });

  async function onSubmit(values: ProfileValues) {
    if (!user) return;
    setIsSaving(true);
    setSaved(false);
    try {
      await updateProfile(createClient(), user.id, values);
      await refreshProfile();
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashCard id="profile">
      <CardHead eyebrow="Profile & settings" title="Your details" description={user?.email ?? undefined} />
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-[#68768b]">Full name</label>
          <input {...register("full_name")} className="input" />
          {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#68768b]">Phone</label>
          <input {...register("phone")} className="input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#68768b]">Gender</label>
          <select {...register("gender")} className="input">
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={isSaving} className="pill-btn">
            {isSaving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-sm text-emerald-700">Saved.</span>}
        </div>
      </form>
    </DashCard>
  );
}

function AddressesSection() {
  const { user } = useAuth();
  const { addresses, addAddress, editAddress, removeAddress } = useAddresses(user?.id ?? null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  async function handleAdd(values: AddressFormValues) {
    if (!user) return;
    await addAddress.mutateAsync({ ...values, user_id: user.id });
    setShowAddForm(false);
  }

  async function handleEdit(values: AddressFormValues) {
    if (!editingId) return;
    await editAddress.mutateAsync({ addressId: editingId, input: values });
    setEditingId(null);
  }

  const editingAddress = addresses.find((a) => a.id === editingId);

  return (
    <DashCard id="addresses">
      <CardHead
        eyebrow="Delivery"
        title="Saved addresses"
        action={
          !showAddForm &&
          !editingId && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="text-[11px] font-bold text-brand hover:underline"
            >
              + Add new
            </button>
          )
        }
      />

      <div className="space-y-2">
        {addresses.map((address) =>
          editingId === address.id ? (
            <div key={address.id} className="rounded-xl border border-[#eee4e9] p-3">
              <AddressForm
                onSubmit={handleEdit}
                isSubmitting={editAddress.isPending}
                submitLabel="Save Address"
                defaultValues={{
                  label: address.label ?? undefined,
                  full_name: address.full_name,
                  phone: address.phone,
                  line1: address.line1,
                  line2: address.line2 ?? undefined,
                  city: address.city,
                  state: address.state,
                  pincode: address.pincode,
                  landmark: address.landmark ?? undefined,
                }}
              />
              <button type="button" onClick={() => setEditingId(null)} className="mt-2 text-xs text-ink/60 underline">
                Cancel
              </button>
            </div>
          ) : (
            <div key={address.id} className="flex items-start gap-3 rounded-xl bg-[#faf8f9] p-3 text-sm">
              <IconTile>
                <MapPin className="h-4 w-4" aria-hidden />
              </IconTile>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-brand-navy">
                  {address.full_name}
                  {address.label ? <span className="ml-1.5 font-normal text-[#8992a0]">· {address.label}</span> : null}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-[#718096]">
                  {address.line1}, {address.city}, {address.state} {address.pincode}
                </span>
              </span>
              <div className="flex shrink-0 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(address.id);
                  }}
                  aria-label="Edit address"
                  className="text-ink/50 hover:text-brand"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => removeAddress.mutate(address.id)}
                  aria-label="Delete address"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ),
        )}

        {addresses.length === 0 && !showAddForm && <p className="text-sm text-[#718096]">No saved addresses yet.</p>}

        {showAddForm && (
          <div className="rounded-xl border border-[#eee4e9] p-3">
            <AddressForm onSubmit={handleAdd} isSubmitting={addAddress.isPending} submitLabel="Save Address" />
            <button type="button" onClick={() => setShowAddForm(false)} className="mt-2 text-xs text-ink/60 underline">
              Cancel
            </button>
          </div>
        )}
      </div>

      {editingAddress === undefined && editingId && (
        // Address was deleted elsewhere while its edit form was open.
        <p className="mt-2 text-xs text-ink/50">This address no longer exists.</p>
      )}
    </DashCard>
  );
}

const TABLE_HEAD =
  "border-b border-[#eee4e9] px-2.5 pb-2.5 text-left text-[9px] font-bold uppercase tracking-[0.08em] text-[#9299a5]";
const TABLE_CELL = "border-b border-[#f2edf0] px-2.5 py-3 text-[11px] text-[#5e6b7f]";

function OrderHistorySection({
  selectedOrderId,
  onSelect,
}: {
  selectedOrderId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { user } = useAuth();
  const { orders, isLoading } = useUserOrders(user?.id ?? null);

  return (
    <DashCard id="orders">
      <CardHead
        eyebrow="Orders & receipts"
        title="Your orders"
        action={
          <Link href="/feelz" className="text-[11px] font-bold text-brand hover:underline">
            Shop Feelz →
          </Link>
        }
      />

      {selectedOrderId ? (
        <OrderConfirmation
          orderId={selectedOrderId}
          onStartNewOrder={() => onSelect(null)}
          backLabel="Back to Orders"
        />
      ) : isLoading ? (
        <p className="text-sm text-[#718096]">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-[#718096]">No orders yet. Anything you buy will show up here.</p>
      ) : (
        <>
          <ul className="divide-y divide-[#f2edf0] md:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <button type="button" onClick={() => onSelect(order.id)} className="w-full py-3 text-left">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-brand-navy">{order.order_number}</span>
                    <StatusPill tone={ORDER_TONES[order.status] ?? "grey"}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </StatusPill>
                  </span>
                  <span className="mt-1 block text-[11px] text-[#5e6b7f]">
                    {order.order_items
                      .map((item) => `${item.quantity} × ${item.product_variants.products.name}`)
                      .join(", ")}
                  </span>
                  <span className="mt-1 flex items-center justify-between text-[11px] text-[#8992a0]">
                    <span>{formatDate(order.created_at)}</span>
                    <span className="font-semibold text-brand-navy">{formatInr(order.total)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TABLE_HEAD}>Order</th>
                  <th className={TABLE_HEAD}>Items</th>
                  <th className={TABLE_HEAD}>Date</th>
                  <th className={TABLE_HEAD}>Amount</th>
                  <th className={TABLE_HEAD}>Status</th>
                  <th className={TABLE_HEAD}>
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className={`${TABLE_CELL} font-semibold text-brand-navy`}>{order.order_number}</td>
                    <td className={`${TABLE_CELL} max-w-[16rem]`}>
                      {order.order_items
                        .map((item) => `${item.quantity} × ${item.product_variants.products.name}`)
                        .join(", ")}
                    </td>
                    <td className={`${TABLE_CELL} whitespace-nowrap`}>{formatDate(order.created_at)}</td>
                    <td className={`${TABLE_CELL} whitespace-nowrap font-semibold text-brand-navy`}>
                      {formatInr(order.total)}
                    </td>
                    <td className={TABLE_CELL}>
                      <StatusPill tone={ORDER_TONES[order.status] ?? "grey"}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </StatusPill>
                    </td>
                    <td className={`${TABLE_CELL} text-right`}>
                      <button
                        type="button"
                        onClick={() => onSelect(order.id)}
                        className="font-bold text-brand hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashCard>
  );
}

// Same priority order as AppointmentConfirmation.tsx's statusInfo — payment
// status takes priority over booking status, since a failed/incomplete
// payment never actually secured the slot, so "pending confirmation"
// (implying only the expert still needs to act) would be misleading.
function appointmentListStatus(appointment: AppointmentWithExpert): {
  text: string;
  tone: PillTone;
} {
  if (appointment.payment_status === "failed") return { text: "Payment failed", tone: "red" };
  if (appointment.payment_status === "pending") return { text: "Payment pending", tone: "amber" };
  if (appointment.status === "cancelled") return { text: "Cancelled", tone: "grey" };
  if (appointment.status === "completed") return { text: "Completed", tone: "grey" };
  if (appointment.status === "confirmed") return { text: "Confirmed", tone: "green" };
  return { text: "Awaiting confirmation", tone: "amber" };
}

function AppointmentsSection({
  appointments,
  isLoading,
  selectedAppointmentId,
  onSelect,
}: {
  appointments: AppointmentWithExpert[];
  isLoading: boolean;
  selectedAppointmentId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <DashCard id="sessions">
      <CardHead
        eyebrow="Counselling"
        title="Your sessions"
        action={
          <Link href="/counselling" className="text-[11px] font-bold text-brand hover:underline">
            Book a session →
          </Link>
        }
      />

      {selectedAppointmentId ? (
        <AppointmentConfirmation
          appointmentId={selectedAppointmentId}
          onBack={() => onSelect(null)}
          backLabel="Back to Appointments"
        />
      ) : isLoading ? (
        <p className="text-sm text-[#718096]">Loading your appointments…</p>
      ) : appointments.length === 0 ? (
        <p className="text-sm text-[#718096]">No sessions booked yet.</p>
      ) : (
        <>
          <ul className="divide-y divide-[#f2edf0] md:hidden">
            {appointments.map((appointment) => {
              const statusDisplay = appointmentListStatus(appointment);
              return (
                <li key={appointment.id}>
                  <button type="button" onClick={() => onSelect(appointment.id)} className="w-full py-3 text-left">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold capitalize text-brand-navy">
                        {categoryLabel(appointment.therapy_category)}
                      </span>
                      <StatusPill tone={statusDisplay.tone}>{statusDisplay.text}</StatusPill>
                    </span>
                    {appointment.experts && (
                      <span className="mt-1 block text-[11px] text-[#5e6b7f]">with {appointment.experts.name}</span>
                    )}
                    <span className="mt-1 flex items-center justify-between text-[11px] text-[#8992a0]">
                      <span>
                        {appointment.scheduled_at ? formatDateTime(appointment.scheduled_at) : "To be confirmed"}
                      </span>
                      <span className="font-semibold text-brand-navy">
                        {appointment.total === null
                          ? ""
                          : appointment.total === 0
                            ? "Free"
                            : formatInr(appointment.total)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TABLE_HEAD}>Session</th>
                  <th className={TABLE_HEAD}>Counsellor</th>
                  <th className={TABLE_HEAD}>Date</th>
                  <th className={TABLE_HEAD}>Amount</th>
                  <th className={TABLE_HEAD}>Status</th>
                  <th className={TABLE_HEAD}>
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => {
                  const statusDisplay = appointmentListStatus(appointment);
                  return (
                    <tr key={appointment.id}>
                      <td className={`${TABLE_CELL} font-semibold capitalize text-brand-navy`}>
                        {categoryLabel(appointment.therapy_category)}
                      </td>
                      <td className={TABLE_CELL}>{appointment.experts?.name ?? "—"}</td>
                      <td className={`${TABLE_CELL} whitespace-nowrap`}>
                        {appointment.scheduled_at ? formatDateTime(appointment.scheduled_at) : "To be confirmed"}
                      </td>
                      <td className={`${TABLE_CELL} whitespace-nowrap font-semibold text-brand-navy`}>
                        {appointment.total === null
                          ? "—"
                          : appointment.total === 0
                            ? "Free"
                            : formatInr(appointment.total)}
                      </td>
                      <td className={TABLE_CELL}>
                        <StatusPill tone={statusDisplay.tone}>{statusDisplay.text}</StatusPill>
                      </td>
                      <td className={`${TABLE_CELL} text-right`}>
                        <button
                          type="button"
                          onClick={() => onSelect(appointment.id)}
                          className="font-bold text-brand hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashCard>
  );
}

function ExpertAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" className="h-[52px] w-[52px] shrink-0 rounded-[15px] object-cover" />;
  }
  return (
    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[15px] bg-[#f4e8ee] text-lg font-bold text-brand">
      {name.charAt(0)}
    </span>
  );
}

// The first card on the overview: the next confirmed session if there is
// one, a paid request still waiting on the counsellor otherwise, and an
// invitation to book when there's nothing on the calendar.
function NextSessionCard({
  appointments,
  onOpen,
}: {
  appointments: AppointmentWithExpert[];
  onOpen: (id: string) => void;
}) {
  const soon = Date.now() - 60 * 60 * 1000;
  const next = appointments
    .filter((a) => a.status === "confirmed" && a.scheduled_at && new Date(a.scheduled_at).getTime() > soon)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];
  const awaiting = next ? undefined : appointments.find((a) => a.status === "pending" && a.payment_status === "paid");
  const shown = next ?? awaiting;

  return (
    <section className="flex min-h-[188px] flex-col justify-between rounded-[18px] border border-[#eee4e9] bg-[linear-gradient(110deg,#fff_0%,#fff_58%,#f9f0f4_100%)] p-5 shadow-[0_14px_36px_rgba(45,65,96,0.08)] sm:p-6">
      {shown ? (
        <>
          <CardHead
            eyebrow="Counselling"
            title={next ? "Your next session" : "Waiting for your counsellor to confirm"}
            action={
              <StatusPill tone={next ? "green" : "amber"}>{next ? "Confirmed" : "Awaiting confirmation"}</StatusPill>
            }
          />
          <div className="flex items-center gap-4">
            <ExpertAvatar name={shown.experts?.name ?? "M"} photoUrl={shown.experts?.photo_url ?? null} />
            <div className="min-w-0">
              <p className="text-sm font-bold capitalize text-brand-navy">
                {categoryLabel(shown.therapy_category)}
                {shown.experts ? <span className="normal-case"> with {shown.experts.name}</span> : null}
              </p>
              <p className="mt-0.5 text-xs text-[#718096]">
                {shown.scheduled_at
                  ? `${shortDate(shown.scheduled_at)} · ${shortTime(shown.scheduled_at)} · Online`
                  : "Time to be confirmed"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-[#eee4e9] pt-3.5 sm:flex-row sm:items-center sm:justify-between">
            <small className="text-[11px] text-[#718096]">
              {next
                ? "Your session link is also in your confirmation email."
                : "You'll get an email as soon as it's confirmed."}
            </small>
            <div className="flex gap-2">
              {next?.meet_link && (
                <a href={next.meet_link} target="_blank" rel="noreferrer" className="pill-btn !py-2 text-xs">
                  Join session
                </a>
              )}
              <button type="button" onClick={() => onOpen(shown.id)} className="pill-btn-outline !py-2 text-xs">
                Details
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <CardHead
            eyebrow="Counselling"
            title="Your next step, when you're ready"
            description="Browse qualified counsellors and choose a time that works for you."
            action={<StatusPill tone="mauve">Online sessions</StatusPill>}
          />
          <div className="mt-4 flex flex-col gap-3 border-t border-[#eee4e9] pt-3.5 sm:flex-row sm:items-center sm:justify-between">
            <small className="text-[11px] text-[#718096]">You&apos;ll see the session fee before you pay.</small>
            <Link href="/counselling" className="pill-btn !py-2.5 text-xs">
              Find a counsellor
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function PurchasesCard({ onOpenOrders }: { onOpenOrders: () => void }) {
  const { user } = useAuth();
  const { orders } = useUserOrders(user?.id ?? null);
  const { appointments } = useUserAppointments(user?.id ?? null);
  const paidSessions = appointments.filter((a) => a.payment_status === "paid").length;
  const latest = orders[0];

  return (
    <section className="relative overflow-hidden rounded-[18px] bg-brand-navy p-5 text-white shadow-[0_14px_36px_rgba(45,65,96,0.08)] sm:p-6">
      <span
        className="pointer-events-none absolute -top-10 right-3 select-none text-[170px] font-light leading-none text-white/[0.05]"
        aria-hidden
      >
        ₹
      </span>
      <div className="relative">
        <Eyebrow className="!text-[#e7c5d3]">Orders & payments</Eyebrow>
        <h2 className="font-[family-name:var(--font-display)] text-[19px] font-bold tracking-[-0.015em]">
          Your purchases
        </h2>
        <p className="mt-2.5 font-[family-name:var(--font-display)] text-[35px] font-bold leading-tight">
          {orders.length}
          <span className="ml-1.5 text-[13px] font-medium text-[#d7deea]">
            {orders.length === 1 ? "order" : "orders"} · {paidSessions} paid{" "}
            {paidSessions === 1 ? "session" : "sessions"}
          </span>
        </p>
        <p className="mt-1.5 text-xs text-[#d7deea]">
          {latest
            ? `Latest: ${latest.order_number} · ${STATUS_LABELS[latest.status] ?? latest.status}`
            : "Your Feelz orders and receipts will appear here."}
        </p>
        <button
          type="button"
          onClick={onOpenOrders}
          className="mt-3.5 inline-flex border-b border-white/40 text-[11px] font-bold text-white hover:border-white"
        >
          View orders & receipts →
        </button>
      </div>
    </section>
  );
}

const PLACES_TO_START = [
  {
    Icon: HeartHandshake,
    title: "Talk to a counsellor",
    body: "Find a professional who fits your needs and preferences.",
    href: "/counselling",
    cta: "Browse counsellors",
  },
  {
    Icon: ClipboardCheck,
    title: "Check in with yourself",
    body: "Use a self-assessment to reflect on how you've been feeling.",
    href: "/self-assessment",
    cta: "Explore assessments",
  },
  {
    Icon: HelpCircle,
    title: "Get your questions answered",
    body: "How sessions work, privacy, payments and Feelz.",
    href: "/faq",
    cta: "Read the FAQs",
  },
];

function FeelzRow() {
  const catalogQuery = useQuery({
    queryKey: queryKeys.feelzCatalog(),
    queryFn: () => getFeelzCatalog(createClient()),
  });
  const bundle = catalogQuery.data?.find((p) => p.is_bundle && p.product_variants[0]);
  const bundlePrice = bundle ? (bundle.product_variants[0].price_override ?? bundle.price) : null;

  return (
    <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-[#eee4e9] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#edf0f7] text-brand-navy">
          <Sparkles className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div>
          <h3 className="text-[13px] font-bold text-brand-navy">Feelz, for the moments that need a little support</h3>
          <p className="text-[11px] text-[#718096]">Explore Focus, Joy, Rest and Extrovert strips.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {bundlePrice !== null && (
          <span className="text-sm font-bold text-brand-navy">Bundle {formatInr(bundlePrice)}</span>
        )}
        <Link href="/feelz" className="pill-btn-outline !py-2 text-xs">
          Shop Feelz
        </Link>
      </div>
    </div>
  );
}

function AccountDashboard() {
  const { user, profile } = useAuth();
  const { appointments, isLoading: appointmentsLoading } = useUserAppointments(user?.id ?? null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const firstName = profile?.full_name?.trim().split(" ")[0];

  return (
    <DashboardShell
      workspaceLabel="Your space"
      items={[
        { id: "overview", label: "Overview", Icon: House },
        { id: "sessions", label: "Counselling", Icon: HeartHandshake },
        { id: "orders", label: "Orders & receipts", Icon: Receipt },
        { id: "addresses", label: "Addresses", Icon: MapPin },
        { id: "profile", label: "Profile & settings", Icon: UserRound },
      ]}
    >
      <PageHead
        id="overview"
        eyebrow="Your Mindcafe space"
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description="Take things one step at a time. Your support and activity are here."
        action={<span className="hidden whitespace-nowrap text-xs text-[#818b99] sm:inline">Personal account</span>}
      />

      <div className="mb-5 flex flex-col gap-3 rounded-[14px] border border-[#eee4e9] bg-white px-4 py-3 text-xs text-[#647187] sm:flex-row sm:items-center">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf3ee] text-[#477d67]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span>
          <strong className="text-brand-navy">Your space is private.</strong> Your sessions and orders are visible only
          to you, the counsellor you book with, and the Mindcafe team.
        </span>
        <Link href="/legal/privacy" className="whitespace-nowrap font-bold text-brand hover:underline sm:ml-auto">
          Privacy details ↗
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
        <NextSessionCard
          appointments={appointments}
          onOpen={(id) => {
            setSelectedAppointmentId(id);
            scrollToSection("sessions");
          }}
        />
        <PurchasesCard
          onOpenOrders={() => {
            setSelectedOrderId(null);
            scrollToSection("orders");
          }}
        />
      </div>

      <SectionTitle>A place to start</SectionTitle>
      <div className="grid gap-4 md:grid-cols-3">
        {PLACES_TO_START.map(({ Icon, title, body, href, cta }) => (
          <Link
            key={title}
            href={href}
            className="group flex min-h-[132px] flex-col rounded-[18px] border border-[#eee4e9] bg-white p-5 shadow-[0_14px_36px_rgba(45,65,96,0.08)] transition hover:-translate-y-0.5 hover:border-brand/25"
          >
            <IconTile className="mb-3">
              <Icon className="h-4 w-4" aria-hidden />
            </IconTile>
            <h3 className="text-sm font-bold text-brand-navy">{title}</h3>
            <p className="mb-3 mt-0.5 text-xs text-[#718096]">{body}</p>
            <span className="mt-auto text-[11px] font-bold text-brand">
              {cta} <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        ))}
      </div>
      <FeelzRow />

      <div className="mt-5 space-y-5">
        <AppointmentsSection
          appointments={appointments}
          isLoading={appointmentsLoading}
          selectedAppointmentId={selectedAppointmentId}
          onSelect={setSelectedAppointmentId}
        />
        <OrderHistorySection selectedOrderId={selectedOrderId} onSelect={setSelectedOrderId} />
        <div className="grid items-start gap-5 xl:grid-cols-2">
          <AddressesSection />
          <div className="space-y-5">
            {/* Keyed on the profile so the form picks up its saved values
                once the profile has loaded, instead of keeping the empty
                defaults it mounted with. */}
            <ProfileSection key={profile?.id ?? "loading"} />
            <LinkPhoneSection />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function AccountPage() {
  const { status } = useAuth();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    if (status === "unauthenticated") openAuthModal();
  }, [status, openAuthModal]);

  if (status === "unauthenticated") {
    return (
      <div className="bg-[#f7f5f6] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-sm rounded-[18px] border border-[#eee4e9] bg-white p-8 text-center shadow-[0_14px_36px_rgba(45,65,96,0.08)]">
          <Eyebrow>Your Mindcafe space</Eyebrow>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-brand-navy">
            Sign in to view your account
          </h1>
          <button type="button" onClick={openAuthModal} className="pill-btn mt-6">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return <div className="bg-[#f7f5f6] px-4 py-20 text-center text-sm text-ink/60">Loading…</div>;
  }

  return <AccountDashboard />;
}
