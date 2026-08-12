"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Pencil, Trash2, X as XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  addMissingInventoryRowsAdmin,
  createInventoryTransactionAdmin,
  deleteInventoryTransactionAdmin,
  getAllZostelInventoryAdmin,
  getFullInventoryAdmin,
  getInventoryAdmin,
  getInventoryTransactionsAdmin,
  getPickupLocationsAdmin,
  getProductsAdmin,
  updateInventoryQuantityAdmin,
  updateInventoryTransactionAdmin,
  updateVariantAdmin,
  type FullInventoryRow,
  type InventoryTransactionWithVariant,
} from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterDropdown, type FilterOption } from "@/components/admin/FilterDropdown";
import { formatInr } from "@/lib/utils";
import type { InventoryWithVariant, InventoryWithVariantAndLocation, PickupLocation, ProductWithVariants } from "@/types/domain";

// Same hardcoded floor for every "each" (single-location) option — chosen
// directly, not derived from the per-variant reorder_threshold feature
// (that one stays admin-configurable and drives the summary table's own
// OK/low-stock column; this is a quicker, always-on signal in the filter
// itself so a low location stands out before you even open it).
const LOCATION_LOW_STOCK_FLOOR = 10;
const AGGREGATE_LOW_STOCK_FLOOR = 50;

const TRANSACTION_TYPE_LABELS: Record<"received" | "shipped" | "online_sale", string> = {
  received: "Received",
  shipped: "Shipped",
  online_sale: "Online sale (logged)",
};

function toLocalDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Manual reconciliation ledger — the client's "Transaction Log" sheet
// (Received / Shipped / Online Sale, quantity in/out, notes, place), built
// as a real feature rather than fabricated numbers. Deliberately not
// wired to inventory.quantity_available (see the migration's comment):
// this is an audit trail, not a second source of truth for what checkout
// reserves against.
function TransactionLogSection({ products, locations }: { products: ProductWithVariants[]; locations: PickupLocation[] }) {
  const queryClient = useQueryClient();
  const transactionsQuery = useQuery({
    queryKey: ["admin", "inventory-transactions"],
    queryFn: () => getInventoryTransactionsAdmin(createClient()),
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
  const activeLocations = useMemo(() => locations.filter((l) => l.is_active), [locations]);

  const [date, setDate] = useState(() => toLocalDateInputValue(new Date()));
  const [type, setType] = useState<"received" | "shipped" | "online_sale">("received");
  const [variantId, setVariantId] = useState("");
  const [place, setPlace] = useState(""); // "" = online
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Inline row editing — a second, identically-shaped form kept separate
  // from the "add transaction" one above so opening a row to edit never
  // clobbers whatever's half-typed into the add form.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<"received" | "shipped" | "online_sale">("received");
  const [editVariantId, setEditVariantId] = useState("");
  const [editPlace, setEditPlace] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory-transactions"] });
  };

  const createTransaction = useMutation({
    mutationFn: () =>
      createInventoryTransactionAdmin(createClient(), {
        transactionDate: date,
        transactionType: type,
        variantId,
        locationId: place || null,
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

  const updateTransaction = useMutation({
    mutationFn: (id: string) =>
      updateInventoryTransactionAdmin(createClient(), id, {
        transactionDate: editDate,
        transactionType: editType,
        variantId: editVariantId,
        locationId: editPlace || null,
        quantity: Number(editQuantity),
        notes: editNotes.trim() || undefined,
      }),
    onSuccess: () => {
      setEditError(null);
      setEditingId(null);
      invalidate();
    },
    onError: (err) => setEditError(err instanceof Error ? err.message : "Failed to save transaction"),
  });

  function startEdit(t: InventoryTransactionWithVariant) {
    setEditingId(t.id);
    setEditDate(t.transaction_date);
    setEditType(t.transaction_type);
    setEditVariantId(t.variant_id);
    setEditPlace(t.location_id ?? "");
    setEditQuantity(String(t.quantity_in ?? t.quantity_out ?? ""));
    setEditNotes(t.notes ?? "");
    setEditError(null);
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="border-b border-ink/10 bg-cream/60 px-4 py-3">
        <p className="text-sm font-semibold text-ink">Transaction log</p>
        <p className="mt-0.5 text-xs text-ink/50">
          A manual ledger for reconciling manufacturer receipts and Zostel shipments — separate from live stock
          above.
        </p>
      </div>

      <div className="border-b border-ink/10 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-label text-ink/50">add transaction</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="">
            <label className="mb-1 block text-[11px] font-medium text-ink/50">date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <div className="">
            <label className="mb-1 block text-[11px] font-medium text-ink/50">type</label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input">
              <option value="received">Received</option>
              <option value="shipped">Shipped</option>
              <option value="online_sale">Online sale</option>
            </select>
          </div>
          <div className="">
            <label className="mb-1 block text-[11px] font-medium text-ink/50">place</label>
            <select value={place} onChange={(e) => setPlace(e.target.value)} className="input">
              <option value="">Online</option>
              {activeLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="">
            <label className="mb-1 block text-[11px] font-medium text-ink/50">product</label>
            <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="input">
              <option value="">Select product…</option>
              {variantOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className="">
            <label className="mb-1 block text-[11px] font-medium text-ink/50">quantity</label>
            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
            />
          </div>
          <div className="">
            <label className="mb-1 block text-[11px] font-medium text-ink/50">reference / notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="input"
            />
          </div>
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
              <th className="px-4 py-2.5">place</th>
              <th className="px-4 py-2.5">product</th>
              <th className="px-4 py-2.5">qty in</th>
              <th className="px-4 py-2.5">qty out</th>
              <th className="px-4 py-2.5">notes</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {transactionsQuery.isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink/50">
                  Loading…
                </td>
              </tr>
            ) : (transactionsQuery.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink/50">
                  No transactions logged yet.
                </td>
              </tr>
            ) : (
              (transactionsQuery.data ?? []).map((t) =>
                t.id === editingId ? (
                  <tr key={t.id} className="border-b border-ink/5 bg-cream/40 last:border-0">
                    <td className="px-2 py-2">
                      <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="input !py-1.5 text-xs" />
                    </td>
                    <td className="px-2 py-2">
                      <select value={editType} onChange={(e) => setEditType(e.target.value as typeof editType)} className="input !py-1.5 text-xs">
                        <option value="received">Received</option>
                        <option value="shipped">Shipped</option>
                        <option value="online_sale">Online sale</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select value={editPlace} onChange={(e) => setEditPlace(e.target.value)} className="input !py-1.5 text-xs">
                        <option value="">Online</option>
                        {activeLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select value={editVariantId} onChange={(e) => setEditVariantId(e.target.value)} className="input !py-1.5 text-xs">
                        {variantOptions.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2" colSpan={2}>
                      <input
                        type="number"
                        min="1"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        className="input !py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="input !py-1.5 text-xs" />
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateTransaction.mutate(t.id)}
                          disabled={!editDate || !editVariantId || !editQuantity || Number(editQuantity) <= 0 || updateTransaction.isPending}
                          className="pill-btn !py-1 text-[11px] disabled:opacity-40"
                        >
                          {updateTransaction.isPending ? "saving…" : "save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel edit"
                          className="text-ink/50 hover:text-ink"
                        >
                          <XIcon className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      {editError && <p className="mt-1 text-[11px] text-red-600">{editError}</p>}
                    </td>
                  </tr>
                ) : (
                  <tr key={t.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/60">
                    <td className="px-4 py-2.5 text-ink/70">{t.transaction_date}</td>
                    <td className="px-4 py-2.5 text-ink/70">{TRANSACTION_TYPE_LABELS[t.transaction_type]}</td>
                    <td className="px-4 py-2.5 text-ink/70">{t.pickup_locations?.name ?? "Online"}</td>
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(t)}
                          aria-label="Edit transaction"
                          className="text-ink/50 hover:text-ink"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTransaction.mutate(t.id)}
                          aria-label="Delete transaction"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Per-variant row for the scope-aware summary table below — remaining is
// whatever's in-scope (all locations, all Zostel, online only, or one
// specific location), aggregated from the full inventory row set.
type SummaryRow = {
  variantId: string;
  productName: string;
  variantLabel: string;
  price: number;
  reorderThreshold: number | null;
  totalRemaining: number;
  /** The underlying inventory row's real id — only meaningful when the
   * summary is scoped to exactly one location (or the online pool), so
   * totalRemaining maps to a single editable row rather than a sum
   * across several. Multiple-location scopes never read this field. */
  inventoryRowId: string;
};

// Every column here is a real total already in the database (or, for
// reorder threshold, an admin-settable field) — there's deliberately no
// "received from manufacturer" / "shipped to Zostel" / sales-
// reconciliation columns, since this app has no source of truth for that
// supply-chain data at all; showing them would mean making up numbers.
function ReorderThresholdCell({ summary }: { summary: SummaryRow }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(summary.reorderThreshold === null ? "" : String(summary.reorderThreshold));
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setValue(summary.reorderThreshold === null ? "" : String(summary.reorderThreshold));
  }, [summary.reorderThreshold]);

  const save = useMutation({
    mutationFn: (threshold: number | null) => updateVariantAdmin(createClient(), summary.variantId, { reorder_threshold: threshold }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "full-inventory"] });
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
// Sentinel for "every active Zostel location at once" — distinct from any
// real pickup_locations id and from ONLINE_VALUE.
const ALL_ZOSTEL_VALUE = "__all_zostel__";

// Narrowed to just the two fields this cell actually touches (rather than
// the full InventoryWithVariant shape) so it can also be used for a
// summary-table row, which only carries the underlying inventory row's id
// and quantity, not every joined column the per-location table has.
function QuantityCell({ row }: { row: { id: string; quantity_available: number } }) {
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
      // Every view that shows this same quantity — the single-location
      // table, the cross-location summary, and the "all Zostel" list —
      // needs to pick up the change, not just whichever one this cell
      // happens to live in.
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "full-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "all-zostel-inventory"] });
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

const SUMMARY_ALL = "all";
const SUMMARY_ALL_ZOSTEL = "all-zostel";
const SUMMARY_ONLINE = "online";

function aggregateByVariant(rows: FullInventoryRow[]): SummaryRow[] {
  const byVariant = new Map<string, SummaryRow>();
  for (const row of rows) {
    const existing = byVariant.get(row.variantId);
    if (existing) {
      existing.totalRemaining += row.quantityAvailable;
    } else {
      byVariant.set(row.variantId, {
        variantId: row.variantId,
        productName: row.productName,
        variantLabel: row.variantLabel,
        price: row.price,
        reorderThreshold: row.reorderThreshold,
        totalRemaining: row.quantityAvailable,
        inventoryRowId: row.id,
      });
    }
  }
  return [...byVariant.values()].sort((a, b) => a.productName.localeCompare(b.productName));
}

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [summaryScope, setSummaryScope] = useState<string>(SUMMARY_ALL);

  const fullInventoryQuery = useQuery({ queryKey: ["admin", "full-inventory"], queryFn: () => getFullInventoryAdmin(createClient()) });
  const locationsQuery = useQuery({ queryKey: ["admin", "pickup-locations"], queryFn: () => getPickupLocationsAdmin(createClient()) });
  const isAllZostelView = locationId === ALL_ZOSTEL_VALUE;
  const inventoryQuery = useQuery({
    queryKey: ["admin", "inventory", locationId ?? "online"],
    queryFn: () => getInventoryAdmin(createClient(), locationId),
    enabled: !isAllZostelView,
  });
  const allZostelQuery = useQuery({
    queryKey: ["admin", "all-zostel-inventory"],
    queryFn: () => getAllZostelInventoryAdmin(createClient()),
    enabled: isAllZostelView,
  });
  // Only needed to know the full product-variant count, so a *partially*
  // stocked location (e.g. 2 of 4 products) can be detected too, not just
  // a location with zero rows.
  const productsQuery = useQuery({ queryKey: ["admin", "products"], queryFn: () => getProductsAdmin(createClient()) });

  const locations = locationsQuery.data ?? [];
  const activeZostelLocations = useMemo(() => locations.filter((l) => l.is_active), [locations]);
  const rows = inventoryQuery.data ?? [];
  const totalVariantCount = (productsQuery.data ?? []).reduce((sum, product) => sum + product.product_variants.length, 0);
  const missingCount = Math.max(0, totalVariantCount - rows.length);

  const addMissing = useMutation({
    mutationFn: () => addMissingInventoryRowsAdmin(createClient(), locationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "inventory", locationId ?? "online"] }),
  });

  const locationOptions: FilterOption[] = [
    { value: ONLINE_VALUE, label: "online / delivery" },
    { value: ALL_ZOSTEL_VALUE, label: "all Zostel locations" },
    ...locations.map((loc) => ({ value: loc.id, label: loc.name })),
  ];

  // Scope options for the summary card, each flagged red when its own
  // stock is running low — 50 for any of the three aggregate scopes
  // (spans multiple locations, so one property being low can hide inside
  // a healthy-looking total), 10 for a single specific Zostel (its own
  // number is already the whole picture, so the floor can be tighter).
  const full = fullInventoryQuery.data ?? [];
  const scopeOptions: FilterOption[] = useMemo(() => {
    const zostelRows = full.filter((r) => r.locationId !== null);
    const onlineRows = full.filter((r) => r.locationId === null);
    const hasLow = (rows: FullInventoryRow[], floor: number) =>
      aggregateByVariant(rows).some((s) => s.totalRemaining < floor);

    const options: FilterOption[] = [
      { value: SUMMARY_ALL, label: "all (online + Zostel)", warning: hasLow(full, AGGREGATE_LOW_STOCK_FLOOR) },
      { value: SUMMARY_ALL_ZOSTEL, label: "all Zostel locations", warning: hasLow(zostelRows, AGGREGATE_LOW_STOCK_FLOOR) },
      { value: SUMMARY_ONLINE, label: "online / delivery", warning: hasLow(onlineRows, AGGREGATE_LOW_STOCK_FLOOR) },
    ];
    for (const loc of activeZostelLocations) {
      const locRows = full.filter((r) => r.locationId === loc.id);
      options.push({ value: loc.id, label: loc.name, warning: hasLow(locRows, LOCATION_LOW_STOCK_FLOOR) });
    }
    return options;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full, activeZostelLocations]);

  const summaryRows: SummaryRow[] = useMemo(() => {
    const filtered =
      summaryScope === SUMMARY_ALL
        ? full
        : summaryScope === SUMMARY_ALL_ZOSTEL
          ? full.filter((r) => r.locationId !== null)
          : summaryScope === SUMMARY_ONLINE
            ? full.filter((r) => r.locationId === null)
            : full.filter((r) => r.locationId === summaryScope);
    return aggregateByVariant(filtered);
  }, [full, summaryScope]);

  // Remaining stock is only directly editable here when the scope maps to
  // exactly one underlying row per variant — a specific Zostel or the
  // online pool. "all" and "all Zostel" are sums across several rows;
  // there's no single row to write a new quantity into, so those stay
  // read-only (edit the specific location instead).
  const isSingleLocationScope = summaryScope !== SUMMARY_ALL && summaryScope !== SUMMARY_ALL_ZOSTEL;

  return (
    <div>
      <AdminPageHeader
        title="inventory"
        description="Stock is tracked per location — an online sale and a Zostel walk-in sale never draw from the same pool."
      />

      <div className="mb-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-cream/60 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Inventory summary</p>
            <p className="mt-0.5 text-xs text-ink/50">
              Remaining stock and value are real, live totals. A red dot flags a scope with less than{" "}
              {summaryScope === SUMMARY_ALL || summaryScope === SUMMARY_ALL_ZOSTEL || summaryScope === SUMMARY_ONLINE
                ? AGGREGATE_LOW_STOCK_FLOOR
                : LOCATION_LOW_STOCK_FLOOR}{" "}
              units left on some product.
            </p>
          </div>
          <FilterDropdown options={scopeOptions} value={summaryScope} onChange={setSummaryScope} searchPlaceholder="Search…" />
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
              {fullInventoryQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink/50">
                    Loading…
                  </td>
                </tr>
              ) : summaryRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink/50">
                    No inventory in this scope.
                  </td>
                </tr>
              ) : (
                <>
                  {summaryRows.map((summary) => {
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
                        <td className="px-4 py-3 text-ink/70">
                          {isSingleLocationScope ? (
                            <QuantityCell row={{ id: summary.inventoryRowId, quantity_available: summary.totalRemaining }} />
                          ) : (
                            summary.totalRemaining
                          )}
                        </td>
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
                    <td className="px-4 py-3">{summaryRows.reduce((sum, s) => sum + s.totalRemaining, 0)}</td>
                    <td className="px-4 py-3">{formatInr(summaryRows.reduce((sum, s) => sum + s.totalRemaining * s.price, 0))}</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionLogSection products={productsQuery.data ?? []} locations={locations} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterDropdown
          options={locationOptions}
          value={locationId ?? ONLINE_VALUE}
          onChange={(v) => setLocationId(v === ONLINE_VALUE ? null : v)}
          searchPlaceholder="Search locations…"
        />
        {!isAllZostelView && missingCount > 0 && !inventoryQuery.isLoading && !productsQuery.isLoading && (
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

      {isAllZostelView ? (
        <AllZostelInventoryTable rows={allZostelQuery.data ?? []} isLoading={allZostelQuery.isLoading} />
      ) : (
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
      )}
    </div>
  );
}

// Every active Zostel property's own stock, grouped by location, all
// editable in one place — the alternative to stepping through the
// dropdown one property at a time.
function AllZostelInventoryTable({ rows, isLoading }: { rows: InventoryWithVariantAndLocation[]; isLoading: boolean }) {
  const byLocation = useMemo(() => {
    const groups = new Map<string, { name: string; city: string; rows: InventoryWithVariantAndLocation[] }>();
    for (const row of rows) {
      const key = row.location_id ?? "";
      const existing = groups.get(key);
      if (existing) {
        existing.rows.push(row);
      } else {
        groups.set(key, { name: row.pickup_locations?.name ?? "Unknown", city: row.pickup_locations?.city ?? "", rows: [row] });
      }
    }
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white px-4 py-6 text-center text-sm text-ink/50">Loading…</div>
    );
  }

  if (byLocation.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white px-4 py-6 text-center text-sm text-ink/50">
        No Zostel inventory yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {byLocation.map((location) => (
        <div key={location.name} className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="border-b border-ink/10 bg-cream/60 px-4 py-2.5">
            <p className="text-sm font-semibold text-ink">
              {location.name}
              {location.city ? <span className="font-normal text-ink/50"> — {location.city}</span> : null}
            </p>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-[11px] uppercase tracking-label text-ink/50">
                <th className="px-4 py-2.5">product</th>
                <th className="px-4 py-2.5">variant</th>
                <th className="px-4 py-2.5">quantity available</th>
              </tr>
            </thead>
            <tbody>
              {location.rows.map((row) => (
                <tr key={row.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/60">
                  <td className="px-4 py-2.5 font-medium text-ink">{row.product_variants.products.name}</td>
                  <td className="px-4 py-2.5 text-ink/60">{row.product_variants.variant_label}</td>
                  <td className="px-4 py-2.5">
                    <QuantityCell row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
