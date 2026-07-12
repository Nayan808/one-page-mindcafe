"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getPickupLocationsAdmin, createPickupLocationAdmin, updatePickupLocationAdmin, deletePickupLocationAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { Modal } from "@/components/Modal";
import type { PickupLocation } from "@/types/domain";

type Form = { name: string; address: string; city: string; is_active: boolean };
const EMPTY: Form = { name: "", address: "", city: "", is_active: true };

export default function AdminPickupLocationsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "pickup-locations"], queryFn: () => getPickupLocationsAdmin(createClient()) });
  const [editing, setEditing] = useState<PickupLocation | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [isOpen, setIsOpen] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "pickup-locations"] });

  const save = useMutation({
    mutationFn: async () => {
      const sb = createClient();
      if (editing) return updatePickupLocationAdmin(sb, editing.id, form);
      return createPickupLocationAdmin(sb, form);
    },
    onSuccess: () => {
      invalidate();
      setIsOpen(false);
    },
  });
  const remove = useMutation({ mutationFn: (id: string) => deletePickupLocationAdmin(createClient(), id), onSuccess: invalidate });

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setIsOpen(true);
  }
  function openEdit(loc: PickupLocation) {
    setEditing(loc);
    setForm({ name: loc.name, address: loc.address, city: loc.city, is_active: loc.is_active });
    setIsOpen(true);
  }

  const columns: AdminColumn<PickupLocation>[] = [
    { key: "name", label: "name", render: (l) => <span className="font-medium text-ink">{l.name}</span> },
    { key: "address", label: "address", render: (l) => <span className="text-ink/60">{l.address}</span> },
    { key: "city", label: "city", render: (l) => <span>{l.city}</span> },
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
          <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="pill-btn w-full">
            {save.isPending ? "saving…" : "save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
