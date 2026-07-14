import { NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// Pinged daily by Vercel Cron (see vercel.json) purely to generate API
// activity against Supabase. Free-tier projects auto-pause after 7 days
// with none — this keeps that clock from ever running out, well inside
// the window, so the site doesn't silently go down until someone notices
// and manually restores it from the Supabase dashboard.
//
// A cheap, public, read-only query against an RLS-open table is enough —
// nothing here needs to succeed for the ping to have done its job, only
// to have been attempted.
export async function GET() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  });
  return NextResponse.json({ pinged: true, supabaseStatus: res.status });
}
