"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAddresses, useUserAppointments, useUserOrders } from "@/lib/query/hooks";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/api";
import { AddressForm, type AddressFormValues } from "@/components/AddressForm";
import { OrderConfirmation, STATUS_LABELS } from "@/components/OrderConfirmation";
import { formatInr } from "@/lib/utils";

const profileSchema = z.object({
  full_name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  gender: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

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
    defaultValues: { full_name: profile?.full_name ?? "", phone: profile?.phone ?? "", gender: profile?.gender ?? "" },
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
    <section className="rounded-2xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg font-bold lowercase text-ink">profile</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-ink/70">Full Name</label>
          <input {...register("full_name")} className="input" />
          {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Phone</label>
          <input {...register("phone")} className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Gender</label>
          <select {...register("gender")} className="input">
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex items-end gap-3 sm:col-span-2">
          <button type="submit" disabled={isSaving} className="pill-btn">
            {isSaving ? "saving…" : "save changes"}
          </button>
          {saved && <span className="text-sm text-emerald-700">Saved.</span>}
        </div>
      </form>
    </section>
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
    <section className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold lowercase text-ink">saved addresses</h2>
        {!showAddForm && !editingId && (
          <button type="button" onClick={() => setShowAddForm(true)} className="text-sm font-medium text-ink underline">
            + add new
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {addresses.map((address) =>
          editingId === address.id ? (
            <div key={address.id} className="rounded-xl border border-ink/15 p-3">
              <AddressForm
                onSubmit={handleEdit}
                isSubmitting={editAddress.isPending}
                submitLabel="Save address"
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
                cancel
              </button>
            </div>
          ) : (
            <div
              key={address.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-ink/15 p-3 text-sm"
            >
              <span>
                <span className="block font-medium text-ink">{address.full_name}</span>
                <span className="block text-ink/60">
                  {address.line1}, {address.city}, {address.state} {address.pincode}
                </span>
              </span>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(address.id);
                  }}
                  aria-label="Edit address"
                  className="text-ink/60 hover:text-ink"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => removeAddress.mutate(address.id)}
                  aria-label="Delete address"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ),
        )}

        {addresses.length === 0 && !showAddForm && <p className="text-sm text-ink/60">No saved addresses yet.</p>}

        {showAddForm && (
          <div className="rounded-xl border border-ink/15 p-3">
            <AddressForm onSubmit={handleAdd} isSubmitting={addAddress.isPending} submitLabel="Save address" />
            <button type="button" onClick={() => setShowAddForm(false)} className="mt-2 text-xs text-ink/60 underline">
              cancel
            </button>
          </div>
        )}
      </div>

      {editingAddress === undefined && editingId && (
        // Address was deleted elsewhere while its edit form was open.
        <p className="mt-2 text-xs text-ink/50">This address no longer exists.</p>
      )}
    </section>
  );
}

function OrderHistorySection() {
  const { user } = useAuth();
  const { orders, isLoading } = useUserOrders(user?.id ?? null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg font-bold lowercase text-ink">order history</h2>

      {selectedOrderId ? (
        <div className="mt-4">
          <OrderConfirmation
            orderId={selectedOrderId}
            onStartNewOrder={() => setSelectedOrderId(null)}
            backLabel="back to orders"
          />
        </div>
      ) : isLoading ? (
        <p className="mt-4 text-sm text-ink/60">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <p className="mt-4 text-sm text-ink/60">No orders yet — anything you buy will show up here.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {orders.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setSelectedOrderId(order.id)}
                className="w-full rounded-xl border border-ink/15 p-3 text-left text-sm transition hover:border-ink/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink">{order.order_number}</span>
                  <span className="text-xs font-medium text-ink/60">{STATUS_LABELS[order.status] ?? order.status}</span>
                </div>
                <p className="mt-1 text-ink/60">
                  {order.order_items.map((item) => `${item.quantity} × ${item.product_variants.products.name}`).join(", ")}
                </p>
                <div className="mt-1 flex items-center justify-between text-ink/60">
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  <span className="font-medium text-ink">{formatInr(order.total)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

function AppointmentsSection() {
  const { user } = useAuth();
  const { appointments, isLoading } = useUserAppointments(user?.id ?? null);

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg font-bold lowercase text-ink">counselling appointments</h2>

      {isLoading ? (
        <p className="mt-4 text-sm text-ink/60">Loading your appointments…</p>
      ) : appointments.length === 0 ? (
        <p className="mt-4 text-sm text-ink/60">No sessions booked yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="rounded-xl border border-ink/15 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium capitalize text-ink">{appointment.therapy_category.replace("-", " & ")}</span>
                <span className="text-xs font-medium text-ink/60">
                  {APPOINTMENT_STATUS_LABELS[appointment.status] ?? appointment.status}
                </span>
              </div>
              {appointment.experts && <p className="mt-1 text-ink/60">with {appointment.experts.name}</p>}
              <p className="mt-1 text-ink/50">
                {appointment.scheduled_at
                  ? new Date(appointment.scheduled_at).toLocaleString()
                  : "Time to be confirmed"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AccountPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?returnTo=%2Faccount");
  }, [status, router]);

  if (status !== "authenticated") {
    return <div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold lowercase text-ink">your account</h1>
      <ProfileSection />
      <AddressesSection />
      <OrderHistorySection />
      <AppointmentsSection />
    </div>
  );
}
