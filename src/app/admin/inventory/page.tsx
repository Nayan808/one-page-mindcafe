"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Pencil, Trash2, X as XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  addMissingInventoryRowsAdmin,
  createInventoryTransactionAdmin,
  deleteInventoryTransactionAdmin,
  getFullInventoryAdmin,
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
import type { PickupLocation, ProductWithVariants } from "@/types/domain";

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
  // Place and product are both checkbox multi-selects rather than single
  // dropdowns — checking several places and/or several products logs one
  // transaction per (place × product) combination, splitting the single
  // quantity entered below evenly across all of them (remainder goes to
  // the first few so the total still adds up exactly). Checking "Zostel"
  // reveals a checkbox per active location, all pre-checked, so "log this
  // shipment across every Zostel" is one click plus individual opt-outs.
  const [placeOnline, setPlaceOnline] = useState(true);
  const [placeZostel, setPlaceZostel] = useState(false);
  const [selectedZostelIds, setSelectedZostelIds] = useState<Set<string>>(new Set());
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
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

  // null stands for Online (matches createInventoryTransactionAdmin's own
  // locationId: string | null) — one token per checked place, in the
  // order they'll be combined with each checked product below.
  const placeTokens = useMemo(() => {
    const tokens: (string | null)[] = [];
    if (placeOnline) tokens.push(null);
    if (placeZostel) {
      for (const loc of activeLocations) {
        if (selectedZostelIds.has(loc.id)) tokens.push(loc.id);
      }
    }
    return tokens;
  }, [placeOnline, placeZostel, selectedZostelIds, activeLocations]);

  const comboCount = placeTokens.length * selectedVariantIds.size;

  function toggleZostelMaster(checked: boolean) {
    setPlaceZostel(checked);
    setSelectedZostelIds(checked ? new Set(activeLocations.map((l) => l.id)) : new Set());
  }
  function toggleZostelLocation(id: string, checked: boolean) {
    setSelectedZostelIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function toggleVariant(id: string, checked: boolean) {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const createTransactions = useMutation({
    mutationFn: async (rows: { variantId: string; locationId: string | null; quantity: number }[]) => {
      const sb = createClient();
      await Promise.all(
        rows.map((r) =>
          createInventoryTransactionAdmin(sb, {
            transactionDate: date,
            transactionType: type,
            variantId: r.variantId,
            locationId: r.locationId,
            quantity: r.quantity,
            notes: notes.trim() || undefined,
          }),
        ),
      );
    },
    onSuccess: () => {
      setFormError(null);
      setQuantity("");
      setNotes("");
      invalidate();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Failed to add transaction(s)"),
  });

  // Splits the one quantity entered below evenly across every (place ×
  // product) combination checked — e.g. 300 units across 3 products lands
  // 100 each; a total that doesn't divide evenly gives the remainder to
  // the first few combos so the sum still matches exactly what was typed.
  function handleAdd() {
    const qty = Number(quantity);
    if (comboCount === 0 || !qty || qty < comboCount) return;
    const base = Math.floor(qty / comboCount);
    const remainder = qty % comboCount;
    const rows: { variantId: string; locationId: string | null; quantity: number }[] = [];
    let i = 0;
    for (const vId of selectedVariantIds) {
      for (const locationId of placeTokens) {
        rows.push({ variantId: vId, locationId, quantity: base + (i < remainder ? 1 : 0) });
        i++;
      }
    }
    createTransactions.mutate(rows);
  }

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
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink/50">date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink/50">type</label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input">
              <option value="received">Received</option>
              <option value="shipped">Shipped</option>
              <option value="online_sale">Online sale</option>
            </select>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-medium text-ink/50">place</p>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1 text-xs">
                <input type="checkbox" checked={placeOnline} onChange={(e) => setPlaceOnline(e.target.checked)} />
                Online
              </label>
              <label className="flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1 text-xs">
                <input type="checkbox" checked={placeZostel} onChange={(e) => toggleZostelMaster(e.target.checked)} />
                Zostel
              </label>
            </div>
            {placeZostel && (
              <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-lg border border-ink/10 bg-cream/40 p-2">
                {activeLocations.map((loc) => (
                  <label key={loc.id} className="flex items-center gap-1.5 rounded-full border border-ink/20 bg-white px-2.5 py-1 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedZostelIds.has(loc.id)}
                      onChange={(e) => toggleZostelLocation(loc.id, e.target.checked)}
                    />
                    {loc.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] font-medium text-ink/50">product</p>
              <label className="flex items-center gap-1.5 text-[11px] text-ink/50">
                <input
                  type="checkbox"
                  checked={variantOptions.length > 0 && selectedVariantIds.size === variantOptions.length}
                  onChange={(e) => setSelectedVariantIds(e.target.checked ? new Set(variantOptions.map((v) => v.id)) : new Set())}
                />
                all
              </label>
            </div>
            <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-lg border border-ink/10 p-2">
              {variantOptions.map((v) => (
                <label key={v.id} className="flex items-center gap-1.5 rounded-full border border-ink/20 px-2.5 py-1 text-xs">
                  <input type="checkbox" checked={selectedVariantIds.has(v.id)} onChange={(e) => toggleVariant(v.id, e.target.checked)} />
                  {v.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink/50">
              quantity {comboCount > 1 ? `(split across ${comboCount})` : ""}
            </label>
            <input
              type="number"
              min={comboCount || 1}
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink/50">reference / notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="input"
            />
          </div>
        </div>
        {comboCount > 1 && Number(quantity) >= comboCount && (
          <p className="mt-2 text-[11px] text-ink/50">
            Will log {comboCount} entries — {Math.floor(Number(quantity) / comboCount)}
            {Number(quantity) % comboCount > 0 ? `–${Math.ceil(Number(quantity) / comboCount)}` : ""} units each, split evenly.
          </p>
        )}
        {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!date || comboCount === 0 || !quantity || Number(quantity) < comboCount || createTransactions.isPending}
          className="pill-btn mt-3 !py-1.5 text-xs disabled:opacity-40"
        >
          {createTransactions.isPending ? "adding…" : comboCount > 1 ? `add ${comboCount} transactions` : "add transaction"}
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

// Narrowed to just the two fields this cell actually touches — the
// summary table's row only carries the underlying inventory row's id and
// quantity, not a full joined inventory row.
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
      queryClient.invalidateQueries({ queryKey: ["admin", "full-inventory"] });
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

// Splits a new aggregate total back across the real per-location rows it's
// made of, proportionally to each location's current share — a location
// holding 40% of current stock absorbs 40% of the change. Uses largest-
// remainder apportionment (floor every exact share, then hand the leftover
// units to the rows with the biggest fractional share) so the distributed
// quantities always sum to exactly newTotal and never go negative. Falls
// back to an even split when every row is currently at 0 (nothing to be
// proportional to).
function distributeProportionally(rows: { id: string; quantity_available: number }[], newTotal: number): { id: string; quantity: number }[] {
  if (rows.length === 0) return [];
  const target = Math.max(0, newTotal);
  const oldTotal = rows.reduce((sum, r) => sum + r.quantity_available, 0);

  const exactShares =
    oldTotal === 0
      ? rows.map(() => target / rows.length)
      : rows.map((r) => (r.quantity_available / oldTotal) * target);

  const floored = exactShares.map(Math.floor);
  let remaining = target - floored.reduce((sum, v) => sum + v, 0);
  const byRemainderDesc = exactShares
    .map((share, i) => ({ i, fraction: share - floored[i] }))
    .sort((a, b) => b.fraction - a.fraction);

  const quantities = [...floored];
  for (const { i } of byRemainderDesc) {
    if (remaining <= 0) break;
    quantities[i] += 1;
    remaining--;
  }

  return rows.map((r, i) => ({ id: r.id, quantity: quantities[i] }));
}

// Editable "remaining stock" cell for an aggregate scope ("all" / "all
// Zostel") — there's no single row backing the number shown, so saving a
// new total distributes it across every real underlying row via
// distributeProportionally above, then writes each one individually.
function AggregateQuantityCell({ rows }: { rows: FullInventoryRow[] }) {
  const queryClient = useQueryClient();
  const total = rows.reduce((sum, r) => sum + r.quantityAvailable, 0);
  const [value, setValue] = useState(String(total));
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setValue(String(total));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const save = useMutation({
    mutationFn: async (newTotal: number) => {
      const sb = createClient();
      const distributed = distributeProportionally(
        rows.map((r) => ({ id: r.id, quantity_available: r.quantityAvailable })),
        newTotal,
      );
      await Promise.all(distributed.map((d) => updateInventoryQuantityAdmin(sb, d.id, d.quantity)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "full-inventory"] });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);
    },
  });

  const dirty = Number(value) !== total && value !== "";

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
        disabled={!dirty || save.isPending || rows.length === 0}
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
    </div>
  );
}

const SUMMARY_ALL = "all";
const SUMMARY_ALL_ZOSTEL = "all-zostel";
const SUMMARY_ONLINE = "online";

// Shared by both the live-stock summary and the transaction-log
// reconciliation below, so "all Zostel" (say) means exactly the same set
// of locations on both sides of the comparison.
function inScope(locationId: string | null, scope: string): boolean {
  if (scope === SUMMARY_ALL) return true;
  if (scope === SUMMARY_ALL_ZOSTEL) return locationId !== null;
  if (scope === SUMMARY_ONLINE) return locationId === null;
  return locationId === scope;
}

type LogTotals = { in: number; out: number };

// Net movement the manual log claims for each variant, within the current
// scope — "received"/"online sale" adds to quantity_in, "shipped" to
// quantity_out (see the add-transaction form). Not an absolute expected
// count (the log has no opening-balance entry), just the sum of logged
// movement, compared against live stock as a discrepancy signal.
function aggregateTransactionsByVariant(transactions: InventoryTransactionWithVariant[], scope: string): Map<string, LogTotals> {
  const map = new Map<string, LogTotals>();
  for (const t of transactions) {
    if (!inScope(t.location_id, scope)) continue;
    const existing = map.get(t.variant_id) ?? { in: 0, out: 0 };
    existing.in += t.quantity_in ?? 0;
    existing.out += t.quantity_out ?? 0;
    map.set(t.variant_id, existing);
  }
  return map;
}

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
  const [summaryScope, setSummaryScope] = useState<string>(SUMMARY_ALL);

  const fullInventoryQuery = useQuery({ queryKey: ["admin", "full-inventory"], queryFn: () => getFullInventoryAdmin(createClient()) });
  const locationsQuery = useQuery({ queryKey: ["admin", "pickup-locations"], queryFn: () => getPickupLocationsAdmin(createClient()) });
  // Same queryKey as TransactionLogSection's own fetch below — react-query
  // shares the one cache entry, so this doesn't double the network call
  // and picks up the same invalidation when a transaction is added/edited.
  const transactionsQuery = useQuery({
    queryKey: ["admin", "inventory-transactions"],
    queryFn: () => getInventoryTransactionsAdmin(createClient()),
  });
  // Only needed to know the full product-variant count, so a *partially*
  // stocked location (e.g. 2 of 4 products) can be detected too, not just
  // a location with zero rows.
  const productsQuery = useQuery({ queryKey: ["admin", "products"], queryFn: () => getProductsAdmin(createClient()) });

  const locations = locationsQuery.data ?? [];
  const activeZostelLocations = useMemo(() => locations.filter((l) => l.is_active), [locations]);
  const totalVariantCount = (productsQuery.data ?? []).reduce((sum, product) => sum + product.product_variants.length, 0);

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

  const scopedFullRows = useMemo(() => full.filter((r) => inScope(r.locationId, summaryScope)), [full, summaryScope]);
  const summaryRows: SummaryRow[] = useMemo(() => aggregateByVariant(scopedFullRows), [scopedFullRows]);
  // The real per-location rows behind each summary row, for the current
  // scope — AggregateQuantityCell needs these (not just the total) to
  // know what to distribute a new aggregate number across.
  const rowsByVariant = useMemo(() => {
    const map = new Map<string, FullInventoryRow[]>();
    for (const r of scopedFullRows) {
      const existing = map.get(r.variantId);
      if (existing) existing.push(r);
      else map.set(r.variantId, [r]);
    }
    return map;
  }, [scopedFullRows]);

  const loggedByVariant = useMemo(
    () => aggregateTransactionsByVariant(transactionsQuery.data ?? [], summaryScope),
    [transactionsQuery.data, summaryScope],
  );

  // Remaining stock is only directly editable here when the scope maps to
  // exactly one underlying row per variant — a specific Zostel or the
  // online pool. "all" and "all Zostel" are sums across several rows;
  // there's no single row to write a new quantity into, so those stay
  // read-only (edit the specific location instead).
  const isSingleLocationScope = summaryScope !== SUMMARY_ALL && summaryScope !== SUMMARY_ALL_ZOSTEL;
  // The real pickup_locations id for the current scope, or null for the
  // online pool — only meaningful (and only used) when isSingleLocationScope.
  const scopeLocationId = summaryScope === SUMMARY_ONLINE ? null : summaryScope;
  // aggregateByVariant collapses each single-location scope's rows to
  // exactly one summary row per variant present there, so the gap against
  // the full catalog is a direct missing-row count — same idea the old
  // per-location table's "add missing" button used, just driven by this
  // scope picker instead of a separate one.
  const missingCount = isSingleLocationScope ? Math.max(0, totalVariantCount - summaryRows.length) : 0;

  const addMissing = useMutation({
    mutationFn: () => addMissingInventoryRowsAdmin(createClient(), scopeLocationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "full-inventory"] }),
  });

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
              units left on some product. &quot;Logged net&quot; and &quot;gap&quot; compare live stock against the
              Transaction log below, for whatever scope is selected here. Remaining stock is editable at every
              scope — editing &quot;all&quot; or &quot;all Zostel&quot; splits the new number across each real
              location proportionally to its current share, rather than writing one row directly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSingleLocationScope && missingCount > 0 && !fullInventoryQuery.isLoading && !productsQuery.isLoading && (
              <button
                type="button"
                onClick={() => addMissing.mutate()}
                disabled={addMissing.isPending}
                className="pill-btn-outline !py-1.5 text-xs disabled:opacity-40"
              >
                {addMissing.isPending ? "adding…" : `add ${missingCount} missing product${missingCount === 1 ? "" : "s"} (starts at 0)`}
              </button>
            )}
            <FilterDropdown options={scopeOptions} value={summaryScope} onChange={setSummaryScope} searchPlaceholder="Search…" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-[11px] uppercase tracking-label text-ink/50">
                <th className="px-4 py-3">variant</th>
                <th className="px-4 py-3">price / box</th>
                <th className="px-4 py-3">remaining stock</th>
                <th className="px-4 py-3">stock value</th>
                <th className="px-4 py-3">logged net (in − out)</th>
                <th className="px-4 py-3">gap vs. log</th>
                <th className="px-4 py-3">reorder threshold</th>
                <th className="px-4 py-3">status</th>
              </tr>
            </thead>
            <tbody>
              {fullInventoryQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-ink/50">
                    Loading…
                  </td>
                </tr>
              ) : summaryRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-ink/50">
                    No inventory in this scope.
                  </td>
                </tr>
              ) : (
                <>
                  {summaryRows.map((summary) => {
                    const stockValue = summary.totalRemaining * summary.price;
                    const isLow = summary.reorderThreshold !== null && summary.totalRemaining <= summary.reorderThreshold;
                    const logged = loggedByVariant.get(summary.variantId);
                    const loggedNet = logged ? logged.in - logged.out : null;
                    const gap = loggedNet === null ? null : summary.totalRemaining - loggedNet;
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
                            <AggregateQuantityCell rows={rowsByVariant.get(summary.variantId) ?? []} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink/70">{formatInr(stockValue)}</td>
                        <td className="px-4 py-3">
                          {loggedNet === null ? (
                            <span className="text-ink/30">not logged</span>
                          ) : (
                            <span className={loggedNet >= 0 ? "text-emerald-700" : "text-red-700"}>
                              {loggedNet >= 0 ? `+${loggedNet}` : loggedNet}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {gap === null ? (
                            <span className="text-ink/30">—</span>
                          ) : gap === 0 ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                              matches
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                              {gap > 0 ? `+${gap} unlogged` : `${Math.abs(gap)} over-logged`}
                            </span>
                          )}
                        </td>
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
    </div>
  );
}

