// Shared by every notifier Edge Function. Swap the fetch call below for a
// different provider (SendGrid, Postmark, SES, ...) in this one place —
// every function that sends email goes through here.
//
// Silently no-ops (logs a warning, doesn't throw) when EMAIL_PROVIDER_API_KEY
// isn't set, so a missing secret never turns into a failed order/booking —
// notifications are best-effort, not load-bearing.
const FROM_ADDRESS = "MindCafe <notifications@mindcafe.app>";

export const SITE_URL = Deno.env.get("SITE_URL") ?? "https://mindcafe.app";

export async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
  const apiKey = Deno.env.get("EMAIL_PROVIDER_API_KEY");
  if (!apiKey) {
    console.warn("EMAIL_PROVIDER_API_KEY not set — skipping notification email to", to);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, text, ...(html ? { html } : {}) }),
  });

  if (!res.ok) console.error("Email send failed", await res.text());
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailBody = {
  heading: string;
  paragraphs: string[];
  cta: { label: string; url: string };
};

// Builds the plain-text and HTML versions of a notification from the same
// content, so every notifier writes its copy once and the two formats can
// never drift apart. Every notification carries exactly one CTA — every
// email should point somewhere real, never dead-end on plain text.
// Table-based layout with inline styles only (no <style> blocks, no
// flexbox) because that's what actually survives Gmail/Outlook's markup
// stripping, not because it's the nicest way to write HTML.
export function renderEmail({ heading, paragraphs, cta }: EmailBody): { text: string; html: string } {
  const text = [heading, "", ...paragraphs, "", `${cta.label}: ${cta.url}`].join("\n");

  const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e8e1d4;">
        <tr>
          <td style="padding:32px 32px 4px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#9c9482;">mindcafe</p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 32px 0;">
            <h1 style="margin:0;font-size:21px;line-height:1.4;color:#1a1613;font-weight:700;">${escapeHtml(heading)}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 4px;">
            ${paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#4a443b;">${escapeHtml(p)}</p>`).join("")}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 30px;">
            <a href="${cta.url}" style="display:inline-block;background:#1a1613;color:#f4efe6;text-decoration:none;font-size:13px;font-weight:600;padding:13px 24px;border-radius:999px;">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 26px;border-top:1px solid #efe9dd;">
            <p style="margin:0;font-size:11px;line-height:1.6;color:#a89f8f;">Automated notification from MindCafe — you're receiving this because of activity on your account.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();

  return { text, html };
}
