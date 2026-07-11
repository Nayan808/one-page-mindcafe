"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useOrderTracking } from "@/lib/query/hooks";
import { formatInr } from "@/lib/utils";

export const STATUS_LABELS: Record<string, string> = {
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

// Shown in place of the checkout panel once payment is accepted. Polls +
// subscribes to Realtime so it flips from "pending" once the
// payment-webhook confirms, and picks up Shiprocket tracking once it's
// created — no navigation away from the one page.
export function OrderConfirmation({
  orderId,
  onStartNewOrder,
  backLabel = "place another order",
}: {
  orderId: string;
  onStartNewOrder: () => void;
  backLabel?: string;
}) {
  const { data: order, isLoading } = useOrderTracking(orderId);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!order?.pickup_code) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(order.pickup_code, { margin: 1, width: 220 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [order?.pickup_code]);

  if (isLoading) return <p className="text-sm text-ink/60">Loading order…</p>;
  if (!order) return <p className="text-sm text-ink/60">Order not found.</p>;

  const isPendingConfirmation = order.payment_status === "pending";
  const hasTracking = order.fulfillment_type === "delivery" && (order.awb_code || order.tracking_url);
  const isPickup = order.fulfillment_type === "takeaway";
  const isCollected = order.status === "picked_up";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="font-display text-3xl font-bold lowercase">order {order.order_number}</h2>

      {isPendingConfirmation && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
          Confirming your payment — this updates automatically, no need to refresh.
        </p>
      )}

      {isPickup && order.pickup_code && (
        <div className="rounded-xl border border-ink/15 bg-white p-5 text-center">
          {isCollected ? (
            <p className="text-sm font-medium text-emerald-700">Collected — thanks!</p>
          ) : (
            <>
              <p className="text-sm text-ink/60">Show this at the Zostel front desk to collect your order</p>
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt={`QR code for pickup code ${order.pickup_code}`} className="mx-auto mt-3 h-44 w-44" />
              )}
              <p className="font-display mt-3 text-3xl font-bold tracking-[0.3em]">{order.pickup_code}</p>
              <p className="mt-1 text-xs text-ink/50">Also sent to you by email{order.guest_phone ? " and SMS" : ""}.</p>
            </>
          )}
        </div>
      )}

      <div className="rounded-xl border border-ink/15 bg-white p-4 text-sm">
        <div className="flex justify-between">
          <span>Status</span>
          <span className="font-medium capitalize">{STATUS_LABELS[order.status] ?? order.status}</span>
        </div>
        <div className="flex justify-between">
          <span>Fulfillment</span>
          <span className="capitalize">{order.fulfillment_type === "takeaway" ? "Takeaway (Zostel)" : "Delivery"}</span>
        </div>
        <div className="flex justify-between">
          <span>Payment</span>
          <span className="capitalize">{order.payment_status}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 font-medium">
          <span>Total</span>
          <span>{formatInr(order.total)}</span>
        </div>
      </div>

      {hasTracking && (
        <div className="rounded-xl border border-ink/15 bg-white p-4 text-sm">
          <p className="font-medium text-ink">Shipment tracking</p>
          {order.awb_code && <p className="text-ink/60">AWB: {order.awb_code}</p>}
          {order.tracking_url && (
            <a href={order.tracking_url} target="_blank" rel="noreferrer" className="text-ink underline">
              Track shipment
            </a>
          )}
        </div>
      )}

      <button type="button" onClick={onStartNewOrder} className="pill-btn-outline w-full">
        {backLabel}
      </button>
    </div>
  );
}
