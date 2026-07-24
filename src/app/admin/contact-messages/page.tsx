"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getContactMessagesAdmin, updateContactMessageAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import type { ContactMessage } from "@/types/domain";

const STATUSES: ContactMessage["status"][] = ["new", "contacted", "closed"];

export default function AdminContactMessagesPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "contact-messages"], queryFn: () => getContactMessagesAdmin(createClient()) });
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.phone?.toLowerCase().includes(term) ||
        m.message?.toLowerCase().includes(term),
    );
  }, [query.data, search]);

  // Optimistic: the status select flips instantly instead of waiting on a
  // full-list refetch to come back first.
  const update = useMutation({
    mutationFn: (args: { id: string; status: ContactMessage["status"] }) => updateContactMessageAdmin(createClient(), args.id, args.status),
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "contact-messages"] });
      const previous = queryClient.getQueryData<ContactMessage[]>(["admin", "contact-messages"]);
      queryClient.setQueryData<ContactMessage[]>(["admin", "contact-messages"], (old) =>
        old?.map((m) => (m.id === args.id ? { ...m, status: args.status } : m)),
      );
      return { previous };
    },
    onError: (_err, _args, context) => {
      if (context?.previous) queryClient.setQueryData(["admin", "contact-messages"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "contact-messages"] }),
  });

  const columns: AdminColumn<ContactMessage>[] = [
    { key: "name", label: "name", render: (m) => <span className="font-medium text-ink">{m.name}</span> },
    { key: "email", label: "email", render: (m) => <a href={`mailto:${m.email}`} className="text-ink underline">{m.email}</a> },
    { key: "phone", label: "phone", render: (m) => <span className="text-ink/60">{m.phone ?? "—"}</span> },
    { key: "message", label: "message", render: (m) => <span className="block max-w-sm truncate text-ink/60" title={m.message ?? ""}>{m.message ?? "—"}</span> },
    {
      key: "status",
      label: "status",
      render: (m) => (
        <select value={m.status} onChange={(e) => update.mutate({ id: m.id, status: e.target.value as ContactMessage["status"] })} className="input !w-auto !py-1.5 text-xs">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    { key: "date", label: "received", render: (m) => <span className="text-ink/60">{new Date(m.created_at).toLocaleDateString()}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="contact messages" description={`${rows.length} of ${query.data?.length ?? 0} total`} />
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by name, email, phone, or message…" />
      <AdminTable columns={columns} rows={rows} getRowId={(m) => m.id} isLoading={query.isLoading} emptyLabel="No matching messages." />
    </div>
  );
}
