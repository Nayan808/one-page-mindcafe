"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFeelzPreordersAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import type { FeelzPreorder } from "@/types/domain";

// Read-only, unlike business leads / expert applications — a preorder has
// no follow-up status to track, just a list of who to notify when the
// product's actually ready to ship.
export default function AdminFeelzPreordersPage() {
  const query = useQuery({ queryKey: ["admin", "feelz-preorders"], queryFn: () => getFeelzPreordersAdmin(createClient()) });
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter(
      (p) =>
        p.full_name.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.mobile?.toLowerCase().includes(term) ||
        p.product.toLowerCase().includes(term),
    );
  }, [query.data, search]);

  const columns: AdminColumn<FeelzPreorder>[] = [
    { key: "name", label: "name", render: (p) => <span className="font-medium text-ink">{p.full_name}</span> },
    { key: "product", label: "product", render: (p) => <span className="uppercase text-ink/70">{p.product}</span> },
    { key: "email", label: "email", render: (p) => (p.email ? <a href={`mailto:${p.email}`} className="text-ink underline">{p.email}</a> : <span className="text-ink/40">—</span>) },
    { key: "mobile", label: "mobile", render: (p) => <span className="text-ink/60">{p.mobile ?? "—"}</span> },
    { key: "city", label: "city", render: (p) => <span className="text-ink/60">{p.city ?? "—"}</span> },
    { key: "date", label: "received", render: (p) => <span className="text-ink/60">{new Date(p.created_at).toLocaleDateString()}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="feelz preorders" description={`${rows.length} of ${query.data?.length ?? 0} total`} />
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by name, email, mobile, or product…" />
      <AdminTable columns={columns} rows={rows} getRowId={(p) => p.id} isLoading={query.isLoading} emptyLabel="No preorders yet." />
    </div>
  );
}
