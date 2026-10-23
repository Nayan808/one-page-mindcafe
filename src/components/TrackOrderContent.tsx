"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { trackOrder, type TrackedOrder } from "@/lib/api";
import { formatInr } from "@/lib/utils";
import { OrderTrackingTimeline } from "@/components/OrderTrackingTimeline";

const CARD = "rounded-[18px] border border-[#eee4e9] bg-white p-6 shadow-[0_14px_36px_rgba(45,65,96,0.08)] sm:p-8";
const LABEL = "mb-1.5 block text-xs font-semibold text-brand-navy";

export function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") ?? "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function lookUp() {
    if (!orderNumber.trim()) return setError("Enter your order number.");
    if (phone.replace(/\D/g, "").length < 10) return setError("Enter the 10-digit phone number used on the order.");
    setError(null);
    setIsLoading(true);
    try {
      const result = await trackOrder(createClient(), orderNumber, phone);
      setOrder(result);
      if (!result) setError("We couldn't find an order with that number and phone. Check both and try again.");
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-[#f7f5f6] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand">Feelz orders</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.02em] text-brand-navy sm:text-4xl">
            Track your order
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#718096]">
            Enter the order number from your confirmation and the phone number you ordered with.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void lookUp();
          }}
          className={`${CARD} space-y-4`}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="order-number" className={LABEL}>
                Order number
              </label>
              <input
                id="order-number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. MC-000012"
                autoCapitalize="characters"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="phone" className={LABEL}>
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                autoComplete="tel"
                className="input"
              />
            </div>
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={isLoading} className="pill-btn w-full py-3">
            <Search className="h-4 w-4" aria-hidden />
            {isLoading ? "Looking up…" : "Track order"}
          </button>
          <p className="text-center text-[11px] text-[#8992a0]">
            Signed in? Your orders are also under{" "}
            <Link href="/account" className="font-semibold text-brand hover:underline">
              Your account
            </Link>
            .
          </p>
        </form>

        {order && (
          <div className={`${CARD} mt-5`}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand">
                  {order.fulfillment_type === "takeaway" ? `Pickup · ${order.pickup_location ?? "Zostel"}` : "Home delivery"}
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-brand-navy">
                  Order {order.order_number}
                </h2>
                <p className="mt-0.5 text-xs text-[#718096]">
                  Placed {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                  {formatInr(order.total)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void lookUp()}
                disabled={isLoading}
                aria-label="Refresh status"
                className="rounded-full border border-[#eee4e9] p-2 text-[#68768b] hover:text-brand"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
              </button>
            </div>

            {order.items.length > 0 && (
              <ul className="mb-5 flex flex-wrap gap-1.5">
                {order.items.map((item) => (
                  <li key={item.name} className="rounded-full bg-[#f6eef2] px-2.5 py-1 text-[11px] font-semibold text-brand">
                    {item.quantity} × {item.name}
                  </li>
                ))}
              </ul>
            )}

            <OrderTrackingTimeline
              fulfillmentType={order.fulfillment_type}
              status={order.status}
              paymentStatus={order.payment_status}
              events={order.events}
              awbCode={order.awb_code}
              trackingUrl={order.tracking_url}
              estimatedDelivery={order.estimated_delivery}
            />

            <p className="mt-6 border-t border-[#eee4e9] pt-4 text-[11px] text-[#8992a0]">
              Something not right? Write to{" "}
              <a href="mailto:feelz@mindcafe.app" className="font-semibold text-brand hover:underline">
                feelz@mindcafe.app
              </a>{" "}
              with your order number.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
