// Replaces a direct `sb.from("business_leads").insert(...)` from the
// browser (see migration 20260814020000_lockdown_public_insert_forms.sql
// for why: that was open to anyone with the public anon key, and was
// being actively spammed by a bot hitting the REST API directly, each
// fake row firing trg_notify_business_lead and flooding the team inbox).
//
// Two checks before a row is ever written, no third-party CAPTCHA needed:
//   - honeypot: `website` is a field real users never see or fill in
//     (hidden via CSS in BusinessLeadForm.tsx). A bot that renders the
//     page and blindly fills every input trips this. Rejected silently —
//     same success-shaped response as a real submission, so a bot can't
//     tell it was caught and adjust.
//   - rate limit: max 3 submissions per IP per rolling hour, tracked in
//     form_submission_log. Catches a bot that skips the page entirely and
//     posts straight to this function.
// Neither is bulletproof against a determined, distributed attacker, but
// both are free, need no external account, and stop the current bot.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

type RequestBody = {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  message?: string;
  website?: string; // honeypot — must stay empty
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  const { company_name, contact_name, email, phone, message, website } = body ?? ({} as RequestBody);

  // Honeypot tripped — respond exactly like a success so the bot has no
  // signal to react to, just skip the actual write.
  if (website && website.trim() !== "") {
    return jsonResponse({ ok: true });
  }

  if (!company_name?.trim() || !contact_name?.trim() || !email?.trim()) {
    return jsonResponse({ error: "company_name, contact_name and email are required" }, 400);
  }
  if (!isValidEmail(email)) {
    return jsonResponse({ error: "Enter a valid email" }, 400);
  }

  const sb = serviceRoleClient();

  // Supabase's edge runtime sets x-forwarded-for on every request; "unknown"
  // is a shared fallback bucket if it's ever missing, not a bypass.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error: countError } = await sb
    .from("form_submission_log")
    .select("id", { count: "exact", head: true })
    .eq("form", "business_lead")
    .eq("ip_address", ip)
    .gte("created_at", since);
  if (countError) return jsonResponse({ error: "Failed to submit — please try again" }, 500);
  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return jsonResponse({ error: "Too many submissions — please try again later" }, 429);
  }

  const { error: insertError } = await sb.from("business_leads").insert({
    company_name: company_name.trim(),
    contact_name: contact_name.trim(),
    email: email.trim(),
    phone: phone?.trim() || null,
    message: message?.trim() || null,
  });
  if (insertError) return jsonResponse({ error: "Failed to submit — please try again" }, 500);

  await sb.from("form_submission_log").insert({ form: "business_lead", ip_address: ip });

  return jsonResponse({ ok: true });
});
