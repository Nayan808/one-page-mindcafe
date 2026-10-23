// Public endpoint behind the shareable /feedback page. Writes to
// public.feedback with the service role — the table has no anon insert
// access (see 20261023000000_feedback.sql), same pattern and same two
// checks as submit-business-lead:
//   - honeypot: `website` is hidden from real users; if it's filled in,
//     respond like a success and write nothing.
//   - rate limit: max 5 submissions per IP per rolling hour, tracked in
//     form_submission_log.
//
// Self-contained (no ../_shared imports) so it can also be deployed by
// pasting this one file into the Supabase dashboard editor.
import { createClient } from "npm:@supabase/supabase-js@2";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const TOPICS = ["feelz", "counselling", "website", "other"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

type RequestBody = {
  name?: string;
  email?: string;
  phone?: string;
  topic?: string;
  product?: string;
  rating?: number;
  message?: string;
  can_publish?: boolean;
  source?: string;
  website?: string; // honeypot — must stay empty
};

const clip = (value: string | undefined, max: number) => value?.trim().slice(0, max) || null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (body?.website && body.website.trim() !== "") return jsonResponse({ ok: true });

  const name = clip(body?.name, 120);
  const message = clip(body?.message, 4000);
  const rating = Number(body?.rating);
  const email = clip(body?.email, 200);
  if (!name || !message) return jsonResponse({ error: "Please add your name and your feedback" }, 400);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return jsonResponse({ error: "Please choose a rating" }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ error: "Enter a valid email" }, 400);
  const topic = TOPICS.includes(body?.topic ?? "") ? body!.topic! : "other";

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error: countError } = await sb
    .from("form_submission_log")
    .select("id", { count: "exact", head: true })
    .eq("form", "feedback")
    .eq("ip_address", ip)
    .gte("created_at", since);
  if (countError) return jsonResponse({ error: "Failed to submit — please try again" }, 500);
  if ((count ?? 0) >= RATE_LIMIT_MAX) return jsonResponse({ error: "Too many submissions — please try again later" }, 429);

  const { error: insertError } = await sb.from("feedback").insert({
    name,
    email,
    phone: clip(body?.phone, 30),
    topic,
    product: topic === "feelz" ? clip(body?.product, 60) : null,
    rating,
    message,
    can_publish: body?.can_publish === true,
    source: clip(body?.source, 80),
  });
  if (insertError) return jsonResponse({ error: "Failed to submit — please try again" }, 500);

  await sb.from("form_submission_log").insert({ form: "feedback", ip_address: ip });

  return jsonResponse({ ok: true });
});
