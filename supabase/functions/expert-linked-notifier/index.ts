// Triggered by trg_notify_expert_linked (setup.sql) on `experts` UPDATE,
// only when profile_id moves from null to a real value — i.e. a
// super_admin used "link this account" on an existing signed-up user
// (the sibling path to admin-create-expert, see /admin/experts). Tells
// that person their account just gained expert access.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { sendEmail } from "../_shared/email.ts";
import { jsonResponse } from "../_shared/cors.ts";

type ExpertRecord = { id: string; name: string; profile_id: string | null };
type DbWebhookPayload = { type: "UPDATE"; table: string; record: ExpertRecord };

Deno.serve(async (req) => {
  const payload = (await req.json()) as DbWebhookPayload;
  const { record } = payload;
  if (!record?.profile_id) return jsonResponse({ skipped: true });

  const sb = serviceRoleClient();
  const { data: authUser } = await sb.auth.admin.getUserById(record.profile_id);
  const email = authUser?.user?.email;
  if (!email) return jsonResponse({ skipped: true, reason: "no email on this account" });

  await sendEmail(
    email,
    "You're now listed as a MindCafe expert",
    `Hi ${record.name}, your account now has expert access on MindCafe. Sign in at /expert/login with the same email and password you already use.`,
  );
  return jsonResponse({ sent: true });
});
