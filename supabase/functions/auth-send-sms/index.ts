// Supabase Auth "Send SMS" Hook — supabase.com/docs/guides/auth/auth-hooks/send-sms-hook
// Registered in Dashboard → Authentication → Hooks → Send SMS hook, so every
// phone sign-in code (AuthForm.tsx's phone step) is delivered over WhatsApp
// via MSG91 instead of Supabase's default SMS provider integration (which
// only supports Twilio/MessageBird/Vonage/TextLocal and has no WhatsApp
// option for non-Twilio providers). Supabase still generates and verifies
// the OTP itself — this function only delivers it, mirroring the existing
// auth-send-email hook's relationship with Resend.
//
// This is a *blocking* hook: a non-2xx response here fails the user's
// sign-in/sign-up request, so a failed send must surface as an error rather
// than fail silently and leave the user waiting on a code that never
// arrives. Supabase also expects an empty 200 body on success — returning a
// JSON payload here is treated as a hook failure even though the message
// already sent.
import { jsonResponse } from "../_shared/cors.ts";

type SendSmsPayload = {
  user: { phone: string };
  sms: { otp: string };
};

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

// Standard Webhooks signature (standardwebhooks.com) — same scheme as
// auth-send-email's verifySignature. Secret comes from the dashboard as
// `v1,whsec_...`; the leading `v1,` has to be stripped too or the leftover
// comma makes the rest invalid base64.
async function verifySignature(rawBody: string, headers: Headers, secret: string): Promise<boolean> {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const secretBytes = base64Decode(secret.replace(/^v1,/, "").replace(/^whsec_/, ""));
  const signedContent = `${id}.${timestamp}.${rawBody}`;

  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const expected = base64Encode(new Uint8Array(mac));

  return signatureHeader.split(" ").some((part) => part.split(",")[1] === expected);
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");

    if (!hookSecret) {
      console.error("SEND_SMS_HOOK_SECRET not set");
      return jsonResponse({ error: { http_code: 500, message: "Hook not configured" } }, 500);
    }

    const isValid = await verifySignature(rawBody, req.headers, hookSecret);
    if (!isValid) return jsonResponse({ error: { http_code: 401, message: "Invalid signature" } }, 401);

    const payload = JSON.parse(rawBody) as SendSmsPayload;
    const phone = payload.user.phone;
    const otp = payload.sms.otp;

    const authKey = Deno.env.get("MSG91_AUTH_KEY");
    const integratedNumber = Deno.env.get("MSG91_WHATSAPP_INTEGRATED_NUMBER");
    const templateName = Deno.env.get("MSG91_WHATSAPP_TEMPLATE_NAME");
    const templateNamespace = Deno.env.get("MSG91_WHATSAPP_TEMPLATE_NAMESPACE");
    const templateLang = Deno.env.get("MSG91_WHATSAPP_TEMPLATE_LANG") ?? "en";

    if (!authKey || !integratedNumber || !templateName || !templateNamespace) {
      console.error("MSG91 WhatsApp secrets not fully configured");
      return jsonResponse({ error: { http_code: 500, message: "WhatsApp provider not configured" } }, 500);
    }

    // Supabase hands the phone back without a leading "+" (e.g. "919999999999").
    // Strip anything else defensively — MSG91 expects country-code-prefixed
    // digits only, same shape.
    const to = phone.replace(/[^0-9]/g, "");

    // `components` below assumes an approved template with a single body
    // variable ({{1}}) for the code, e.g. "Your Mindcafe code is {{1}}."
    // If the actual template also has an OTP-autofill/copy-code button
    // component, MSG91 needs a matching `button_1: { subtype: "url" | "copy_code", type: "text", value: otp }`
    // entry here too, or the send will be rejected — check the template's
    // definition in the MSG91 dashboard (docs.msg91.com/whatsapp/get-templates).
    const res = await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", {
      method: "POST",
      headers: { authkey: authKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        integrated_number: integratedNumber,
        content_type: "template",
        payload: {
          messaging_product: "whatsapp",
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLang, policy: "deterministic" },
            namespace: templateNamespace,
            to_and_components: [
              {
                to: [to],
                components: {
                  body_1: { type: "text", value: otp },
                },
              },
            ],
          },
        },
      }),
    });

    if (!res.ok) {
      console.error("MSG91 WhatsApp send failed", await res.text());
      return jsonResponse({ error: { http_code: 500, message: "Failed to send WhatsApp message" } }, 500);
    }

    return jsonResponse({});
  } catch (err) {
    console.error("auth-send-sms crashed", err);
    return jsonResponse({ error: { http_code: 500, message: "Unexpected error" } }, 500);
  }
});
