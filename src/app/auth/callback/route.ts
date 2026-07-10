import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Return leg of the Supabase OAuth flow (Google) — exchanges the code for
// a session server-side, then sends the browser back to the one page.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const sb = await createClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(origin);
    }
  }

  return NextResponse.redirect(`${origin}/?error=oauth`);
}
