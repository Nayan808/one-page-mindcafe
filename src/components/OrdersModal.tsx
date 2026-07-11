"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrders } from "@/lib/query/hooks";
import { Modal } from "@/components/Modal";
import { OrderConfirmation, STATUS_LABELS } from "@/components/OrderConfirmation";
import { formatInr } from "@/lib/utils";

function goToProducts(closeOrders: () => void) {
  closeOrders();
  document.getElementById("mood-picks")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// "Your orders" — a list of everything this account has bought, each
// expandable into the same live-tracking view (status, Shiprocket
// tracking, pickup QR) shown right after checkout.
export function OrdersModal() {
  const { user, isOrdersOpen, closeOrders } = useAuth();
  const { orders, isLoading } = useUserOrders(isOrdersOpen ? (user?.id ?? null) : null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  function handleClose() {
    closeOrders();
    setSelectedOrderId(null);
  }

  return (
    <Modal isOpen={isOrdersOpen} onClose={handleClose} title={selectedOrderId ? "order" : "your orders"}>
      {selectedOrderId ? (
        <OrderConfirmation
          orderId={selectedOrderId}
          onStartNewOrder={() => setSelectedOrderId(null)}
          backLabel="back to orders"
        />
      ) : isLoading ? (
        <p className="text-sm text-ink/60">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-ink/60">No orders yet — anything you buy will show up here.</p>
          <button type="button" onClick={() => goToProducts(closeOrders)} className="pill-btn">
            buy feelz
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setSelectedOrderId(order.id)}
                className="w-full rounded-xl border border-ink/15 bg-white p-3 text-left text-sm transition hover:border-ink/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink">{order.order_number}</span>
                  <span className="text-xs font-medium text-ink/60">{STATUS_LABELS[order.status] ?? order.status}</span>
                </div>
                <p className="mt-1 text-ink/60">
                  {order.order_items
                    .map((item) => `${item.quantity} × ${item.product_variants.products.name}`)
                    .join(", ")}
                </p>
                <div className="mt-1 flex items-center justify-between text-ink/60">
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  <span className="font-medium text-ink">{formatInr(order.total)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
