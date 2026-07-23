"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getOrdersAdmin, updateOrderStatusAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { FilterDropdown, type FilterOption } from "@/components/admin/FilterDropdown";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { formatInr } from "@/lib/utils";
import type { OrderWithItems } from "@/types/domain";

const STATUSES = [
  "placed",
  "confirmed",
  "packed",
  "ready_for_pickup",
  "picked_up",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "all statuses" },
  ...STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
];

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();

  const ordersQueryKey = ["admin", "orders", page, status, debouncedSearch] as const;

  const ordersQuery = useQuery({
    queryKey: ordersQueryKey,
    queryFn: () => getOrdersAdmin(createClient(), { page, pageSize: PAGE_SIZE, status: status || undefined, search: debouncedSearch || undefined }),
  });

  // Live: new orders / status changes show up without a manual refresh —
  // broad invalidate, same rationale as the admin appointments page.
  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () =>
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [queryClient]);

  // Optimistic: the status select flips instantly instead of waiting on a
  // full 20-row page refetch to come back before the UI shows the change.
  const updateStatus = useMutation({
    mutationFn: (args: { id: string; status: string }) =>
      updateOrderStatusAdmin(createClient(), args.id, args.status as OrderWithItems["status"]),
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKey });
      const previous = queryClient.getQueryData<{ orders: OrderWithItems[]; total: number }>(ordersQueryKey);
      queryClient.setQueryData<{ orders: OrderWithItems[]; total: number }>(ordersQueryKey, (old) =>
        old && {
          ...old,
          orders: old.orders.map((o) => (o.id === args.id ? { ...o, status: args.status as OrderWithItems["status"] } : o)),
        },
      );
      return { previous };
    },
    onError: (_err, _args, context) => {
      if (context?.previous) queryClient.setQueryData(ordersQueryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });

  const orders = ordersQuery.data?.orders ?? [];
  const total = ordersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: AdminColumn<OrderWithItems>[] = [
    { key: "order_number", label: "order", render: (o) => <span className="font-medium text-ink">{o.order_number}</span> },
    { key: "type", label: "fulfillment", render: (o) => <span className="capitalize">{o.fulfillment_type}</span> },
    { key: "items", label: "items", render: (o) => <span>{o.order_items.length}</span> },
    { key: "total", label: "total", render: (o) => <span>{formatInr(o.total)}</span> },
    { key: "payment", label: "payment", render: (o) => <span className="capitalize">{o.payment_status}</span> },
    {
      key: "status",
      label: "status",
      render: (o) => (
        <select
          value={o.status}
          onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value })}
          className="input !w-auto !py-1.5 text-xs"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      ),
    },
    { key: "date", label: "placed", render: (o) => <span className="text-ink/60">{new Date(o.created_at).toLocaleDateString()}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="orders" description={`${total} total`} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AdminSearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Search by order number, name, or phone…"
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

      <AdminTable columns={columns} rows={orders} getRowId={(o) => o.id} isLoading={ordersQuery.isLoading} emptyLabel="No orders." />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-xs">
          <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="pill-btn-outline !py-1.5 disabled:opacity-40">
            previous
          </button>
          <span className="text-ink/50">
            page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="pill-btn-outline !py-1.5 disabled:opacity-40"
          >
            next
          </button>
        </div>
      )}
    </div>
  );
}
