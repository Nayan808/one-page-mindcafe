"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getPickupLocationsAdmin, createPickupLocationAdmin, updatePickupLocationAdmin, deletePickupLocationAdmin } from "@/lib/admin-api";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { Modal } from "@/components/Modal";
import type { PickupLocation } from "@/types/domain";

type Form = { name: string; address: string; city: string; is_active: boolean };
const EMPTY: Form = { name: "", address: "", city: "", is_active: true };

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
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "pickup-locations"], queryFn: () => getPickupLocationsAdmin(createClient()) });
  const [editing, setEditing] = useState<PickupLocation | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [pin, setPin] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [isReauthing, setIsReauthing] = useState(false);

  const pinChanged = Boolean(editing && pin !== editing.staff_pin);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "pickup-locations"] });

  const save = useMutation({
    mutationFn: async () => {
      const sb = createClient();
      if (editing) return updatePickupLocationAdmin(sb, editing.id, { ...form, ...(pinChanged ? { staff_pin: pin! } : {}) });
      return createPickupLocationAdmin(sb, form);
    },
    onSuccess: () => {
      invalidate();
      setIsOpen(false);
      setReauthPassword("");
      setReauthError(null);
    },
  });
  const remove = useMutation({ mutationFn: (id: string) => deletePickupLocationAdmin(createClient(), id), onSuccess: invalidate });

  // A changed PIN is a bearer credential, not a routine field edit — the
  // DB (prevent_staff_pin_change trigger) already refuses this write from
  // anyone but a super_admin, but that only stops the wrong *role*. This
  // re-checks the person actually typing right now, the same "are you
  // still you" gate re-entering a password gives on other sites before a
  // sensitive change — a super_admin's already-open laptop shouldn't be
  // enough on its own to hand out a working Zostel PIN.
  async function handleSave() {
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
    setIsOpen(true);
  }
  function openEdit(loc: PickupLocation) {
    setEditing(loc);
    setForm({ name: loc.name, address: loc.address, city: loc.city, is_active: loc.is_active });
    setPin(loc.staff_pin);
    setReauthPassword("");
    setReauthError(null);
    setIsOpen(true);
  }

  const columns: AdminColumn<PickupLocation>[] = [
    { key: "name", label: "name", render: (l) => <span className="font-medium text-ink">{l.name}</span> },
    { key: "address", label: "address", render: (l) => <span className="text-ink/60">{l.address}</span> },
    { key: "city", label: "city", render: (l) => <span>{l.city}</span> },
    { key: "staff_pin", label: "staff pin", render: (l) => <span className="font-mono tracking-widest">{l.staff_pin}</span> },
    { key: "active", label: "active", render: (l) => <span>{l.is_active ? "yes" : "no"}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="pickup locations" action={<button type="button" onClick={openNew} className="pill-btn !py-2 text-xs">+ new location</button>} />
      <AdminTable
        columns={columns}
        rows={query.data ?? []}
        getRowId={(l) => l.id}
        isLoading={query.isLoading}
        onEdit={openEdit}
        onDelete={(l) => confirm(`Delete ${l.name}?`) && remove.mutate(l.id)}
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? "edit location" : "new location"}>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name (e.g. Zostel Goa)" className="input" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="input" />
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" rows={2} className="input" />
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
