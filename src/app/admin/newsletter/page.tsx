"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getNewsletterSubscribersAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import type { NewsletterSubscriber } from "@/types/domain";

export default function AdminNewsletterPage() {
  const query = useQuery({ queryKey: ["admin", "newsletter"], queryFn: () => getNewsletterSubscribersAdmin(createClient()) });
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter((s) => s.email.toLowerCase().includes(term));
  }, [query.data, search]);

  const columns: AdminColumn<NewsletterSubscriber>[] = [
    { key: "email", label: "email", render: (s) => <span className="font-medium text-ink">{s.email}</span> },
    { key: "confirmed", label: "confirmed", render: (s) => <span>{s.confirmed ? "yes" : "no"}</span> },
    { key: "date", label: "subscribed", render: (s) => <span className="text-ink/60">{new Date(s.subscribed_at).toLocaleDateString()}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="newsletter subscribers" description={`${rows.length} of ${query.data?.length ?? 0} total`} />
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by email…" />
      <AdminTable columns={columns} rows={rows} getRowId={(s) => s.id} isLoading={query.isLoading} emptyLabel="No matching subscribers." />
    </div>
  );
}
