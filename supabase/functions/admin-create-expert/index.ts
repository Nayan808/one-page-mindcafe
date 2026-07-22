// Admin-only: creates a real login-capable expert account (auth user +
// profiles.role='expert' + an experts row), the one path the experts
// table's own schema comment always assumed would exist. Never a direct
// client insert into experts/profiles, even by an admin — this function is
// the single choke point so the role-escalation and account-creation
// pieces stay consistent.
//
// Authorization: the caller's own JWT is checked against their own
// profiles row (RLS-safe self-read) to confirm role is 'admin' or
// 'super_admin' BEFORE any service-role operation runs — a non-admin
// caller never reaches the privileged path below. Creating a THIRD
// PARTY'S expert account doesn't touch the caller's own role, so plain
// admin is enough here — this is distinct from changing someone's role
// directly, which prevent_role_self_escalation() reserves for
// super_admin only.
import { serviceRoleClient, userScopedClient } from "../_shared/supabaseClients.ts";
import { sendEmail, renderEmail, SITE_URL } from "../_shared/email.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type RequestBody = {
  email: string;
  password: string;
  name: string;
  photo_url?: string;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const callerClient = userScopedClient(req);
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();
  if (!caller) return jsonResponse({ error: "Not signed in" }, 401);

  const { data: callerProfile } = await callerClient.from("profiles").select("role").eq("id", caller.id).maybeSingle();
  if (callerProfile?.role !== "admin" && callerProfile?.role !== "super_admin") {
    return jsonResponse({ error: "Admin access required" }, 403);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body.email || !body.password || !body.name) {
    return jsonResponse({ error: "email, password, and name are required" }, 400);
  }

  const sb = serviceRoleClient();

  const { data: created, error: createError } = await sb.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: body.name },
  });
  if (createError || !created.user) {
    return jsonResponse({ error: createError?.message ?? "Failed to create account" }, 400);
  }

  // handle_new_user() already inserted a profiles row defaulted to
  // role='customer' — bump it to 'expert'. Only service_role can do this
  // (see prevent_role_self_escalation), which is exactly the client we're
  // using here.
  const { error: roleError } = await sb.from("profiles").update({ role: "expert" }).eq("id", created.user.id);
  if (roleError) {
    return jsonResponse({ error: `Account created but role update failed: ${roleError.message}` }, 500);
  }

  const { data: expert, error: expertError } = await sb
    .from("experts")
    .insert({
      profile_id: created.user.id,
      name: body.name,
      photo_url: body.photo_url ?? null,
      bio: body.bio ?? null,
      specialties: body.specialties ?? [],
      certifications: body.certifications ?? [],
    })
    .select("*")
    .single();
  if (expertError) {
    return jsonResponse({ error: `Account created but experts row failed: ${expertError.message}` }, 500);
  }

  // Deliberately no password in this email — it's already displayed once
  // in the admin UI for the admin to share through whatever channel they
  // trust (in person, a call, a secure chat), the same way the account
  // creation flow already works. Email is not a secure transport for a
  // password sitting in an inbox indefinitely.
  const { text, html } = renderEmail({
    heading: "Your MindCafe expert account is ready",
    paragraphs: [
      `Hi ${body.name}, an account has been set up for you as a MindCafe counsellor.`,
      `Sign in with ${body.email} and the password your admin shared with you separately.`,
    ],
    cta: { label: "sign in", url: `${SITE_URL}/expert/login` },
  });
  await sendEmail(body.email, "Your MindCafe expert account is ready", text, html);

  return jsonResponse({ expert, user_id: created.user.id });
});
