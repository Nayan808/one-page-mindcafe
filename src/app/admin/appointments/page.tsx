"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getAppointmentsAdmin, updateAppointmentAdmin, getAllExpertsAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { FilterDropdown, type FilterOption } from "@/components/admin/FilterDropdown";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { AppointmentWithExpert } from "@/types/domain";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const PAGE_SIZE = 20;

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "all statuses" },
  ...STATUSES.map((s) => ({ value: s, label: s })),
];

export default function AdminAppointmentsPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();

  const appointmentsQueryKey = ["admin", "appointments", page, status, debouncedSearch] as const;

  const appointmentsQuery = useQuery({
    queryKey: appointmentsQueryKey,
    queryFn: () => getAppointmentsAdmin(createClient(), { page, pageSize: PAGE_SIZE, status: status || undefined, search: debouncedSearch || undefined }),
  });

  const expertsQuery = useQuery({
    queryKey: ["admin", "experts", "all"],
    queryFn: () => getAllExpertsAdmin(createClient()),
  });

  // Optimistic: the status/expert selects flip instantly instead of
  // waiting on a full 20-row page refetch to come back first.
  const update = useMutation({
    mutationFn: (args: { id: string; input: Parameters<typeof updateAppointmentAdmin>[2] }) =>
      updateAppointmentAdmin(createClient(), args.id, args.input),
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: appointmentsQueryKey });
      const previous = queryClient.getQueryData<{ appointments: AppointmentWithExpert[]; total: number }>(appointmentsQueryKey);
      queryClient.setQueryData<{ appointments: AppointmentWithExpert[]; total: number }>(appointmentsQueryKey, (old) =>
        old && {
          ...old,
          appointments: old.appointments.map((a) => (a.id === args.id ? { ...a, ...args.input } : a)),
        },
      );
      return { previous };
    },
    onError: (_err, _args, context) => {
      if (context?.previous) queryClient.setQueryData(appointmentsQueryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] }),
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AdminSearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Search by notes or category…"
          wrapperClassName="max-w-sm flex-1"
        />
        <FilterDropdown
          options={STATUS_FILTER_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          searchPlaceholder="Search statuses…"
        />
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
