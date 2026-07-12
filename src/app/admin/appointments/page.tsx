"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getAppointmentsAdmin, updateAppointmentAdmin, getAllExpertsAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import type { AppointmentWithExpert } from "@/types/domain";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const PAGE_SIZE = 20;

export default function AdminAppointmentsPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const queryClient = useQueryClient();

  const appointmentsQuery = useQuery({
    queryKey: ["admin", "appointments", page, status],
    queryFn: () => getAppointmentsAdmin(createClient(), { page, pageSize: PAGE_SIZE, status: status || undefined }),
  });

  const expertsQuery = useQuery({
    queryKey: ["admin", "experts", "all"],
    queryFn: () => getAllExpertsAdmin(createClient()),
  });

  const update = useMutation({
    mutationFn: (args: { id: string; input: Parameters<typeof updateAppointmentAdmin>[2] }) =>
      updateAppointmentAdmin(createClient(), args.id, args.input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] }),
  });

  const appointments = appointmentsQuery.data?.appointments ?? [];
  const total = appointmentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const experts = expertsQuery.data ?? [];

  const columns: AdminColumn<AppointmentWithExpert>[] = [
    { key: "category", label: "category", render: (a) => <span className="capitalize">{a.therapy_category.replace(/-/g, " ")}</span> },
    {
      key: "expert",
      label: "expert",
      render: (a) => (
        <select
          value={a.expert_id ?? ""}
          onChange={(e) => update.mutate({ id: a.id, input: { expert_id: e.target.value || null } })}
          className="input !w-auto !py-1.5 text-xs"
        >
          <option value="">Unassigned</option>
          {experts.map((expert) => (
            <option key={expert.id} value={expert.id}>
              {expert.name}
            </option>
          ))}
        </select>
      ),
    },
    { key: "when", label: "requested time", render: (a) => <span className="text-ink/60">{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : "—"}</span> },
    { key: "notes", label: "notes", render: (a) => <span className="text-ink/60">{a.notes ?? "—"}</span> },
    {
      key: "status",
      label: "status",
      render: (a) => (
        <select
          value={a.status}
          onChange={(e) => update.mutate({ id: a.id, input: { status: e.target.value as AppointmentWithExpert["status"] } })}
          className="input !w-auto !py-1.5 text-xs"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="appointments" description={`${total} total`} />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setStatus("");
            setPage(0);
          }}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!status ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/60"}`}
        >
          all
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatus(s);
              setPage(0);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${status === s ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/60"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <AdminTable columns={columns} rows={appointments} getRowId={(a) => a.id} isLoading={appointmentsQuery.isLoading} emptyLabel="No appointments." />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-xs">
          <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="pill-btn-outline !py-1.5 disabled:opacity-40">
            previous
          </button>
          <span className="text-ink/50">
            page {page + 1} of {totalPages}
          </span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="pill-btn-outline !py-1.5 disabled:opacity-40">
            next
          </button>
        </div>
      )}
    </div>
  );
}
