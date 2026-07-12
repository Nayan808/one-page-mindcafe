"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCouponsAdmin, createCouponAdmin, updateCouponAdmin, deleteCouponAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { Modal } from "@/components/Modal";
import { formatInr } from "@/lib/utils";
import type { Coupon } from "@/types/domain";

type Form = {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  min_order_amount: string;
  max_discount_amount: string;
  usage_limit: string;
  expires_at: string;
  is_active: boolean;
};
const EMPTY: Form = { code: "", discount_type: "percent", discount_value: "", min_order_amount: "0", max_discount_amount: "", usage_limit: "", expires_at: "", is_active: true };

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const couponsQuery = useQuery({ queryKey: ["admin", "coupons"], queryFn: () => getCouponsAdmin(createClient()) });
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [isOpen, setIsOpen] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });

  const save = useMutation({
    mutationFn: async () => {
      const input = {
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount || 0),
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        is_active: form.is_active,
      };
      const sb = createClient();
      if (editing) return updateCouponAdmin(sb, editing.id, input);
      return createCouponAdmin(sb, input);
    },
    onSuccess: () => {
      invalidate();
      setIsOpen(false);
    },
  });

  const remove = useMutation({ mutationFn: (id: string) => deleteCouponAdmin(createClient(), id), onSuccess: invalidate });

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setIsOpen(true);
  }
  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: String(coupon.min_order_amount),
      max_discount_amount: coupon.max_discount_amount ? String(coupon.max_discount_amount) : "",
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : "",
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : "",
      is_active: coupon.is_active,
    });
    setIsOpen(true);
  }

  const columns: AdminColumn<Coupon>[] = [
    { key: "code", label: "code", render: (c) => <span className="font-medium text-ink">{c.code}</span> },
    { key: "discount", label: "discount", render: (c) => <span>{c.discount_type === "percent" ? `${c.discount_value}%` : formatInr(c.discount_value)}</span> },
    { key: "used", label: "used", render: (c) => <span>{c.times_used}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</span> },
    { key: "expires", label: "expires", render: (c) => <span className="text-ink/60">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "never"}</span> },
    { key: "active", label: "active", render: (c) => <span>{c.is_active ? "yes" : "no"}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="coupons" action={<button type="button" onClick={openNew} className="pill-btn !py-2 text-xs">+ new coupon</button>} />
      <AdminTable
        columns={columns}
        rows={couponsQuery.data ?? []}
        getRowId={(c) => c.id}
        isLoading={couponsQuery.isLoading}
        onEdit={openEdit}
        onDelete={(c) => confirm(`Delete ${c.code}?`) && remove.mutate(c.id)}
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? "edit coupon" : "new coupon"}>
        <div className="space-y-3">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CODE" className="input uppercase" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as Form["discount_type"] })} className="input">
              <option value="percent">Percent</option>
              <option value="fixed">Fixed (₹)</option>
            </select>
            <input value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder="Value" type="number" className="input" />
          </div>
          <input value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} placeholder="Min order amount" type="number" className="input" />
          <input value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} placeholder="Max discount amount (optional)" type="number" className="input" />
          <input value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Usage limit (optional)" type="number" className="input" />
          <div>
            <label className="mb-1 block text-sm text-ink/70">Expires (optional)</label>
            <input value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} type="date" className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="pill-btn w-full">
            {save.isPending ? "saving…" : "save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
