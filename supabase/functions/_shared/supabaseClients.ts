import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

// Two client patterns used across these functions:
//
// 1. userScopedClient — forwards the caller's own JWT (from the
//    Authorization header set automatically by supabase.functions.invoke)
//    so RLS applies exactly as it would for a direct table call. This is
//    the least-privilege option — prefer it whenever the operation is
//    something the caller is already allowed to do under RLS (e.g.
//    reading their own order, merging their own cart).
//
// 2. serviceRoleClient — bypasses RLS entirely using the service_role key.
//    Only for operations RLS structurally cannot allow a client to do
//    (creating an auth user, confirming a payment, decrementing stock).
//    Never expose this client's results directly without your own
//    authorization check first.
export function userScopedClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
}

export function serviceRoleClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}
