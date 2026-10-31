// Sends one approved WhatsApp template message through MSG91 — the same
// bulk-send endpoint and secrets the login-code hook (auth-send-sms) uses.
// Never throws: a WhatsApp problem must never break the order email or the
// order update that triggered it; the outcome is returned and logged.

export type WhatsAppResult = { ok: true } | { ok: false; reason: string };

/** Normalises any Indian number to MSG91's "91XXXXXXXXXX" form, or null. */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  const last10 = digits.slice(-10);
  return /^[6-9]\d{9}$/.test(last10) ? `91${last10}` : null;
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  bodyValues: string[],
): Promise<WhatsAppResult> {
  const authKey = Deno.env.get("MSG91_AUTH_KEY");
  const integratedNumber = Deno.env.get("MSG91_WHATSAPP_INTEGRATED_NUMBER");
  const namespace = Deno.env.get("MSG91_WHATSAPP_TEMPLATE_NAMESPACE");
  if (!authKey || !integratedNumber || !namespace) return { ok: false, reason: "MSG91 WhatsApp secrets not configured" };

  const components: Record<string, { type: "text"; value: string }> = {};
  bodyValues.forEach((value, index) => {
    components[`body_${index + 1}`] = { type: "text", value: value || "-" };
  });

  try {
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
            language: { code: "en", policy: "deterministic" },
            namespace,
            to_and_components: [{ to: [to], components }],
          },
        },
      }),
    });
    const text = await res.text();
    // MSG91 can answer 200 with a per-recipient failure in the body, so the
    // body is logged either way.
    console.log("WhatsApp send", templateName, res.status, text);
    return res.ok ? { ok: true } : { ok: false, reason: `HTTP ${res.status}: ${text.slice(0, 300)}` };
  } catch (error) {
    return { ok: false, reason: String(error) };
  }
}
