// Admin-only: lists every account with its email (profiles doesn't store
// email — that only lives in auth.users, which the client SDK can't query
// directly). Read-only; actually changing a role is a direct table update
// from the frontend, enforced by prevent_role_self_escalation() to
// require super_admin — this function just needs is_admin() to view.
import { serviceRoleClient, userScopedClient } from "../_shared/supabaseClients.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const callerClient = userScopedClient(req);
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();
  if (!caller) return jsonResponse({ error: "Not signed in" }, 401);

  const { data: callerProfile } = await callerClient.from("profiles").select("role").eq("id", caller.id).maybeSingle();
  if (callerProfile?.role !== "admin" && callerProfile?.role !== "super_admin") {
    return jsonResponse({ error: "Admin access required" }, 403);
  }

  const sb = serviceRoleClient();

  const { data: profiles, error: profilesError } = await sb
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false });
  if (profilesError) return jsonResponse({ error: profilesError.message }, 500);

  // auth.admin.listUsers is paginated (default 50/page) — walk pages until
  // exhausted. Fine at this project's scale; revisit with a bigger user
  // base.
  const emailById = new Map<string, string | null>();
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return jsonResponse({ error: error.message }, 500);
    for (const u of data.users) emailById.set(u.id, u.email ?? null);
    if (data.users.length < 1000) break;
    page += 1;
  }

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailById.get(p.id) ?? null,
    full_name: p.full_name,
    role: p.role,
    created_at: p.created_at,
  }));

  return jsonResponse({ users });
});
