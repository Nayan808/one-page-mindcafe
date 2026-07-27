"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getAllExpertsAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterDropdown } from "@/components/admin/FilterDropdown";
import { AvailabilityManager } from "@/components/AvailabilityManager";

export default function AdminAvailabilityPage() {
  const [expertId, setExpertId] = useState("");

  const expertsQuery = useQuery({
    queryKey: ["admin", "experts", "all"],
    queryFn: () => getAllExpertsAdmin(createClient()),
  });
  const experts = expertsQuery.data ?? [];

  return (
    <div>
      <AdminPageHeader title="availability" description="Block or unblock time slots on any expert's behalf." />

      <div className="max-w-sm">
        <FilterDropdown
          options={experts.map((e) => ({ value: e.id, label: e.name }))}
          value={expertId}
          onChange={setExpertId}
          placeholder={expertsQuery.isLoading ? "Loading experts…" : "Select an expert"}
          searchPlaceholder="Search by name…"
          triggerClassName="input flex w-full items-center justify-between text-left"
        />
      </div>

      {expertId && (
        <div className="mt-6 max-w-md rounded-2xl border border-ink/15 bg-white p-5">
          <AvailabilityManager expertId={expertId} />
        </div>
      )}
    </div>
  );
}
