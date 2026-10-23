import { Check, ExternalLink, PackageCheck, Truck, X } from "lucide-react";
import type { OrderStatusEvent } from "@/lib/api";

type Step = { status: string; label: string; hint: string };

const DELIVERY_STEPS: Step[] = [
  { status: "placed", label: "Order placed", hint: "We've received your order." },
  { status: "confirmed", label: "Confirmed", hint: "Payment received — your order is being prepared." },
  { status: "packed", label: "Packed", hint: "Packed and handed over for shipping." },
  { status: "shipped", label: "Shipped", hint: "On its way with our courier partner." },
  { status: "out_for_delivery", label: "Out for delivery", hint: "Arriving today." },
  { status: "delivered", label: "Delivered", hint: "Enjoy your Feelz!" },
];

const PICKUP_STEPS: Step[] = [
  { status: "placed", label: "Order placed", hint: "We've received your order." },
  { status: "confirmed", label: "Confirmed", hint: "Payment received — the Zostel team is getting it ready." },
  { status: "ready_for_pickup", label: "Ready for pickup", hint: "Show your pickup code at the front desk." },
  { status: "picked_up", label: "Collected", hint: "Enjoy your Feelz!" },
];

// How far along each status is, so a status that isn't one of the shown
// steps (e.g. "packed" on a pickup order) still lights up the right ones.
const RANK: Record<string, number> = {
  placed: 0,
  confirmed: 1,
  packed: 2,
  ready_for_pickup: 3,
  shipped: 3,
  out_for_delivery: 4,
  picked_up: 5,
  delivered: 5,
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

// Vertical step timeline for an order — shared by the order detail screen
// (account / checkout confirmation) and the public /track-order page.
export function OrderTrackingTimeline({
  fulfillmentType,
  status,
  paymentStatus,
  events,
  awbCode,
  trackingUrl,
  estimatedDelivery,
}: {
  fulfillmentType: "delivery" | "takeaway";
  status: string;
  paymentStatus: string;
  events: OrderStatusEvent[];
  awbCode?: string | null;
  trackingUrl?: string | null;
  estimatedDelivery?: string | null;
}) {
  const steps = fulfillmentType === "takeaway" ? PICKUP_STEPS : DELIVERY_STEPS;
  const cancelled = status === "cancelled";
  const lastTime = (s: string) => [...events].reverse().find((e) => e.status === s)?.created_at;

  // For a cancelled order, show progress up to the last real step reached.
  const reachedRank = cancelled
    ? Math.max(0, ...events.filter((e) => e.status !== "cancelled").map((e) => RANK[e.status] ?? 0))
    : RANK[status] ?? 0;
  const currentIndex = steps.reduce((idx, step, i) => ((RANK[step.status] ?? 0) <= reachedRank ? i : idx), 0);
  const shownSteps = cancelled ? steps.slice(0, currentIndex + 1) : steps;

  return (
    <div>
      {paymentStatus === "pending" && !cancelled && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          Waiting for payment confirmation — this updates automatically.
        </p>
      )}

      <ol className="relative">
        {shownSteps.map((step, i) => {
          const done = i < currentIndex || (i === currentIndex && !cancelled && (step.status === "delivered" || step.status === "picked_up"));
          const current = i === currentIndex && !done && !cancelled;
          const reached = i <= currentIndex;
          const when = lastTime(step.status);
          const isLast = i === shownSteps.length - 1 && !cancelled;
          return (
            <li key={step.status} className="relative flex gap-3.5 pb-6 last:pb-0">
              {!isLast && (
                <span
                  className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 ${i < currentIndex ? "bg-brand" : "bg-ink/10"}`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                  done
                    ? "border-brand bg-brand text-white"
                    : current
                      ? "border-brand bg-white text-brand shadow-[0_0_0_4px_rgba(152,97,120,0.15)]"
                      : "border-ink/15 bg-white text-ink/30"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : <span className="h-2 w-2 rounded-full bg-current" />}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={`text-sm font-semibold ${reached ? "text-brand-navy" : "text-ink/40"}`}>
                  {step.label}
                  {current && <span className="ml-2 rounded-full bg-[#f6eef2] px-2 py-0.5 text-[10px] font-bold text-brand">Now</span>}
                </p>
                {when && <p className="text-[11px] text-[#8992a0]">{formatWhen(when)}</p>}
                {current && <p className="mt-0.5 text-xs text-[#718096]">{step.hint}</p>}
              </div>
            </li>
          );
        })}

        {cancelled && (
          <li className="relative flex gap-3.5">
            <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-red-500 bg-red-500 text-white">
              <X className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-semibold text-red-700">Cancelled</p>
              {lastTime("cancelled") && <p className="text-[11px] text-[#8992a0]">{formatWhen(lastTime("cancelled")!)}</p>}
              <p className="mt-0.5 text-xs text-[#718096]">If you were charged, the refund goes back to your original payment method.</p>
            </div>
          </li>
        )}
      </ol>

      {fulfillmentType === "delivery" && !cancelled && (estimatedDelivery || awbCode || trackingUrl) && (
        <div className="mt-5 rounded-xl border border-[#eee4e9] bg-[#faf8f9] p-3.5 text-xs">
          {estimatedDelivery && (
            <p className="flex items-center gap-2 text-[#5e6b7f]">
              <PackageCheck className="h-4 w-4 text-brand" aria-hidden />
              Estimated delivery: <span className="font-semibold text-brand-navy">{estimatedDelivery}</span>
            </p>
          )}
          {awbCode && (
            <p className="mt-1.5 flex items-center gap-2 text-[#5e6b7f]">
              <Truck className="h-4 w-4 text-brand" aria-hidden />
              Courier tracking number (AWB): <span className="font-semibold text-brand-navy">{awbCode}</span>
            </p>
          )}
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="pill-btn mt-3 inline-flex !py-2 text-xs"
            >
              Track with courier
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
