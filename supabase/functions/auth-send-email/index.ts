// Supabase Auth "Send Email" Hook — supabase.com/docs/guides/auth/auth-hooks/send-email-hook
// Registered in Dashboard → Authentication → Hooks → Send Email hook, so
// every auth email (the OTP AuthForm.tsx asks users to type, plus signup/
// recovery/email-change if those ever get used) is sent through Resend
// with our own branded template instead of Supabase's built-in mailer,
// which is rate-limited to a handful of emails/hour and not meant for
// production use. Reuses the same EMAIL_PROVIDER_API_KEY (Resend) secret
// the other notifier functions already send through — no new Resend
// account/domain needed.
//
// This is a *blocking* hook: a non-2xx response here fails the user's
// sign-in/sign-up request, so — unlike _shared/email.ts's notifier emails,
// which are best-effort — a failed send here must surface as an error
// rather than fail silently and leave the user waiting on an email that
// never arrives.
import { jsonResponse } from "../_shared/cors.ts";

const FROM_ADDRESS = "Mindcafé <login@mindcafe.app>";

type SendEmailPayload = {
  user: { email: string };
  email_data: {
    token: string;
    email_action_type: "signup" | "magiclink" | "recovery" | "invite" | "email_change";
  };
};

const COPY: Record<string, { subject: string; heading: string; body: string }> = {
  magiclink: {
    subject: "your mindcafé sign-in code",
    heading: "here&rsquo;s your one-time code",
    body: "Enter this code on the sign-in screen to continue to Mindcafé. It expires shortly and can only be used once.",
  },
  signup: {
    subject: "confirm your mindcafé account",
    heading: "confirm your account",
    body: "Enter this code to finish creating your Mindcafé account.",
  },
  recovery: {
    subject: "reset your mindcafé password",
    heading: "reset your password",
    body: "Enter this code to continue resetting your password.",
  },
  email_change: {
    subject: "confirm your new email",
    heading: "confirm your new email",
    body: "Enter this code to confirm this is your new email address.",
  },
  invite: {
    subject: "you're invited to mindcafé",
    heading: "confirm your invite",
    body: "Enter this code to accept your invite.",
  },
};

function renderHtml(token: string, actionType: string): string {
  const copy = COPY[actionType] ?? COPY.magiclink;
  return `<div style="background-color:#f6f1e6; padding:40px 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:420px; margin:0 auto; background-color:#ffffff; border:1px solid rgba(17,17,16,0.1); border-radius:24px; overflow:hidden;">
    <div style="background-color:#111110; padding:28px 32px; text-align:center;">
      <span style="font-size:20px; font-weight:700; color:#f6f1e6; letter-spacing:-0.02em;">Mindcafé</span>
    </div>
    <div style="padding:32px 32px 36px; text-align:center;">
      <p style="margin:0 0 4px; font-size:13px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:rgba(17,17,16,0.5);">
        your sign-in code
      </p>
      <h1 style="margin:8px 0 20px; font-size:22px; font-weight:700; color:#111110;">${copy.heading}</h1>
      <p style="margin:0 0 24px; font-size:14px; line-height:1.6; color:rgba(17,17,16,0.65);">${copy.body}</p>
      <div style="margin:0 auto 24px; display:inline-block; background-color:#f6f1e6; border:1px solid rgba(17,17,16,0.15); border-radius:14px; padding:18px 28px;">
        <span style="font-size:32px; font-weight:700; letter-spacing:0.35em; color:#111110;">${token}</span>
      </div>
      <p style="margin:0; font-size:12px; line-height:1.6; color:rgba(17,17,16,0.45);">
        Didn&rsquo;t request this? You can safely ignore this email — no one can sign in without this code.
      </p>
    </div>
  </div>
</div>`;
}

function base64Decode(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

// Standard Webhooks signature (standardwebhooks.com) — the scheme Supabase
// Auth Hooks use. Secret comes from the dashboard as `whsec_...`.
async function verifySignature(rawBody: string, headers: Headers, secret: string): Promise<boolean> {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const secretBytes = base64Decode(secret.replace(/^whsec_/, ""));
  const signedContent = `${id}.${timestamp}.${rawBody}`;

  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const expected = base64Encode(new Uint8Array(mac));

  return signatureHeader.split(" ").some((part) => part.split(",")[1] === expected);
}

Deno.serve(async (req) => {
  const rawBody = await req.text();
  const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

  if (!hookSecret) {
    console.error("SEND_EMAIL_HOOK_SECRET not set");
    return jsonResponse({ error: { http_code: 500, message: "Hook not configured" } }, 500);
  }

  const isValid = await verifySignature(rawBody, req.headers, hookSecret);
  if (!isValid) return jsonResponse({ error: { http_code: 401, message: "Invalid signature" } }, 401);

  const payload = JSON.parse(rawBody) as SendEmailPayload;
  const { email } = payload.user;
  const { token, email_action_type } = payload.email_data;

  const apiKey = Deno.env.get("EMAIL_PROVIDER_API_KEY");
  if (!apiKey) {
    console.error("EMAIL_PROVIDER_API_KEY not set — cannot send auth email");
    return jsonResponse({ error: { http_code: 500, message: "Email provider not configured" } }, 500);
  }

  const copy = COPY[email_action_type] ?? COPY.magiclink;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: email,
      subject: copy.subject,
      text: `Your Mindcafé code is ${token}. It expires shortly and can only be used once.`,
      html: renderHtml(token, email_action_type),
    }),
  });

  if (!res.ok) {
    console.error("Resend send failed", await res.text());
    return jsonResponse({ error: { http_code: 500, message: "Failed to send email" } }, 500);
  }

  return jsonResponse({});
});
