// Triggered by trg_notify_newsletter (setup.sql) on
// `newsletter_subscribers` INSERT — a plain welcome email. No
// confirmation-link flow exists yet (subscribeToNewsletter in lib/api.ts
// always inserts confirmed: false with nothing that ever flips it true),
// so this is just an acknowledgment, not a double-opt-in confirmation.
import { sendEmail } from "../_shared/email.ts";
import { jsonResponse } from "../_shared/cors.ts";

type SubscriberRecord = { id: string; email: string };
type DbWebhookPayload = { type: "INSERT"; table: string; record: SubscriberRecord };

Deno.serve(async (req) => {
  const payload = (await req.json()) as DbWebhookPayload;
  const { record } = payload;
  if (!record?.email) return jsonResponse({ skipped: true });

  await sendEmail(
    record.email,
    "You're on the list — MindCafe",
    "Thanks for subscribing to MindCafe. We'll send you updates on feelz, counselling, and the occasional offer — nothing more.",
  );
  return jsonResponse({ sent: true });
});
