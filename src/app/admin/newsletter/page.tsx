"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getNewsletterSubscribersAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import type { NewsletterSubscriber } from "@/types/domain";

export default function AdminNewsletterPage() {
  const query = useQuery({ queryKey: ["admin", "newsletter"], queryFn: () => getNewsletterSubscribersAdmin(createClient()) });

  const columns: AdminColumn<NewsletterSubscriber>[] = [
    { key: "email", label: "email", render: (s) => <span className="font-medium text-ink">{s.email}</span> },
    { key: "confirmed", label: "confirmed", render: (s) => <span>{s.confirmed ? "yes" : "no"}</span> },
    { key: "date", label: "subscribed", render: (s) => <span className="text-ink/60">{new Date(s.subscribed_at).toLocaleDateString()}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="newsletter subscribers" description={`${query.data?.length ?? 0} total`} />
      <AdminTable columns={columns} rows={query.data ?? []} getRowId={(s) => s.id} isLoading={query.isLoading} emptyLabel="No subscribers yet." />
    </div>
  );
}
