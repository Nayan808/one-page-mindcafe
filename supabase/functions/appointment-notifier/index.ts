// Triggered by a Supabase Database Webhook on `appointments` INSERT and
// UPDATE (configure in the dashboard: Database -> Webhooks -> appointments
// -> INSERT, UPDATE -> this function's URL). Mirrors order-status-notifier:
// email only (no SMS — same DLT-registration blocker that took SMS out of
// the order-notification path applies here too), service-role client,
// only acts on genuine status changes for updates.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { jsonResponse } from "../_shared/cors.ts";

const STATUS_MESSAGES: Record<string, string> = {
  pending: "We've received your booking request and will confirm shortly.",
  confirmed: "Your session is confirmed!",
  completed: "Thanks for attending your session.",
  cancelled: "Your session was cancelled.",
};

type DbWebhookPayload = {
  type: "INSERT" | "UPDATE";
  table: string;
  record: { id: string; user_id: string; status: string; therapy_category: string; scheduled_at: string | null };
  old_record: { status: string } | null;
};

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = Deno.env.get("EMAIL_PROVIDER_API_KEY");
  if (!apiKey) {
    console.warn("EMAIL_PROVIDER_API_KEY not set — skipping notification email");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "MindCafe <orders@mindcafe.app>", to, subject, text }),
  });

  if (!res.ok) console.error("Email send failed", await res.text());
}

Deno.serve(async (req) => {
  const payload = (await req.json()) as DbWebhookPayload;
  const { type, record, old_record } = payload;

  if (!record) return jsonResponse({ skipped: true });
  if (type === "UPDATE" && record.status === old_record?.status) {
    return jsonResponse({ skipped: true, reason: "status unchanged" });
  }

  const message = STATUS_MESSAGES[record.status];
  if (!message) return jsonResponse({ skipped: true });

  const sb = serviceRoleClient();
  const { data: authUser } = await sb.auth.admin.getUserById(record.user_id);
  const email = authUser?.user?.email;
  if (!email) return jsonResponse({ skipped: true, reason: "no email on this account" });

  const categoryLabel = record.therapy_category.replace("-", " & ");
  const whenNote = record.scheduled_at
    ? ` Requested time: ${new Date(record.scheduled_at).toLocaleString("en-IN")}.`
    : "";
  const fullMessage = `Counselling booking (${categoryLabel}): ${message}${whenNote}`;

  await sendEmail(email, `Your counselling booking: ${message}`, fullMessage);
  return jsonResponse({ sent: true });
});
