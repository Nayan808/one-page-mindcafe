"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFaqs } from "@/lib/api";
import { createFaqAdmin, updateFaqAdmin, deleteFaqAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { Modal } from "@/components/Modal";
import type { Faq } from "@/types/domain";

type Form = { category: string; question: string; answer: string; sort_order: string };
const EMPTY: Form = { category: "feelz", question: "", answer: "", sort_order: "0" };

export default function AdminFaqsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "faqs"], queryFn: () => getFaqs(createClient()) });
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [isOpen, setIsOpen] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });

  const save = useMutation({
    mutationFn: async () => {
      const input = { category: form.category, question: form.question, answer: form.answer, sort_order: Number(form.sort_order || 0) };
      const sb = createClient();
      if (editing) return updateFaqAdmin(sb, editing.id, input);
      return createFaqAdmin(sb, input);
    },
    onSuccess: () => {
      invalidate();
      setIsOpen(false);
    },
  });
  const remove = useMutation({ mutationFn: (id: string) => deleteFaqAdmin(createClient(), id), onSuccess: invalidate });

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setIsOpen(true);
  }
  function openEdit(faq: Faq) {
    setEditing(faq);
    setForm({ category: faq.category, question: faq.question, answer: faq.answer, sort_order: String(faq.sort_order) });
    setIsOpen(true);
  }

  const columns: AdminColumn<Faq>[] = [
    { key: "category", label: "category", render: (f) => <span className="capitalize">{f.category}</span> },
    { key: "question", label: "question", render: (f) => <span className="font-medium text-ink">{f.question}</span> },
    { key: "order", label: "order", render: (f) => <span className="text-ink/60">{f.sort_order}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="faqs" action={<button type="button" onClick={openNew} className="pill-btn !py-2 text-xs">+ new faq</button>} />
      <AdminTable
        columns={columns}
        rows={query.data ?? []}
        getRowId={(f) => f.id}
        isLoading={query.isLoading}
        onEdit={openEdit}
        onDelete={(f) => confirm(`Delete "${f.question}"?`) && remove.mutate(f.id)}
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? "edit faq" : "new faq"}>
        <div className="space-y-3">
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category (e.g. feelz, counselling)" className="input" />
          <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Question" className="input" />
          <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Answer" rows={4} className="input" />
          <input value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} placeholder="Sort order" type="number" className="input" />
          <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="pill-btn w-full">
            {save.isPending ? "saving…" : "save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
