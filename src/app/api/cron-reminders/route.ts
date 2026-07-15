import { NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// Pinged daily by Vercel Cron (see vercel.json) to run the two
// scheduled (not event-triggered) reminder Edge Functions — there's no
// single DB write to react to for "this has been sitting untouched for a
// while", only the absence of one, so these can't be wired as Database
// Webhooks like the rest of the notification system. Bundled into one
// cron entry (instead of two) to stay within Vercel Hobby's cron job
// limit — /api/keep-alive already uses one.
async function callFunction(name: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  });
  return { name, status: res.status, body: await res.json().catch(() => null) };
}

export async function GET() {
  const results = await Promise.all([callFunction("pickup-reminder"), callFunction("cart-reminder")]);
  return NextResponse.json({ ran: true, results });
}
