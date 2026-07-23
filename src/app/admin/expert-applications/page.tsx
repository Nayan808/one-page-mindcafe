"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getExpertApplicationsAdmin, updateExpertApplicationAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import type { ExpertApplication } from "@/types/domain";

const STATUSES: ExpertApplication["status"][] = ["new", "contacted", "closed"];

export default function AdminExpertApplicationsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "expert-applications"], queryFn: () => getExpertApplicationsAdmin(createClient()) });
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.email?.toLowerCase().includes(term) ||
        a.phone?.toLowerCase().includes(term) ||
        a.city?.toLowerCase().includes(term),
    );
  }, [query.data, search]);

  const update = useMutation({
    mutationFn: (args: { id: string; status: ExpertApplication["status"] }) => updateExpertApplicationAdmin(createClient(), args.id, args.status),
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "expert-applications"] });
      const previous = queryClient.getQueryData<ExpertApplication[]>(["admin", "expert-applications"]);
      queryClient.setQueryData<ExpertApplication[]>(["admin", "expert-applications"], (old) =>
        old?.map((a) => (a.id === args.id ? { ...a, status: args.status } : a)),
      );
      return { previous };
    },
    onError: (_err, _args, context) => {
      if (context?.previous) queryClient.setQueryData(["admin", "expert-applications"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "expert-applications"] }),
  });

  const columns: AdminColumn<ExpertApplication>[] = [
    { key: "name", label: "name", render: (a) => <span className="font-medium text-ink">{a.name}</span> },
    { key: "email", label: "email", render: (a) => (a.email ? <a href={`mailto:${a.email}`} className="text-ink underline">{a.email}</a> : <span className="text-ink/40">—</span>) },
    { key: "phone", label: "phone", render: (a) => <span className="text-ink/60">{a.phone ?? "—"}</span> },
    { key: "city", label: "city", render: (a) => <span className="text-ink/60">{a.city ?? "—"}</span> },
    { key: "qualification", label: "qualification", render: (a) => <span className="block max-w-xs truncate text-ink/60" title={a.qualification ?? ""}>{a.qualification ?? "—"}</span> },
    { key: "skills", label: "skills", render: (a) => <span className="block max-w-xs truncate text-ink/60" title={a.skills ?? ""}>{a.skills ?? "—"}</span> },
    {
      key: "status",
      label: "status",
      render: (a) => (
        <select value={a.status} onChange={(e) => update.mutate({ id: a.id, status: e.target.value as ExpertApplication["status"] })} className="input !w-auto !py-1.5 text-xs">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    { key: "date", label: "received", render: (a) => <span className="text-ink/60">{new Date(a.created_at).toLocaleDateString()}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="expert applications" description={`${rows.length} of ${query.data?.length ?? 0} total — people who applied to join as an expert`} />
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by name, email, phone, or city…" />
      <AdminTable columns={columns} rows={rows} getRowId={(a) => a.id} isLoading={query.isLoading} emptyLabel="No applications yet." />
    </div>
  );
}
