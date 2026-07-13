"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listUsersAdmin, updateUserRoleAdmin, type AdminUserRow } from "@/lib/admin-api";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";

const ROLES = ["customer", "expert", "employer", "admin", "super_admin"];

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "users"], queryFn: () => listUsersAdmin(createClient()) });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter(
      (u) => u.email?.toLowerCase().includes(term) || u.full_name?.toLowerCase().includes(term) || u.role.includes(term),
    );
  }, [query.data, search]);

  // Optimistic: flips the dropdown instantly instead of waiting on
  // listUsersAdmin's full admin-list-users Edge Function round trip to
  // resolve before the UI reflects the change. Rolled back on failure
  // (e.g. a plain admin somehow reaching this control), reconciled with
  // the server in the background either way.
  const updateRole = useMutation({
    mutationFn: (args: { id: string; role: string }) =>
      updateUserRoleAdmin(createClient(), args.id, args.role as AdminUserRow["role"]),
    onMutate: async (args) => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ["admin", "users"] });
      const previous = queryClient.getQueryData<AdminUserRow[]>(["admin", "users"]);
      queryClient.setQueryData<AdminUserRow[]>(["admin", "users"], (old) =>
        old?.map((u) => (u.id === args.id ? { ...u, role: args.role as AdminUserRow["role"] } : u)),
      );
      return { previous };
    },
    onError: (err, _args, context) => {
      if (context?.previous) queryClient.setQueryData(["admin", "users"], context.previous);
      setError(err instanceof Error ? err.message : "Role change failed");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const columns: AdminColumn<AdminUserRow>[] = [
    { key: "email", label: "email", render: (u) => <span className="font-medium text-ink">{u.email ?? "—"}</span> },
    { key: "name", label: "name", render: (u) => <span className="text-ink/60">{u.full_name ?? "—"}</span> },
    { key: "created", label: "joined", render: (u) => <span className="text-ink/60">{new Date(u.created_at).toLocaleDateString()}</span> },
    {
      key: "role",
      label: "role",
      render: (u) => (
        <select
          value={u.role}
          disabled={!isSuperAdmin}
          onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
          className="input !w-auto !py-1.5 text-xs disabled:opacity-60"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="users & roles" description={`${rows.length} of ${query.data?.length ?? 0} accounts`} />

      {!isSuperAdmin && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          Role changes are super_admin-only — you can see everyone&apos;s role here but the dropdown is disabled for
          your account. See AUTH_AND_ROLES.md for why.
        </p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by email, name, or role…" />
      <AdminTable columns={columns} rows={rows} getRowId={(u) => u.id} isLoading={query.isLoading} emptyLabel="No matching users." />
    </div>
  );
}
