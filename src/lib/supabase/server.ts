import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// For use inside the OAuth callback route only — this page has no other
// server-rendered routes.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a context where cookies can't be set — harmless.
        }
      },
    },
  });
}
