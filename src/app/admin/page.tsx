"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

type Segment = "combined" | "feelz" | "counselling";

const SEGMENT_OPTIONS: { value: Segment; label: string }[] = [
  { value: "combined", label: "combined" },
  { value: "feelz", label: "feelz" },
  { value: "counselling", label: "counselling" },
];

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">{label}</p>
      <p className="font-display mt-1.5 text-2xl font-bold text-ink">{value}</p>
    </>
  );
  const className = "rounded-2xl border border-ink/15 bg-white p-5" + (href ? " block transition hover:border-ink/30" : "");
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<DashboardRange>("30d");
  const [segment, setSegment] = useState<Segment>("combined");
  const queryClient = useQueryClient();
  const summaryQuery = useQuery({
    queryKey: ["admin", "sales-summary", range],
    queryFn: () => getSalesSummary(createClient(), range),
  });
  const summary = summaryQuery.data;
  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)?.label ?? range;

  // Live: a new order, a new booking, or a payment landing anywhere
  // refreshes the numbers on this page without a manual reload — this is
  // the page most likely to be sitting open on a screen somewhere.
  useEffect(() => {
    const sb = createClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "sales-summary"] });
    const channel = sb
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "business_leads" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "feelz_preorders" }, invalidate)
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [queryClient]);

  // The chart/revenue figures follow the segment toggle — "combined" shows
  // the same merged numbers as before, "feelz"/"counselling" isolate just
  // that stream's revenue so each side of the business can be reviewed
  // without the other one's numbers mixed in.
  const segmentRevenue = (day: { revenue: number; productRevenue: number; appointmentRevenue: number }) =>
    segment === "feelz" ? day.productRevenue : segment === "counselling" ? day.appointmentRevenue : day.revenue;
  const maxDayRevenue = Math.max(1, ...(summary?.range.dailyRevenue.map(segmentRevenue) ?? [1]));

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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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

      <div className="mb-6 flex flex-wrap gap-2">
        {SEGMENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSegment(opt.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium uppercase tracking-label ${segment === opt.value ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/60 hover:border-ink/40"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {summaryQuery.isLoading ? (
        <p className="text-sm text-ink/60">Loading…</p>
      ) : summary ? (
        <div className="space-y-8">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-label text-ink/50">needs attention right now</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {segment !== "feelz" && (
                <StatCard label="pending appointments" value={String(summary.pendingAppointments)} href="/admin/appointments" />
              )}
              {segment !== "counselling" && (
                <>
                  <StatCard label="unactioned business leads" value={String(summary.newBusinessLeadsQueue)} href="/admin/business-leads" />
                  <StatCard label="feelz preorders" value={String(summary.feelzPreordersTotal)} href="/admin/feelz-preorders" />
                </>
              )}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-label text-ink/50">performance — {rangeLabel}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {segment === "combined" && <StatCard label="total revenue" value={formatInr(summary.range.totalRevenue)} />}
              {segment !== "counselling" && <StatCard label="feelz revenue" value={formatInr(summary.range.productRevenue)} />}
              {segment !== "feelz" && <StatCard label="counselling revenue" value={formatInr(summary.range.appointmentRevenue)} />}
              {segment !== "counselling" && <StatCard label="paid orders" value={String(summary.range.paidOrderCount)} />}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {segment !== "feelz" && <StatCard label="paid sessions" value={String(summary.range.paidAppointmentCount)} />}
              {segment !== "feelz" && <StatCard label="new appointments" value={String(summary.range.newAppointments)} />}
              {segment !== "counselling" && <StatCard label="new business leads" value={String(summary.range.newBusinessLeads)} />}
              {segment !== "counselling" && (
                <StatCard label="new feelz preorders" value={String(summary.range.newFeelzPreorders)} href="/admin/feelz-preorders" />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {segment !== "counselling" && (
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
            )}

            {segment !== "feelz" && (
              <div className="rounded-2xl border border-ink/15 bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">appointments by status — {rangeLabel}</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {Object.entries(summary.range.appointmentsByStatus).map(([status, count]) => (
                    <li key={status} className="flex items-center justify-between">
                      <span className="text-ink/70">{APPOINTMENT_STATUS_LABELS[status] ?? status}</span>
                      <span className="font-medium text-ink">{count}</span>
                    </li>
                  ))}
                  {Object.keys(summary.range.appointmentsByStatus).length === 0 && (
                    <li className="text-ink/50">No appointments in this window.</li>
                  )}
                </ul>
              </div>
            )}

            {segment === "combined" && (
              <div className="rounded-2xl border border-ink/15 bg-white p-5 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">other — {rangeLabel}</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-ink/70">new newsletter subscribers</span>
                    <span className="font-medium text-ink">{summary.range.newNewsletterSubscribers}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-ink/15 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">
              revenue by day — {rangeLabel}{" "}
              {segment === "feelz" ? "(feelz orders only)" : segment === "counselling" ? "(counselling sessions only)" : "(feelz orders + counselling sessions)"}
            </p>
            {summary.range.dailyRevenue.length === 0 ? (
              <p className="mt-3 text-sm text-ink/50">No paid orders in this window yet.</p>
            ) : (
              <div className="mt-4 flex h-32 items-end gap-1">
                {summary.range.dailyRevenue.map((day) => (
                  <div key={day.date} className="group relative flex-1">
                    <div
                      className="w-full rounded-t bg-ink transition-opacity group-hover:opacity-70"
                      style={{ height: `${Math.max(4, (segmentRevenue(day) / maxDayRevenue) * 100)}%` }}
                    />
                    <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] text-cream group-hover:block">
                      {day.date}: {formatInr(segmentRevenue(day))}
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
