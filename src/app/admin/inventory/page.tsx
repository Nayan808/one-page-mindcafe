"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getInventoryAdmin, getPickupLocationsAdmin, updateInventoryQuantityAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { InventoryWithVariant } from "@/types/domain";

function QuantityCell({ row }: { row: InventoryWithVariant }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(row.quantity_available));

  const save = useMutation({
    mutationFn: (quantity: number) => updateInventoryQuantityAdmin(createClient(), row.id, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] }),
  });

  const dirty = Number(value) !== row.quantity_available && value !== "";

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
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
      {row.quantity_available === 0 && <span className="text-xs font-medium text-red-600">out of stock</span>}
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

  return (
    <div>
      <AdminPageHeader
        title="inventory"
        description="Stock is tracked per location — an online sale and a Zostel walk-in sale never draw from the same pool."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setLocationId(null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${locationId === null ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/70 hover:border-ink/40"}`}
        >
          online / delivery
        </button>
        {locations.map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setLocationId(loc.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${locationId === loc.id ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/70 hover:border-ink/40"}`}
          >
            {loc.name}
          </button>
        ))}
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
