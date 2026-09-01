"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  getPickupLocationsAdmin,
  createPickupLocationAdmin,
  updatePickupLocationAdmin,
  deletePickupLocationAdmin,
  getCommissionAdjustmentsAdmin,
  createCommissionAdjustmentAdmin,
  deleteCommissionAdjustmentAdmin,
} from "@/lib/admin-api";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { Modal } from "@/components/Modal";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { formatInr } from "@/lib/utils";
import type { PickupLocation } from "@/types/domain";

function toLocalDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// A manual +/- ₹ correction, bonus, or deduction on top of the calculated
// percent × revenue commission /staff already shows — kept as a running
// ledger (see 20260901000000_pickup_location_commission_adjustments.sql)
// rather than a single overridable number, so a bonus doesn't erase a
// prior correction and every entry stays auditable.
function CommissionAdjustmentsSection({ locationId }: { locationId: string }) {
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const adjustmentsQuery = useQuery({
    queryKey: ["admin", "commission-adjustments", locationId],
    queryFn: () => getCommissionAdjustmentsAdmin(createClient(), locationId),
  });
  const adjustments = adjustmentsQuery.data ?? [];
  const total = adjustments.reduce((sum, a) => sum + Number(a.amount), 0);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(() => toLocalDateInputValue(new Date()));
  const [formError, setFormError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "commission-adjustments", locationId] });

  const add = useMutation({
    mutationFn: () =>
      createCommissionAdjustmentAdmin(createClient(), {
        locationId,
        amount: Number(amount),
        reason: reason.trim(),
        adjustmentDate: date,
      }),
    onSuccess: () => {
      setFormError(null);
      setAmount("");
      setReason("");
      invalidate();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Failed to add adjustment"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCommissionAdjustmentAdmin(createClient(), id),
    onSuccess: invalidate,
  });

  return (
    <div className="rounded-lg border border-ink/15 bg-cream/60 p-3">
      <p className="mb-1 text-xs font-medium text-ink/70">
        Commission adjustments — one-off corrections/bonuses/deductions on top of the percent-based commission
      </p>

      {adjustments.length > 0 && (
        <div className="mb-3 max-h-40 space-y-1.5 overflow-y-auto">
          {adjustments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-md bg-white px-2.5 py-1.5 text-xs">
              <div className="min-w-0">
                <span className={Number(a.amount) < 0 ? "font-semibold text-red-600" : "font-semibold text-emerald-700"}>
                  {Number(a.amount) >= 0 ? "+" : ""}
                  {formatInr(Number(a.amount))}
                </span>
                <span className="ml-2 text-ink/50">{a.adjustment_date}</span>
                <p className="truncate text-ink/70">{a.reason}</p>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(a.id)}
                disabled={remove.isPending}
                className="shrink-0 text-[11px] text-red-600 hover:text-red-700 disabled:opacity-40"
              >
                remove
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between px-2.5 pt-1 text-xs font-semibold text-ink">
            <span>Total adjustment</span>
            <span>{total >= 0 ? "+" : ""}{formatInr(total)}</span>
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (₹, use − for deduction)"
          className="input !py-1.5 text-xs sm:col-span-1"
        />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input !py-1.5 text-xs" />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (e.g. correction for double-counted sale)"
          className="input !py-1.5 text-xs sm:col-span-3"
        />
      </div>
      {formError && <p className="mt-1.5 text-xs text-red-600">{formError}</p>}
      <button
        type="button"
        onClick={() => add.mutate()}
        disabled={!amount || Number(amount) === 0 || !reason.trim() || add.isPending}
        className="pill-btn-outline mt-2 !py-1.5 text-xs disabled:opacity-40"
      >
        {add.isPending ? "adding…" : "add adjustment"}
      </button>
    </div>
  );
}

type Form = { name: string; address: string; city: string; is_active: boolean; commission_percent: number };
const EMPTY: Form = { name: "", address: "", city: "", is_active: true, commission_percent: 10 };

// Same excluded-ambiguous-chars alphabet the DB's generate_staff_pin()
// uses server-side (0/O, 1/I/L dropped) — client-side "regenerate" just
// fills the field for the admin to review before saving, the real write
// still goes through the normal admin-write RLS policy on update.
const PIN_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function randomPin(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => PIN_CHARS[b % PIN_CHARS.length]).join("");
}

export default function AdminPickupLocationsPage() {
  const { user, profile, signInWithPassword } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";
  const confirmDialog = useConfirmDialog();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "pickup-locations"], queryFn: () => getPickupLocationsAdmin(createClient()) });
  const [editing, setEditing] = useState<PickupLocation | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [pin, setPin] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [listError, setListError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter((l) => l.name.toLowerCase().includes(term) || l.city.toLowerCase().includes(term) || l.address.toLowerCase().includes(term));
  }, [query.data, search]);

  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [isReauthing, setIsReauthing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const pinChanged = Boolean(editing && pin !== editing.staff_pin);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "pickup-locations"] });

  const save = useMutation({
    mutationFn: async () => {
      const sb = createClient();
      if (editing) return updatePickupLocationAdmin(sb, editing.id, { ...form, ...(pinChanged ? { staff_pin: pin! } : {}) });
      return createPickupLocationAdmin(sb, form);
    },
    onSuccess: () => {
      setSaveError(null);
      invalidate();
      setIsOpen(false);
      setReauthPassword("");
      setReauthError(null);
    },
    onError: (err) => setSaveError(err instanceof Error ? err.message : "Failed to save location"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deletePickupLocationAdmin(createClient(), id),
    onSuccess: () => {
      setListError(null);
      invalidate();
    },
    onError: (err) => setListError(err instanceof Error ? err.message : "Failed to delete location"),
  });

  // A changed PIN is a bearer credential, not a routine field edit — the
  // DB (prevent_staff_pin_change trigger) already refuses this write from
  // anyone but a super_admin, but that only stops the wrong *role*. This
  // re-checks the person actually typing right now, the same "are you
  // still you" gate re-entering a password gives on other sites before a
  // sensitive change — a super_admin's already-open laptop shouldn't be
  // enough on its own to hand out a working Zostel PIN.
  async function handleSave() {
    setSaveError(null);
    if (!pinChanged) {
      save.mutate();
      return;
    }
    if (!user?.email) return;
    setIsReauthing(true);
    setReauthError(null);
    try {
      const { error } = await signInWithPassword(user.email, reauthPassword);
      if (error) throw new Error(error);
      save.mutate();
    } catch {
      setReauthError("Incorrect password — the PIN was not changed.");
    } finally {
      setIsReauthing(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setPin(null);
    setReauthPassword("");
    setReauthError(null);
    setSaveError(null);
    setIsOpen(true);
  }
  function openEdit(loc: PickupLocation) {
    setEditing(loc);
    setForm({
      name: loc.name,
      address: loc.address,
      city: loc.city,
      is_active: loc.is_active,
      commission_percent: loc.commission_percent,
    });
    setPin(loc.staff_pin);
    setReauthPassword("");
    setReauthError(null);
    setSaveError(null);
    setIsOpen(true);
  }

  const columns: AdminColumn<PickupLocation>[] = [
    { key: "name", label: "name", render: (l) => <span className="font-medium text-ink">{l.name}</span> },
    { key: "address", label: "address", render: (l) => <span className="text-ink/60">{l.address}</span> },
    { key: "city", label: "city", render: (l) => <span>{l.city}</span> },
    { key: "staff_pin", label: "staff pin", render: (l) => <span className="font-mono tracking-widest">{l.staff_pin}</span> },
    { key: "commission", label: "commission", render: (l) => <span>{Number(l.commission_percent)}%</span> },
    { key: "active", label: "active", render: (l) => <span>{l.is_active ? "yes" : "no"}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="pickup locations" action={<button type="button" onClick={openNew} className="pill-btn !py-2 text-xs">+ new location</button>} />
      {listError && <p className="mb-4 text-sm text-red-600">{listError}</p>}
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by name, city, or address…" />
      <AdminTable
        columns={columns}
        rows={rows}
        getRowId={(l) => l.id}
        isLoading={query.isLoading}
        onEdit={openEdit}
        onDelete={async (l) => {
          if (await confirmDialog({ title: "delete location", message: `Delete "${l.name}"? This can't be undone.`, danger: true })) {
            remove.mutate(l.id);
          }
        }}
        emptyLabel="No matching locations."
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? "edit location" : "new location"}>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name (e.g. Zostel Goa)" className="input" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="input" />
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" rows={2} className="input" />
          <div>
            <label className="mb-1 block text-sm text-ink/70">
              Commission % — Zostel&apos;s cut of every sale made at this location, shown on /staff
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.commission_percent}
              onChange={(e) => setForm({ ...form, commission_percent: Number(e.target.value) })}
              className="input"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active (shown on site)
          </label>

          {editing && (
            <div className="rounded-lg border border-ink/15 bg-cream/60 p-3">
              <p className="mb-1 text-xs font-medium text-ink/70">
                Staff PIN — unlocks <span className="font-mono">/staff</span> scoped to only this location&apos;s pickups
              </p>
              <div className="flex items-center gap-2">
                <span className="flex-1 rounded-md border border-ink/15 bg-white px-3 py-1.5 font-mono tracking-widest text-ink">{pin}</span>
                {isSuperAdmin ? (
                  <button type="button" onClick={() => setPin(randomPin())} className="pill-btn-outline shrink-0 !py-1.5 text-xs">
                    regenerate
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-ink/40">super_admin-only to rotate</span>
                )}
              </div>

              {pinChanged && isSuperAdmin && (
                <div className="mt-3 space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
                  <p className="text-xs text-amber-800">
                    Re-enter your account password to confirm this PIN change — the old PIN stops working the moment
                    it&apos;s saved.
                  </p>
                  <input
                    type="password"
                    value={reauthPassword}
                    onChange={(e) => {
                      setReauthPassword(e.target.value);
                      setReauthError(null);
                    }}
                    placeholder="Your account password"
                    className="input !py-1.5 text-sm"
                    autoFocus
                  />
                  {reauthError && <p className="text-xs text-red-600">{reauthError}</p>}
                </div>
              )}
            </div>
          )}

          {editing && <CommissionAdjustmentsSection locationId={editing.id} />}

          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          <button
            type="button"
            onClick={handleSave}
            disabled={save.isPending || isReauthing || (pinChanged && !reauthPassword)}
            className="pill-btn w-full"
          >
            {isReauthing ? "verifying password…" : save.isPending ? "saving…" : pinChanged ? "confirm password & save" : "save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
