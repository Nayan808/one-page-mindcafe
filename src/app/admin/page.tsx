"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSalesSummary, type DashboardRange } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatInr, downloadCsv } from "@/lib/utils";

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

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "1d", label: "today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "all time" },
];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/15 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">{label}</p>
      <p className="font-display mt-1.5 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<DashboardRange>("30d");
  const summaryQuery = useQuery({
    queryKey: ["admin", "sales-summary", range],
    queryFn: () => getSalesSummary(createClient(), range),
  });
  const summary = summaryQuery.data;
  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)?.label ?? range;

  const maxDayRevenue = Math.max(1, ...(summary?.range.dailyRevenue.map((d) => d.revenue) ?? [1]));

  function handleExport() {
    if (!summary) return;
    downloadCsv(
      `sales-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`,
      summary.range.orders.map((o) => ({
        order_number: o.order_number,
        date: o.created_at.slice(0, 10),
        status: o.status,
        payment_status: o.payment_status,
        fulfillment_type: o.fulfillment_type,
        total: o.total,
      })),
    );
  }

  return (
    <div>
      <AdminPageHeader title="dashboard" description="Sales, bookings, and everything that needs attention." />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRange(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${range === opt.value ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/60"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={!summary || summary.range.orders.length === 0}
          className="pill-btn-outline gap-1.5 !py-2 text-xs disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          download report (CSV)
        </button>
      </div>

      {summaryQuery.isLoading ? (
        <p className="text-sm text-ink/60">Loading…</p>
      ) : summary ? (
        <div className="space-y-8">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-label text-ink/50">needs attention right now</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="pending appointments" value={String(summary.pendingAppointments)} />
              <StatCard label="unactioned business leads" value={String(summary.newBusinessLeadsQueue)} />
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-label text-ink/50">performance — {rangeLabel}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="revenue (paid orders)" value={formatInr(summary.range.totalRevenue)} />
              <StatCard label="paid orders" value={String(summary.range.paidOrderCount)} />
              <StatCard label="new appointments" value={String(summary.range.newAppointments)} />
              <StatCard label="new business leads" value={String(summary.range.newBusinessLeads)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink/15 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">orders by status — {rangeLabel}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {Object.entries(summary.range.ordersByStatus).map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between">
                    <span className="text-ink/70">{STATUS_LABELS[status] ?? status}</span>
                    <span className="font-medium text-ink">{count}</span>
                  </li>
                ))}
                {Object.keys(summary.range.ordersByStatus).length === 0 && (
                  <li className="text-ink/50">No orders in this window.</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-ink/15 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">other — {rangeLabel}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-ink/70">new newsletter subscribers</span>
                  <span className="font-medium text-ink">{summary.range.newNewsletterSubscribers}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/15 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">
              revenue by day — {rangeLabel} (paid orders)
            </p>
            {summary.range.dailyRevenue.length === 0 ? (
              <p className="mt-3 text-sm text-ink/50">No paid orders in this window yet.</p>
            ) : (
              <div className="mt-4 flex h-32 items-end gap-1">
                {summary.range.dailyRevenue.map((day) => (
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
