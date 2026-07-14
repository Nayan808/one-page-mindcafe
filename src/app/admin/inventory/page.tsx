"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getInventoryAdmin, getPickupLocationsAdmin, updateInventoryQuantityAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterDropdown, type FilterOption } from "@/components/admin/FilterDropdown";
import type { InventoryWithVariant } from "@/types/domain";

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
  const [locationId, setLocationId] = useState<string | null>(null);

  const locationsQuery = useQuery({ queryKey: ["admin", "pickup-locations"], queryFn: () => getPickupLocationsAdmin(createClient()) });
  const inventoryQuery = useQuery({
    queryKey: ["admin", "inventory", locationId ?? "online"],
    queryFn: () => getInventoryAdmin(createClient(), locationId),
  });

  const locations = locationsQuery.data ?? [];
  const rows = inventoryQuery.data ?? [];

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

      <div className="mb-4">
        <FilterDropdown
          options={locationOptions}
          value={locationId ?? ONLINE_VALUE}
          onChange={(v) => setLocationId(v === ONLINE_VALUE ? null : v)}
          searchPlaceholder="Search locations…"
        />
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
