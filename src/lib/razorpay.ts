"use client";

// Checkout.js loader + open helper — presentation/DOM concern (loading an
// external script, opening a modal), kept separate from lib/api.ts which
// only creates the order server-side.
const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout can only load in the browser"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });

  return scriptLoadPromise;
}

export type OpenRazorpayCheckoutArgs = {
  keyId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  name: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss: () => void;
};

// On success this only means Razorpay accepted the payment client-side —
// the order is NOT confirmed yet. The caller should show a "pending
// confirmation" state and wait for the payment-webhook Edge Function to
// flip the order's status.
export async function openRazorpayCheckout(args: OpenRazorpayCheckoutArgs): Promise<void> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay checkout script loaded but window.Razorpay is unavailable");
  }

  const razorpay = new window.Razorpay({
    key: args.keyId,
    amount: args.amount,
    currency: args.currency,
    order_id: args.razorpayOrderId,
    name: args.name,
    prefill: args.prefill,
    handler: args.onSuccess,
    modal: { ondismiss: args.onDismiss },
  });

  razorpay.open();
}
