// Triggered by trg_notify_business_lead (setup.sql) on `business_leads`
// INSERT — alerts the admin/sales inbox whenever someone submits the
// /business contact form, since these currently just sit in
// /admin/business-leads until someone happens to check.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { sendEmail } from "../_shared/email.ts";
import { jsonResponse } from "../_shared/cors.ts";

type BusinessLeadRecord = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  message: string | null;
};

type DbWebhookPayload = {
  type: "INSERT";
  table: string;
  record: BusinessLeadRecord;
};

Deno.serve(async (req) => {
  const payload = (await req.json()) as DbWebhookPayload;
  const { record } = payload;
  if (!record) return jsonResponse({ skipped: true });

  const sb = serviceRoleClient();
  const { data: setting } = await sb.from("site_settings").select("value").eq("key", "admin_notification_email").maybeSingle();
  const adminEmail = (setting?.value as string) || "team@mindcafe.app";

  const lines = [
    `New business lead: ${record.company_name}`,
    `Contact: ${record.contact_name} <${record.email}>${record.phone ? ` · ${record.phone}` : ""}`,
    record.message ? `Message: ${record.message}` : null,
    "Check /admin/business-leads.",
  ].filter(Boolean);

  await sendEmail(adminEmail, `New business lead: ${record.company_name}`, lines.join("\n"));
  return jsonResponse({ sent: true });
});
