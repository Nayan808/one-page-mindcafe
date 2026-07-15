// Triggered by the trg_notify_appointment DB trigger (setup.sql,
// pg_net-based — see notify_webhook()) on `appointments` INSERT and
// UPDATE. Sends up to two emails per event: one to the customer (as
// before), and — new — one to the assigned expert, if there is one and
// they have a reachable email.
//
// An expert's email resolves two ways: via their linked login account
// (experts.profile_id -> auth.users.email) if they have one, or via
// experts.notification_email as a fallback for a directory-only listing
// with no login access. If neither is set, the expert side is silently
// skipped — the customer email still goes out either way.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { sendEmail } from "../_shared/email.ts";
import { jsonResponse } from "../_shared/cors.ts";

const CUSTOMER_STATUS_MESSAGES: Record<string, string> = {
  pending: "We've received your booking request and will confirm shortly.",
  confirmed: "Your session is confirmed!",
  completed: "Thanks for attending your session.",
  cancelled: "Your session was cancelled.",
};

const EXPERT_STATUS_MESSAGES: Record<string, string> = {
  pending: "A new session was booked with you — it's awaiting your confirmation.",
  confirmed: "A session on your calendar was confirmed.",
  completed: "A session was marked completed.",
  cancelled: "A session on your calendar was cancelled.",
};

type AppointmentRecord = {
  id: string;
  user_id: string;
  expert_id: string | null;
  status: string;
  therapy_category: string;
  scheduled_at: string | null;
};

type DbWebhookPayload = {
  type: "INSERT" | "UPDATE";
  table: string;
  record: AppointmentRecord;
  old_record: AppointmentRecord | null;
};

Deno.serve(async (req) => {
  const payload = (await req.json()) as DbWebhookPayload;
  const { type, record, old_record } = payload;

  if (!record) return jsonResponse({ skipped: true });
  if (type === "UPDATE" && record.status === old_record?.status) {
    return jsonResponse({ skipped: true, reason: "status unchanged" });
  }

  const sb = serviceRoleClient();
  const categoryLabel = record.therapy_category.replace("-", " & ");
  const whenNote = record.scheduled_at ? ` Requested time: ${new Date(record.scheduled_at).toLocaleString("en-IN")}.` : "";
  const reviewNote = record.status === "completed" ? " We'd love your feedback — reply to this email or leave a review at /reviews." : "";

  let sentAny = false;

  const customerMessage = CUSTOMER_STATUS_MESSAGES[record.status];
  if (customerMessage) {
    const { data: authUser } = await sb.auth.admin.getUserById(record.user_id);
    const email = authUser?.user?.email;
    if (email) {
      await sendEmail(
        email,
        `Your counselling booking: ${customerMessage}`,
        `Counselling booking (${categoryLabel}): ${customerMessage}${whenNote}${reviewNote}`,
      );
      sentAny = true;
    }
  }

  const expertMessage = EXPERT_STATUS_MESSAGES[record.status];
  if (expertMessage && record.expert_id) {
    const { data: expert } = await sb
      .from("experts")
      .select("name, profile_id, notification_email")
      .eq("id", record.expert_id)
      .maybeSingle();

    if (expert) {
      let expertEmail: string | null = expert.notification_email;
      if (expert.profile_id) {
        const { data: authUser } = await sb.auth.admin.getUserById(expert.profile_id);
        expertEmail = authUser?.user?.email ?? expertEmail;
      }

      if (expertEmail) {
        await sendEmail(
          expertEmail,
          `Booking update: ${expertMessage}`,
          `${expertMessage} Category: ${categoryLabel}.${whenNote} Check /expert/dashboard for details.`,
        );
        sentAny = true;
      }
    }
  }

  return jsonResponse(sentAny ? { sent: true } : { skipped: true, reason: "no reachable email" });
});
