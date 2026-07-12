import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only ever redirect back into this same site — a same-origin relative
// path is required, so a crafted returnTo can't turn this into an open
// redirect off Supabase's OAuth flow.
function safeReturnTo(searchParams: URLSearchParams): string {
  const returnTo = searchParams.get("returnTo");
  return returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
}

// Return leg of the Supabase OAuth flow (Google) — exchanges the code for
// a session server-side, then sends the browser back to wherever the
// sign-in was initiated from (?returnTo=, set by AuthContext.signInWithGoogle).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnTo = safeReturnTo(searchParams);

  if (code) {
    const sb = await createClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${returnTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth&returnTo=${encodeURIComponent(returnTo)}`);
}
