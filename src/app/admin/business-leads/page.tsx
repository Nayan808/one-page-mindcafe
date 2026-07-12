"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getBusinessLeadsAdmin, updateBusinessLeadAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import type { BusinessLead } from "@/types/domain";

const STATUSES: BusinessLead["status"][] = ["new", "contacted", "closed"];

export default function AdminBusinessLeadsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "business-leads"], queryFn: () => getBusinessLeadsAdmin(createClient()) });

  const update = useMutation({
    mutationFn: (args: { id: string; status: BusinessLead["status"] }) => updateBusinessLeadAdmin(createClient(), args.id, args.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "business-leads"] }),
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
      <AdminPageHeader title="business leads" description={`${query.data?.length ?? 0} total`} />
      <AdminTable columns={columns} rows={query.data ?? []} getRowId={(l) => l.id} isLoading={query.isLoading} emptyLabel="No leads yet." />
    </div>
  );
}
