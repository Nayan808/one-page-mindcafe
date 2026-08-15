// Called directly from checkout (client-side, both guest and signed-in —
// same as create-order) to check whether Shiprocket can actually deliver to
// a given pincode, and at what price. Replaces the old manually-curated
// serviceable_pincodes table lookup with Shiprocket's real courier network,
// which covers virtually all of India rather than a hand-picked few cities.
// create-order re-runs this same check server-side before finalizing an
// order — this function is for the live checkout-time estimate only, never
// the source of truth for what a customer is actually charged.
//
// Fully self-contained (no _shared/ imports) — this function was created
// via the dashboard's "new function" flow, which deploys each function in
// isolation and can't reach the _shared/ folder other functions (deployed
// together via the CLI) bundle in. Duplicating this little bit of setup
// code is the price of that deploy path.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

type RequestBody = {
  pincode: string;
  items: { variant_id: string; quantity: number }[];
};

const FALLBACK_WEIGHT_GRAMS = 500;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getShiprocketToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: Deno.env.get("SHIPROCKET_EMAIL"),
      password: Deno.env.get("SHIPROCKET_PASSWORD"),
    }),
  });

  if (!res.ok) throw new Error(`Shiprocket auth failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = { token: data.token, expiresAt: Date.now() + 60 * 60 * 1000 };
  return cachedToken.token;
}

type ServiceabilityResult =
  | { serviceable: true; deliveryFee: number; courierName: string; etd: string | null }
  | { serviceable: false };

async function checkServiceability(deliveryPincode: string, weightKg: number): Promise<ServiceabilityResult> {
  const pickupPincode = Deno.env.get("SHIPROCKET_PICKUP_PINCODE");
  const token = await getShiprocketToken();

  const url = new URL("https://apiv2.shiprocket.in/v1/external/courier/serviceability/");
  url.searchParams.set("pickup_postcode", pickupPincode ?? "");
  url.searchParams.set("delivery_postcode", deliveryPincode);
  url.searchParams.set("weight", String(weightKg));
  url.searchParams.set("cod", "0");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Shiprocket serviceability check failed: ${res.status} ${await res.text()}`);

  const body = await res.json();
  const couriers = body?.data?.available_courier_companies as
    | Array<{ rate: number; courier_name: string; etd?: string }>
    | undefined;

  if (!couriers || couriers.length === 0) return { serviceable: false };

  const cheapest = couriers.reduce((min, c) => (c.rate < min.rate ? c : min), couriers[0]);
  return {
    serviceable: true,
    deliveryFee: Number(cheapest.rate),
    courierName: cheapest.courier_name,
    etd: cheapest.etd ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { pincode, items } = body ?? ({} as RequestBody);
  if (!pincode || !Array.isArray(items) || items.length === 0) {
    return jsonResponse({ error: "pincode and a non-empty items array are required" }, 400);
  }

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const variantIds = items.map((i) => i.variant_id);
  const { data: variants, error } = await sb.from("product_variants").select("id, weight_grams").in("id", variantIds);

  if (error || !variants) return jsonResponse({ error: "Failed to look up products" }, 500);

  const weightByVariant = new Map(variants.map((v) => [v.id, v.weight_grams as number | null]));
  let totalWeightGrams = 0;
  for (const item of items) {
    const weight = weightByVariant.get(item.variant_id) ?? FALLBACK_WEIGHT_GRAMS;
    totalWeightGrams += weight * item.quantity;
  }

  try {
    const result = await checkServiceability(pincode, totalWeightGrams / 1000);
    return jsonResponse(result);
  } catch (err) {
    console.error("check-pincode-serviceability: Shiprocket check failed", err);
    return jsonResponse({ error: "Couldn't check delivery availability right now — please try again" }, 502);
  }
});
