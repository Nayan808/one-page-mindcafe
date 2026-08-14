// Triggered by trg_notify_contact_message (see migration
// 20260814010000_contact_message_notifier.sql) on `contact_messages`
// INSERT — alerts the team inbox whenever someone submits the general
// "contact us" form, since these previously just sat in
// /admin/contact-messages until someone happened to check.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { sendEmail, renderEmail, SITE_URL } from "../_shared/email.ts";
import { jsonResponse } from "../_shared/cors.ts";

type ContactMessageRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
};

type DbWebhookPayload = {
  type: "INSERT";
  table: string;
  record: ContactMessageRecord;
};

Deno.serve(async (req) => {
  const payload = (await req.json()) as DbWebhookPayload;
  const { record } = payload;
  if (!record) return jsonResponse({ skipped: true });

  const sb = serviceRoleClient();
  const { data: setting } = await sb.from("site_settings").select("value").eq("key", "admin_notification_email").maybeSingle();
  const adminEmail = (setting?.value as string) || "team@mindcafe.app";

  const paragraphs = [
    `From: ${record.name} <${record.email}>${record.phone ? ` · ${record.phone}` : ""}`,
    ...(record.message ? [`Message: ${record.message}`] : []),
  ];

  const { text, html } = renderEmail({
    heading: `New contact message from ${record.name}`,
    paragraphs,
    cta: { label: "view in admin", url: `${SITE_URL}/admin/contact-messages` },
  });
  await sendEmail(adminEmail, `New contact message from ${record.name}`, text, html);
  return jsonResponse({ sent: true });
});
