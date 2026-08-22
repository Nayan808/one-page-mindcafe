"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getOrdersAdmin, getPickupLocationsAdmin, listUsersAdmin, updateOrderStatusAdmin, deleteOrderAdmin } from "@/lib/admin-api";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { FilterDropdown, type FilterOption } from "@/components/admin/FilterDropdown";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { formatDate, formatInr } from "@/lib/utils";
import type { OrderWithItemDetailsAndLocation } from "@/types/domain";

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

const PAYMENT_STATUSES = ["pending", "pending_cash", "paid", "refund_required", "refunded", "failed"];

const PAYMENT_STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "all payments" },
  ...PAYMENT_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
];

const FULFILLMENT_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "all types" },
  { value: "delivery", label: "delivery" },
  { value: "takeaway", label: "takeaway" },
];

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";
  const confirmDialog = useConfirmDialog();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [locationId, setLocationId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const ordersQueryKey = [
    "admin",
    "orders",
    page,
    status,
    locationId,
    paymentStatus,
    fulfillmentType,
    dateFrom,
    dateTo,
    debouncedSearch,
  ] as const;

  const ordersQuery = useQuery({
    queryKey: ordersQueryKey,
    queryFn: () =>
      getOrdersAdmin(createClient(), {
        page,
        pageSize: PAGE_SIZE,
        status: status || undefined,
        locationId: locationId || undefined,
        paymentStatus: paymentStatus || undefined,
        fulfillmentType: fulfillmentType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: debouncedSearch || undefined,
      }),
  });

  const locationsQuery = useQuery({
    queryKey: ["admin", "pickup-locations"],
    queryFn: () => getPickupLocationsAdmin(createClient()),
  });

  const locationFilterOptions: FilterOption[] = useMemo(
    () => [
      { value: "", label: "all locations" },
      { value: "online", label: "online (delivery)" },
      ...(locationsQuery.data ?? []).map((l) => ({ value: l.id, label: l.city ? `${l.name}, ${l.city}` : l.name })),
    ],
    [locationsQuery.data],
  );

  // Logged-in orders carry no email on the order row itself (only
  // guest_email, for guest checkout) — the account's email lives in
  // auth.users, so it's fetched once via the same admin-list-users lookup
  // the users page uses and matched onto each order by user_id.
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listUsersAdmin(createClient()),
  });
  const emailByUserId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const u of usersQuery.data ?? []) map.set(u.id, u.email);
    return map;
  }, [usersQuery.data]);

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
      updateOrderStatusAdmin(createClient(), args.id, args.status as OrderWithItemDetailsAndLocation["status"]),
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKey });
      const previous = queryClient.getQueryData<{ orders: OrderWithItemDetailsAndLocation[]; total: number }>(ordersQueryKey);
      queryClient.setQueryData<{ orders: OrderWithItemDetailsAndLocation[]; total: number }>(ordersQueryKey, (old) =>
        old && {
          ...old,
          orders: old.orders.map((o) => (o.id === args.id ? { ...o, status: args.status as OrderWithItemDetailsAndLocation["status"] } : o)),
        },
      );
      return { previous };
    },
    onError: (_err, _args, context) => {
      if (context?.previous) queryClient.setQueryData(ordersQueryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });

  // RLS (orders_super_admin_delete) enforces this server-side too — the
  // isSuperAdmin check here is just so a plain admin doesn't even see the
  // option, not the real security boundary.
  const remove = useMutation({
    mutationFn: (id: string) => deleteOrderAdmin(createClient(), id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });

  // Bulk versions of the same two single-row actions above — fire the
  // per-order calls in parallel, then invalidate once at the end rather
  // than once per row, so a 10-order bulk action doesn't refetch the page
  // 10 times in a row.
  const bulkMarkPickedUp = useMutation({
    mutationFn: (ids: string[]) => {
      const sb = createClient();
      return Promise.all(ids.map((id) => updateOrderStatusAdmin(sb, id, "picked_up")));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      setSelectedIds(new Set());
    },
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => {
      const sb = createClient();
      return Promise.all(ids.map((id) => deleteOrderAdmin(sb, id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      setSelectedIds(new Set());
    },
  });

  const orders = ordersQuery.data?.orders ?? [];
  const total = ordersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleRow(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((current) => (current.size === orders.length ? new Set() : new Set(orders.map((o) => o.id))));
  }

  const columns: AdminColumn<OrderWithItemDetailsAndLocation>[] = [
    { key: "order_number", label: "order", render: (o) => <span className="font-medium text-ink">{o.order_number}</span> },
    {
      key: "contact",
      label: "customer",
      render: (o) => {
        // Guest checkout (scan-and-order or site-direct) always collects a
        // phone number and optionally an email, both stored on the order
        // row. A logged-in order has neither — name/phone come from the
        // profile, email from the auth.users lookup above.
        const name = o.user_id ? o.profiles?.full_name : o.guest_name;
        const phone = o.user_id ? o.profiles?.phone : o.guest_phone;
        const email = o.user_id ? emailByUserId.get(o.user_id) : o.guest_email;
        if (!name && !phone && !email) return <span className="text-ink/30">—</span>;
        return (
          <div className="space-y-0.5 text-xs">
            {name && <p className="font-medium text-ink">{name}</p>}
            <p className="text-ink/60">{phone || email || "—"}</p>
          </div>
        );
      },
    },
    { key: "type", label: "fulfillment", render: (o) => <span className="capitalize">{o.fulfillment_type}</span> },
    {
      key: "items",
      label: "type / variant",
      render: (o) => (
        <div className="space-y-0.5">
          {o.order_items.map((item) => (
            <p key={item.id} className="whitespace-nowrap text-xs">
              {item.product_variants.products.name} · {item.product_variants.variant_label} × {item.quantity}
            </p>
          ))}
        </div>
      ),
    },
    {
      key: "location",
      label: "location",
      render: (o) =>
        o.pickup_locations ? (
          <span>
            {o.pickup_locations.name}
            {o.pickup_locations.city ? `, ${o.pickup_locations.city}` : ""}
          </span>
        ) : (
          <span className="text-ink/30">—</span>
        ),
    },
    {
      key: "city_pincode",
      label: "city / pincode",
      render: (o) => {
        if (o.fulfillment_type !== "delivery") return <span className="text-ink/30">—</span>;
        // Signed-in checkout carries city/pincode via the saved address row
        // (o.addresses); guest checkout has no address_id and instead
        // stores them directly on the order (guest_address_city/pincode).
        const city = o.addresses?.city ?? o.guest_address_city;
        const pincode = o.addresses?.pincode ?? o.guest_address_pincode;
        if (!city && !pincode) return <span className="text-ink/30">—</span>;
        return (
          <span className="text-xs">
            {city ?? "—"}
            {pincode ? ` · ${pincode}` : ""}
          </span>
        );
      },
    },
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
    {
      key: "tracking",
      label: "tracking",
      render: (o) =>
        o.fulfillment_type !== "delivery" ? (
          <span className="text-ink/30">—</span>
        ) : o.awb_code ? (
          <div>
            <p className="text-ink">{o.awb_code}</p>
            {o.tracking_url && (
              <a href={o.tracking_url} target="_blank" rel="noreferrer" className="text-ink/60 underline">
                track
              </a>
            )}
          </div>
        ) : o.shiprocket_order_id ? (
          <span className="text-amber-600">shipment created, no AWB yet</span>
        ) : (
          <span className="text-ink/40">not shipped</span>
        ),
    },
    { key: "date", label: "placed", render: (o) => <span className="text-ink/60">{formatDate(o.created_at)}</span> },
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
        <FilterDropdown
          options={locationFilterOptions}
          value={locationId}
          onChange={(v) => {
            setLocationId(v);
            setPage(0);
          }}
          searchPlaceholder="Search locations…"
        />
        <FilterDropdown
          options={PAYMENT_STATUS_FILTER_OPTIONS}
          value={paymentStatus}
          onChange={(v) => {
            setPaymentStatus(v);
            setPage(0);
          }}
          searchPlaceholder="Search payment status…"
        />
        <FilterDropdown
          options={FULFILLMENT_FILTER_OPTIONS}
          value={fulfillmentType}
          onChange={(v) => {
            setFulfillmentType(v);
            setPage(0);
          }}
          searchPlaceholder="Search type…"
        />
        <div className="flex items-center gap-1.5 text-xs">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            max={dateTo || undefined}
            className="input !w-auto !py-1.5 text-xs"
            aria-label="From date"
          />
          <span className="text-ink/40">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
            min={dateFrom || undefined}
            className="input !w-auto !py-1.5 text-xs"
            aria-label="To date"
          />
        </div>
        {(status || locationId || paymentStatus || fulfillmentType || dateFrom || dateTo || search) && (
          <button
            type="button"
            onClick={() => {
              setStatus("");
              setLocationId("");
              setPaymentStatus("");
              setFulfillmentType("");
              setDateFrom("");
              setDateTo("");
              setSearch("");
              setPage(0);
            }}
            className="text-xs text-ink/50 underline hover:text-ink"
          >
            clear filters
          </button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-ink/15 bg-cream/60 px-4 py-2.5 text-sm">
          <span className="font-medium text-ink">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={() => bulkMarkPickedUp.mutate(Array.from(selectedIds))}
            disabled={bulkMarkPickedUp.isPending}
            className="pill-btn-outline !py-1.5 text-xs disabled:opacity-40"
          >
            {bulkMarkPickedUp.isPending ? "updating…" : "mark picked up"}
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={async () => {
                if (
                  await confirmDialog({
                    title: "delete orders",
                    message: `Delete ${selectedIds.size} selected order${selectedIds.size === 1 ? "" : "s"} permanently? This can't be undone.`,
                    danger: true,
                  })
                ) {
                  bulkDelete.mutate(Array.from(selectedIds));
                }
              }}
              disabled={bulkDelete.isPending}
              className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-40"
            >
              {bulkDelete.isPending ? "deleting…" : "delete selected"}
            </button>
          )}
          <button type="button" onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-ink/50 hover:text-ink">
            clear
          </button>
        </div>
      )}

      <AdminTable
        columns={columns}
        rows={orders}
        getRowId={(o) => o.id}
        isLoading={ordersQuery.isLoading}
        emptyLabel="No orders."
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        onDelete={
          isSuperAdmin
            ? async (o) => {
                if (
                  await confirmDialog({
                    title: "delete order",
                    message: `Delete order "${o.order_number}" permanently? This can't be undone.`,
                    danger: true,
                  })
                ) {
                  remove.mutate(o.id);
                }
              }
            : undefined
        }
      />

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
