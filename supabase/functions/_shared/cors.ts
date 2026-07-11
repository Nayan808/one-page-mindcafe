// Shared CORS headers for Edge Functions called directly from the browser
// (create-order, create-razorpay-order, merge-guest-cart, staff-pickup).
// Webhook endpoints (payment-webhook, shiprocket-tracking-webhook,
// order-status-notifier, create-shiprocket-shipment) are called
// server-to-server and don't need these, but including them is harmless.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
