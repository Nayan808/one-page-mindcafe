"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  addMissingInventoryRowsAdmin,
  createInventoryTransactionAdmin,
  deleteInventoryTransactionAdmin,
  getInventoryAdmin,
  getInventorySummaryAdmin,
  getInventoryTransactionsAdmin,
  getPickupLocationsAdmin,
  getProductsAdmin,
  getRealOnlineSalesByVariantAdmin,
  updateInventoryQuantityAdmin,
  updateVariantAdmin,
  type VariantInventorySummary,
} from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterDropdown, type FilterOption } from "@/components/admin/FilterDropdown";
import { formatInr } from "@/lib/utils";
import type { InventoryWithVariant, ProductWithVariants } from "@/types/domain";

const TRANSACTION_TYPE_LABELS: Record<"received" | "shipped" | "online_sale", string> = {
  received: "Received",
  shipped: "Shipped",
  online_sale: "Online sale (logged)",
};

function toLocalDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Manual reconciliation ledger — the client's "Transaction Log" sheet
// (Received / Shipped / Online Sale, quantity in/out, notes), built as a
// real feature rather than fabricated numbers. Deliberately not wired to
// inventory.quantity_available (see the migration's comment): this is an
// audit trail for comparing against real numbers, not a second source of
// truth for what checkout reserves against.
function TransactionLogSection({ products }: { products: ProductWithVariants[] }) {
  const queryClient = useQueryClient();
  const transactionsQuery = useQuery({
    queryKey: ["admin", "inventory-transactions"],
    queryFn: () => getInventoryTransactionsAdmin(createClient()),
  });
  const realSalesQuery = useQuery({
    queryKey: ["admin", "real-online-sales"],
    queryFn: () => getRealOnlineSalesByVariantAdmin(createClient()),
  });

  const variantOptions = useMemo(
    () =>
      products.flatMap((product) =>
        product.product_variants.map((variant) => ({
          id: variant.id,
          label: product.product_variants.length > 1 ? `${product.name} — ${variant.variant_label}` : product.name,
        })),
      ),
    [products],
  );

  const [date, setDate] = useState(() => toLocalDateInputValue(new Date()));
  const [type, setType] = useState<"received" | "shipped" | "online_sale">("received");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory-transactions"] });
  };

  const createTransaction = useMutation({
    mutationFn: () =>
      createInventoryTransactionAdmin(createClient(), {
        transactionDate: date,
        transactionType: type,
        variantId,
        quantity: Number(quantity),
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      setFormError(null);
      setQuantity("");
      setNotes("");
      invalidate();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Failed to add transaction"),
  });

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => deleteInventoryTransactionAdmin(createClient(), id),
    onSuccess: invalidate,
  });

  // Per-variant ledger totals, computed client-side from the (small) full
  // transaction list — same reasoning as getInventorySummaryAdmin.
  const reconciliation = useMemo(() => {
    const byVariant = new Map<
      string,
      { name: string; received: number; shipped: number; loggedOnlineSale: number }
    >();
    for (const t of transactionsQuery.data ?? []) {
      const key = t.variant_id;
      const existing = byVariant.get(key) ?? {
        name: t.product_variants.products.name,
        received: 0,
        shipped: 0,
        loggedOnlineSale: 0,
      };
      if (t.transaction_type === "received") existing.received += t.quantity_in ?? 0;
      else if (t.transaction_type === "shipped") existing.shipped += t.quantity_out ?? 0;
      else existing.loggedOnlineSale += t.quantity_out ?? 0;
      byVariant.set(key, existing);
    }
    return [...byVariant.entries()]
      .map(([variantId, totals]) => ({
        variantId,
        ...totals,
        realOnlineSale: realSalesQuery.data?.get(variantId) ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [transactionsQuery.data, realSalesQuery.data]);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="border-b border-ink/10 bg-cream/60 px-4 py-3">
        <p className="text-sm font-semibold text-ink">Transaction log</p>
        <p className="mt-0.5 text-xs text-ink/50">
          A manual ledger for reconciling manufacturer receipts and Zostel shipments — separate from live stock
          above. &ldquo;Online sale (real)&rdquo; is computed straight from paid orders, not typed in, so any
          mismatch against your logged figure is a genuine variance.
        </p>
      </div>

      {reconciliation.length > 0 && (
        <div className="overflow-x-auto border-b border-ink/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-[11px] uppercase tracking-label text-ink/50">
                <th className="px-4 py-2.5">variant</th>
                <th className="px-4 py-2.5">received</th>
                <th className="px-4 py-2.5">shipped</th>
                <th className="px-4 py-2.5">online sale (logged)</th>
                <th className="px-4 py-2.5">online sale (real)</th>
                <th className="px-4 py-2.5">variance</th>
              </tr>
            </thead>
            <tbody>
              {reconciliation.map((r) => {
                const variance = r.loggedOnlineSale - r.realOnlineSale;
                return (
                  <tr key={r.variantId} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-ink">{r.name}</td>
                    <td className="px-4 py-2.5 text-ink/70">{r.received}</td>
                    <td className="px-4 py-2.5 text-ink/70">{r.shipped}</td>
                    <td className="px-4 py-2.5 text-ink/70">{r.loggedOnlineSale}</td>
                    <td className="px-4 py-2.5 text-ink/70">{r.realOnlineSale}</td>
                    <td className={`px-4 py-2.5 font-medium ${variance === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                      {variance > 0 ? `+${variance}` : variance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-b border-ink/10 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-label text-ink/50">add transaction</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input">
            <option value="received">Received</option>
            <option value="shipped">Shipped</option>
            <option value="online_sale">Online sale</option>
          </select>
          <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="input">
            <option value="">Select variant…</option>
            {variantOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reference / notes (optional)"
            className="input"
          />
        </div>
        {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}
        <button
          type="button"
          onClick={() => createTransaction.mutate()}
          disabled={!date || !variantId || !quantity || Number(quantity) <= 0 || createTransaction.isPending}
          className="pill-btn mt-3 !py-1.5 text-xs disabled:opacity-40"
        >
          {createTransaction.isPending ? "adding…" : "add transaction"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-[11px] uppercase tracking-label text-ink/50">
              <th className="px-4 py-2.5">date</th>
              <th className="px-4 py-2.5">type</th>
              <th className="px-4 py-2.5">variant</th>
              <th className="px-4 py-2.5">qty in</th>
              <th className="px-4 py-2.5">qty out</th>
              <th className="px-4 py-2.5">notes</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {transactionsQuery.isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink/50">
                  Loading…
                </td>
              </tr>
            ) : (transactionsQuery.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink/50">
                  No transactions logged yet.
                </td>
              </tr>
            ) : (
              (transactionsQuery.data ?? []).map((t) => (
                <tr key={t.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/60">
                  <td className="px-4 py-2.5 text-ink/70">{t.transaction_date}</td>
                  <td className="px-4 py-2.5 text-ink/70">{TRANSACTION_TYPE_LABELS[t.transaction_type]}</td>
                  <td className="px-4 py-2.5 font-medium text-ink">
                    {t.product_variants.products.name}
                    {t.product_variants.variant_label !== t.product_variants.products.name && (
                      <span className="text-ink/50"> — {t.product_variants.variant_label}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-emerald-700">{t.quantity_in ?? ""}</td>
                  <td className="px-4 py-2.5 text-red-700">{t.quantity_out ?? ""}</td>
                  <td className="px-4 py-2.5 text-ink/60">{t.notes ?? ""}</td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => deleteTransaction.mutate(t.id)}
                      aria-label="Delete transaction"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Every column here is a real cross-location total already in the
// database (or, for reorder threshold, an admin-settable field) — there's
// deliberately no "received from manufacturer" / "shipped to Zostel" /
// sales-reconciliation columns, since this app has no source of truth for
// that supply-chain data at all; showing them would mean making up
// numbers.
function ReorderThresholdCell({ summary }: { summary: VariantInventorySummary }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(summary.reorderThreshold === null ? "" : String(summary.reorderThreshold));
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setValue(summary.reorderThreshold === null ? "" : String(summary.reorderThreshold));
  }, [summary.reorderThreshold]);

  const save = useMutation({
    mutationFn: (threshold: number | null) => updateVariantAdmin(createClient(), summary.variantId, { reorder_threshold: threshold }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory-summary"] });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);
    },
  });

  const dirty = (value === "" ? null : Number(value)) !== summary.reorderThreshold;

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="1"
        placeholder="not set"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          save.reset();
        }}
        className="input !w-20 !py-1 text-xs"
      />
      <button
        type="button"
        onClick={() => save.mutate(value === "" ? null : Number(value))}
        disabled={!dirty || save.isPending}
        className="pill-btn-outline !py-1 text-[11px] disabled:opacity-40"
      >
        {save.isPending ? "…" : "save"}
      </button>
      {justSaved && <span className="text-[11px] font-medium text-emerald-700">✓</span>}
    </div>
  );
}

// FilterDropdown works on plain strings; "" stands in for the central/
// online pool (locationId = null) since no real pickup_locations id can
// ever be an empty string.
const ONLINE_VALUE = "";

function QuantityCell({ row }: { row: InventoryWithVariant }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(row.quantity_available));
  const [justSaved, setJustSaved] = useState(false);

  // Table rows are matched by row.id across refetches (see <tr key={row.id}>
  // below), so this component instance survives a refetch instead of
  // remounting — without this effect the input would keep showing
  // whatever was last typed/saved and never pick up a quantity that
  // changed for some other reason (e.g. a purchase decrementing stock).
  useEffect(() => {
    setValue(String(row.quantity_available));
  }, [row.quantity_available]);

  const save = useMutation({
    mutationFn: (quantity: number) => updateInventoryQuantityAdmin(createClient(), row.id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);
    },
  });

  const dirty = Number(value) !== row.quantity_available && value !== "";

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          save.reset();
        }}
        className="input !w-24 !py-1.5 text-sm"
      />
      <button
        type="button"
        onClick={() => save.mutate(Number(value))}
        disabled={!dirty || save.isPending}
        className="pill-btn-outline !py-1.5 text-xs disabled:opacity-40"
      >
        {save.isPending ? "saving…" : "save"}
      </button>
      {justSaved && <span className="text-xs font-medium text-emerald-700">✓ saved</span>}
      {save.isError && (
        <span className="text-xs font-medium text-red-600">
          {save.error instanceof Error ? save.error.message : "Failed to save"}
        </span>
      )}
      {!save.isError && !justSaved && row.quantity_available === 0 && (
        <span className="text-xs font-medium text-red-600">out of stock</span>
      )}
    </div>
  );
}

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [locationId, setLocationId] = useState<string | null>(null);

  const summaryQuery = useQuery({ queryKey: ["admin", "inventory-summary"], queryFn: () => getInventorySummaryAdmin(createClient()) });
  const locationsQuery = useQuery({ queryKey: ["admin", "pickup-locations"], queryFn: () => getPickupLocationsAdmin(createClient()) });
  const inventoryQuery = useQuery({
    queryKey: ["admin", "inventory", locationId ?? "online"],
    queryFn: () => getInventoryAdmin(createClient(), locationId),
  });
  // Only needed to know the full product-variant count, so a *partially*
  // stocked location (e.g. 2 of 4 products) can be detected too, not just
  // a location with zero rows.
  const productsQuery = useQuery({ queryKey: ["admin", "products"], queryFn: () => getProductsAdmin(createClient()) });

  const locations = locationsQuery.data ?? [];
  const rows = inventoryQuery.data ?? [];
  const totalVariantCount = (productsQuery.data ?? []).reduce((sum, product) => sum + product.product_variants.length, 0);
  const missingCount = Math.max(0, totalVariantCount - rows.length);

  const addMissing = useMutation({
    mutationFn: () => addMissingInventoryRowsAdmin(createClient(), locationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "inventory", locationId ?? "online"] }),
  });

  const locationOptions: FilterOption[] = [
    { value: ONLINE_VALUE, label: "online / delivery" },
    ...locations.map((loc) => ({ value: loc.id, label: loc.name })),
  ];

  return (
    <div>
      <AdminPageHeader
        title="inventory"
        description="Stock is tracked per location — an online sale and a Zostel walk-in sale never draw from the same pool."
      />

      <div className="mb-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/10 bg-cream/60 px-4 py-3">
          <p className="text-sm font-semibold text-ink">Inventory summary — across all locations</p>
          <p className="mt-0.5 text-xs text-ink/50">
            Remaining stock and value are real, live totals. Reorder threshold is optional — set it once per variant
            to get an OK / low-stock status.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-[11px] uppercase tracking-label text-ink/50">
                <th className="px-4 py-3">variant</th>
                <th className="px-4 py-3">price / box</th>
                <th className="px-4 py-3">remaining stock</th>
                <th className="px-4 py-3">stock value</th>
                <th className="px-4 py-3">reorder threshold</th>
                <th className="px-4 py-3">status</th>
              </tr>
            </thead>
            <tbody>
              {summaryQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink/50">
                    Loading…
                  </td>
                </tr>
              ) : (summaryQuery.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink/50">
                    No inventory yet.
                  </td>
                </tr>
              ) : (
                <>
                  {(summaryQuery.data ?? []).map((summary) => {
                    const stockValue = summary.totalRemaining * summary.price;
                    const isLow = summary.reorderThreshold !== null && summary.totalRemaining <= summary.reorderThreshold;
                    return (
                      <tr key={summary.variantId} className="border-b border-ink/5 last:border-0 hover:bg-cream/60">
                        <td className="px-4 py-3 font-medium text-ink">
                          {summary.productName}
                          {summary.variantLabel !== summary.productName && (
                            <span className="text-ink/50"> — {summary.variantLabel}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink/70">{formatInr(summary.price)}</td>
                        <td className="px-4 py-3 text-ink/70">{summary.totalRemaining}</td>
                        <td className="px-4 py-3 text-ink/70">{formatInr(stockValue)}</td>
                        <td className="px-4 py-3">
                          <ReorderThresholdCell summary={summary} />
                        </td>
                        <td className="px-4 py-3">
                          {summary.reorderThreshold === null ? (
                            <span className="text-xs text-ink/40">not set</span>
                          ) : isLow ? (
                            <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">low stock</span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-cream/40 font-semibold text-ink">
                    <td className="px-4 py-3">TOTAL</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3">{(summaryQuery.data ?? []).reduce((sum, s) => sum + s.totalRemaining, 0)}</td>
                    <td className="px-4 py-3">
                      {formatInr((summaryQuery.data ?? []).reduce((sum, s) => sum + s.totalRemaining * s.price, 0))}
                    </td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionLogSection products={productsQuery.data ?? []} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterDropdown
          options={locationOptions}
          value={locationId ?? ONLINE_VALUE}
          onChange={(v) => setLocationId(v === ONLINE_VALUE ? null : v)}
          searchPlaceholder="Search locations…"
        />
        {missingCount > 0 && !inventoryQuery.isLoading && !productsQuery.isLoading && (
          <button
            type="button"
            onClick={() => addMissing.mutate()}
            disabled={addMissing.isPending}
            className="pill-btn-outline !py-1.5 text-xs disabled:opacity-40"
          >
            {addMissing.isPending
              ? "adding…"
              : `add ${missingCount} missing product${missingCount === 1 ? "" : "s"} (starts at 0)`}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-[11px] uppercase tracking-label text-ink/50">
              <th className="px-4 py-3">product</th>
              <th className="px-4 py-3">variant</th>
              <th className="px-4 py-3">quantity available</th>
            </tr>
          </thead>
          <tbody>
            {inventoryQuery.isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink/50">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink/50">
                  No inventory rows for this location yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/60">
                  <td className="px-4 py-3 font-medium text-ink">{row.product_variants.products.name}</td>
                  <td className="px-4 py-3 text-ink/60">{row.product_variants.variant_label}</td>
                  <td className="px-4 py-3">
                    <QuantityCell row={row} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
