"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getPincodesAdmin, createPincodeAdmin, updatePincodeAdmin, deletePincodeAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { Modal } from "@/components/Modal";
import { formatInr } from "@/lib/utils";

type Pincode = { id: string; pincode: string; city: string; delivery_fee: number; free_delivery_threshold: number | null };
type Form = { pincode: string; city: string; delivery_fee: string; free_delivery_threshold: string };
const EMPTY: Form = { pincode: "", city: "", delivery_fee: "0", free_delivery_threshold: "" };

export default function AdminPincodesPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "pincodes"], queryFn: () => getPincodesAdmin(createClient()) });
  const [editing, setEditing] = useState<Pincode | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [isOpen, setIsOpen] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "pincodes"] });

  const save = useMutation({
    mutationFn: async () => {
      const input = {
        pincode: form.pincode,
        city: form.city,
        delivery_fee: Number(form.delivery_fee || 0),
        free_delivery_threshold: form.free_delivery_threshold ? Number(form.free_delivery_threshold) : null,
      };
      const sb = createClient();
      if (editing) return updatePincodeAdmin(sb, editing.id, input);
      return createPincodeAdmin(sb, input);
    },
    onSuccess: () => {
      invalidate();
      setIsOpen(false);
    },
  });
  const remove = useMutation({ mutationFn: (id: string) => deletePincodeAdmin(createClient(), id), onSuccess: invalidate });

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setIsOpen(true);
  }
  function openEdit(p: Pincode) {
    setEditing(p);
    setForm({ pincode: p.pincode, city: p.city, delivery_fee: String(p.delivery_fee), free_delivery_threshold: p.free_delivery_threshold ? String(p.free_delivery_threshold) : "" });
    setIsOpen(true);
  }

  const columns: AdminColumn<Pincode>[] = [
    { key: "pincode", label: "pincode", render: (p) => <span className="font-medium text-ink">{p.pincode}</span> },
    { key: "city", label: "city", render: (p) => <span>{p.city}</span> },
    { key: "fee", label: "delivery fee", render: (p) => <span>{formatInr(p.delivery_fee)}</span> },
    { key: "free_at", label: "free above", render: (p) => <span className="text-ink/60">{p.free_delivery_threshold ? formatInr(p.free_delivery_threshold) : "—"}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="serviceable pincodes" action={<button type="button" onClick={openNew} className="pill-btn !py-2 text-xs">+ new pincode</button>} />
      <AdminTable
        columns={columns}
        rows={query.data ?? []}
        getRowId={(p) => p.id}
        isLoading={query.isLoading}
        onEdit={openEdit}
        onDelete={(p) => confirm(`Delete ${p.pincode}?`) && remove.mutate(p.id)}
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? "edit pincode" : "new pincode"}>
        <div className="space-y-3">
          <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Pincode" className="input" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="input" />
          <input value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} placeholder="Delivery fee" type="number" className="input" />
          <input value={form.free_delivery_threshold} onChange={(e) => setForm({ ...form, free_delivery_threshold: e.target.value })} placeholder="Free delivery above (optional)" type="number" className="input" />
          <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="pill-btn w-full">
            {save.isPending ? "saving…" : "save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
