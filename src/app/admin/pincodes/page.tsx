"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getPincodesAdmin, createPincodeAdmin, updatePincodeAdmin, deletePincodeAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { Modal } from "@/components/Modal";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { formatInr } from "@/lib/utils";

type Pincode = { id: string; pincode: string; city: string; delivery_fee: number; free_delivery_threshold: number | null };
type Form = { pincode: string; city: string; delivery_fee: string; free_delivery_threshold: string };
const EMPTY: Form = { pincode: "", city: "", delivery_fee: "0", free_delivery_threshold: "" };

export default function AdminPincodesPage() {
  const confirmDialog = useConfirmDialog();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "pincodes"], queryFn: () => getPincodesAdmin(createClient()) });
  const [editing, setEditing] = useState<Pincode | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter((p) => p.pincode.includes(term) || p.city.toLowerCase().includes(term));
  }, [query.data, search]);

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
      setError(null);
      invalidate();
      setIsOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to save pincode"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deletePincodeAdmin(createClient(), id),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to delete pincode"),
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setIsOpen(true);
  }
  function openEdit(p: Pincode) {
    setEditing(p);
    setForm({ pincode: p.pincode, city: p.city, delivery_fee: String(p.delivery_fee), free_delivery_threshold: p.free_delivery_threshold ? String(p.free_delivery_threshold) : "" });
    setError(null);
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
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by pincode or city…" />
      <AdminTable
        columns={columns}
        rows={rows}
        getRowId={(p) => p.id}
        isLoading={query.isLoading}
        onEdit={openEdit}
        onDelete={async (p) => {
          if (await confirmDialog({ title: "delete pincode", message: `Delete "${p.pincode}"? This can't be undone.`, danger: true })) {
            remove.mutate(p.id);
          }
        }}
        emptyLabel="No matching pincodes."
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? "edit pincode" : "new pincode"}>
        <div className="space-y-3">
          <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Pincode" className="input" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="input" />
          <input value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} placeholder="Delivery fee" type="number" className="input" />
          <input value={form.free_delivery_threshold} onChange={(e) => setForm({ ...form, free_delivery_threshold: e.target.value })} placeholder="Free delivery above (optional)" type="number" className="input" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="pill-btn w-full">
            {save.isPending ? "saving…" : "save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
