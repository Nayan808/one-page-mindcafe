"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getSalesSummary } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatInr } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  ready_for_pickup: "Ready for pickup",
  picked_up: "Picked up",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/15 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">{label}</p>
      <p className="font-display mt-1.5 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["admin", "sales-summary"],
    queryFn: () => getSalesSummary(createClient()),
  });
  const summary = summaryQuery.data;

  const maxDayRevenue = Math.max(1, ...(summary?.revenueLast30Days.map((d) => d.revenue) ?? [1]));

  return (
    <div>
      <AdminPageHeader title="dashboard" description="Sales, bookings, and everything that needs attention." />

      {summaryQuery.isLoading ? (
        <p className="text-sm text-ink/60">Loading…</p>
      ) : summary ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="total revenue (paid orders)" value={formatInr(summary.totalRevenue)} />
            <StatCard label="paid orders" value={String(summary.paidOrderCount)} />
            <StatCard label="pending appointments" value={String(summary.pendingAppointments)} />
            <StatCard label="new business leads" value={String(summary.newBusinessLeads)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink/15 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">orders by status</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {Object.entries(summary.ordersByStatus).map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between">
                    <span className="text-ink/70">{STATUS_LABELS[status] ?? status}</span>
                    <span className="font-medium text-ink">{count}</span>
                  </li>
                ))}
                {Object.keys(summary.ordersByStatus).length === 0 && (
                  <li className="text-ink/50">No orders yet.</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-ink/15 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">other</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-ink/70">newsletter subscribers</span>
                  <span className="font-medium text-ink">{summary.newsletterSubscribers}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/15 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">
              revenue — last 30 days (paid orders)
            </p>
            {summary.revenueLast30Days.length === 0 ? (
              <p className="mt-3 text-sm text-ink/50">No paid orders in this window yet.</p>
            ) : (
              <div className="mt-4 flex h-32 items-end gap-1">
                {summary.revenueLast30Days.map((day) => (
                  <div key={day.date} className="group relative flex-1">
                    <div
                      className="w-full rounded-t bg-ink transition-opacity group-hover:opacity-70"
                      style={{ height: `${Math.max(4, (day.revenue / maxDayRevenue) * 100)}%` }}
                    />
                    <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] text-cream group-hover:block">
                      {day.date}: {formatInr(day.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-red-600">Couldn&apos;t load the summary.</p>
      )}
    </div>
  );
}
