// Shared by every notifier Edge Function. Swap the fetch call below for a
// different provider (SendGrid, Postmark, SES, ...) in this one place —
// every function that sends email goes through here.
//
// Silently no-ops (logs a warning, doesn't throw) when EMAIL_PROVIDER_API_KEY
// isn't set, so a missing secret never turns into a failed order/booking —
// notifications are best-effort, not load-bearing.
const FROM_ADDRESS = "MindCafe <notifications@mindcafe.app>";

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = Deno.env.get("EMAIL_PROVIDER_API_KEY");
  if (!apiKey) {
    console.warn("EMAIL_PROVIDER_API_KEY not set — skipping notification email to", to);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, text }),
  });

  if (!res.ok) console.error("Email send failed", await res.text());
}
