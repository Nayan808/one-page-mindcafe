"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getMilestones } from "@/lib/api";
import { createMilestoneAdmin, updateMilestoneAdmin, deleteMilestoneAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { Modal } from "@/components/Modal";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import type { Milestone } from "@/types/domain";

type Form = { year: string; title: string; description: string; sort_order: string };
const EMPTY: Form = { year: "", title: "", description: "", sort_order: "0" };

export default function AdminMilestonesPage() {
  const confirmDialog = useConfirmDialog();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "milestones"], queryFn: () => getMilestones(createClient()) });
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "milestones"] });

  const save = useMutation({
    mutationFn: async () => {
      const input = { year: form.year, title: form.title, description: form.description || null, sort_order: Number(form.sort_order || 0) };
      const sb = createClient();
      if (editing) return updateMilestoneAdmin(sb, editing.id, input);
      return createMilestoneAdmin(sb, input);
    },
    onSuccess: () => {
      setError(null);
      invalidate();
      setIsOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to save milestone"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteMilestoneAdmin(createClient(), id),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to delete milestone"),
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setIsOpen(true);
  }
  function openEdit(m: Milestone) {
    setEditing(m);
    setForm({ year: m.year, title: m.title, description: m.description ?? "", sort_order: String(m.sort_order) });
    setError(null);
    setIsOpen(true);
  }

  const columns: AdminColumn<Milestone>[] = [
    { key: "year", label: "year", render: (m) => <span className="font-medium text-ink">{m.year}</span> },
    { key: "title", label: "title", render: (m) => <span>{m.title}</span> },
    { key: "description", label: "description", render: (m) => <span className="text-ink/60">{m.description ?? "—"}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="milestones" description="Shown on /about." action={<button type="button" onClick={openNew} className="pill-btn !py-2 text-xs">+ new milestone</button>} />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <AdminTable
        columns={columns}
        rows={query.data ?? []}
        getRowId={(m) => m.id}
        isLoading={query.isLoading}
        onEdit={openEdit}
        onDelete={async (m) => {
          if (await confirmDialog({ title: "delete milestone", message: `Delete "${m.title}"?`, danger: true })) {
            remove.mutate(m.id);
          }
        }}
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? "edit milestone" : "new milestone"}>
        <div className="space-y-3">
          <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="Year" className="input" />
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="input" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" rows={2} className="input" />
          <input value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} placeholder="Sort order" type="number" className="input" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="pill-btn w-full">
            {save.isPending ? "saving…" : "save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
