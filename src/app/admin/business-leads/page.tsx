"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getBusinessLeadsAdmin, updateBusinessLeadAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import type { BusinessLead } from "@/types/domain";

const STATUSES: BusinessLead["status"][] = ["new", "contacted", "closed"];

export default function AdminBusinessLeadsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "business-leads"], queryFn: () => getBusinessLeadsAdmin(createClient()) });
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter(
      (l) =>
        l.company_name.toLowerCase().includes(term) ||
        l.contact_name.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        l.phone?.toLowerCase().includes(term),
    );
  }, [query.data, search]);

  // Optimistic: the status select flips instantly instead of waiting on a
  // full-list refetch to come back first.
  const update = useMutation({
    mutationFn: (args: { id: string; status: BusinessLead["status"] }) => updateBusinessLeadAdmin(createClient(), args.id, args.status),
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "business-leads"] });
      const previous = queryClient.getQueryData<BusinessLead[]>(["admin", "business-leads"]);
      queryClient.setQueryData<BusinessLead[]>(["admin", "business-leads"], (old) =>
        old?.map((l) => (l.id === args.id ? { ...l, status: args.status } : l)),
      );
      return { previous };
    },
    onError: (_err, _args, context) => {
      if (context?.previous) queryClient.setQueryData(["admin", "business-leads"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "business-leads"] }),
  });

  const columns: AdminColumn<BusinessLead>[] = [
    { key: "company", label: "company", render: (l) => <span className="font-medium text-ink">{l.company_name}</span> },
    { key: "contact", label: "contact", render: (l) => <span>{l.contact_name}</span> },
    { key: "email", label: "email", render: (l) => <a href={`mailto:${l.email}`} className="text-ink underline">{l.email}</a> },
    { key: "phone", label: "phone", render: (l) => <span className="text-ink/60">{l.phone ?? "—"}</span> },
    { key: "message", label: "message", render: (l) => <span className="block max-w-xs truncate text-ink/60" title={l.message ?? ""}>{l.message ?? "—"}</span> },
    {
      key: "status",
      label: "status",
      render: (l) => (
        <select value={l.status} onChange={(e) => update.mutate({ id: l.id, status: e.target.value as BusinessLead["status"] })} className="input !w-auto !py-1.5 text-xs">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    { key: "date", label: "received", render: (l) => <span className="text-ink/60">{new Date(l.created_at).toLocaleDateString()}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="business leads" description={`${rows.length} of ${query.data?.length ?? 0} total`} />
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by company, contact, email, or phone…" />
      <AdminTable columns={columns} rows={rows} getRowId={(l) => l.id} isLoading={query.isLoading} emptyLabel="No matching leads." />
    </div>
  );
}
