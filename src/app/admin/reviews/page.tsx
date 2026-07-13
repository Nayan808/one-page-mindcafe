"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAllReviewsAdmin, updateReviewAdmin, deleteReviewAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import type { Review } from "@/types/domain";

export default function AdminReviewsPage() {
  const confirmDialog = useConfirmDialog();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "reviews"], queryFn: () => getAllReviewsAdmin(createClient()) });
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter(
      (r) => r.reviewer_name.toLowerCase().includes(term) || r.city?.toLowerCase().includes(term) || r.comment?.toLowerCase().includes(term),
    );
  }, [query.data, search]);

  // Optimistic: the checkbox flips instantly instead of waiting on a
  // full-list refetch to come back first.
  const toggleCorporate = useMutation({
    mutationFn: (args: { id: string; is_corporate: boolean }) => updateReviewAdmin(createClient(), args.id, { is_corporate: args.is_corporate }),
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "reviews"] });
      const previous = queryClient.getQueryData<Review[]>(["admin", "reviews"]);
      queryClient.setQueryData<Review[]>(["admin", "reviews"], (old) =>
        old?.map((r) => (r.id === args.id ? { ...r, is_corporate: args.is_corporate } : r)),
      );
      return { previous };
    },
    onError: (_err, _args, context) => {
      if (context?.previous) queryClient.setQueryData(["admin", "reviews"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteReviewAdmin(createClient(), id),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to delete review"),
  });

  const columns: AdminColumn<Review>[] = [
    { key: "reviewer", label: "reviewer", render: (r) => <span className="font-medium text-ink">{r.reviewer_name}</span> },
    { key: "city", label: "city", render: (r) => <span className="text-ink/60">{r.city ?? "—"}</span> },
    {
      key: "rating",
      label: "rating",
      render: (r) => (
        <span className="flex gap-0.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3 w-3" fill={i < r.rating ? "currentColor" : "none"} aria-hidden />
          ))}
        </span>
      ),
    },
    { key: "comment", label: "comment", render: (r) => <span className="block max-w-xs truncate text-ink/60">{r.comment ?? "—"}</span> },
    {
      key: "corporate",
      label: "corporate",
      render: (r) => (
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={r.is_corporate} onChange={(e) => toggleCorporate.mutate({ id: r.id, is_corporate: e.target.checked })} />
          shows on /business
        </label>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="reviews" description={`${rows.length} of ${query.data?.length ?? 0} total`} />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by reviewer, city, or comment…" />
      <AdminTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        isLoading={query.isLoading}
        onDelete={async (r) => {
          if (await confirmDialog({ title: "delete review", message: `Delete this review from "${r.reviewer_name}"?`, danger: true })) {
            remove.mutate(r.id);
          }
        }}
        emptyLabel="No matching reviews."
      />
    </div>
  );
}
