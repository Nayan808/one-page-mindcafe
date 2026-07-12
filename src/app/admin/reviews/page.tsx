"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAllReviewsAdmin, updateReviewAdmin, deleteReviewAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import type { Review } from "@/types/domain";

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "reviews"], queryFn: () => getAllReviewsAdmin(createClient()) });

  const toggleCorporate = useMutation({
    mutationFn: (args: { id: string; is_corporate: boolean }) => updateReviewAdmin(createClient(), args.id, { is_corporate: args.is_corporate }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteReviewAdmin(createClient(), id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] }),
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
      <AdminPageHeader title="reviews" description={`${query.data?.length ?? 0} total`} />
      <AdminTable
        columns={columns}
        rows={query.data ?? []}
        getRowId={(r) => r.id}
        isLoading={query.isLoading}
        onDelete={(r) => confirm(`Delete this review from ${r.reviewer_name}?`) && remove.mutate(r.id)}
        emptyLabel="No reviews yet."
      />
    </div>
  );
}
