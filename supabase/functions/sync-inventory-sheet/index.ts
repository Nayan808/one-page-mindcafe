// One-way sync: website inventory → the "Feelz Zostel Inventory Tracker"
// Google Sheet that coworkers/stakeholders view. The website stays the
// source of truth; nothing is ever read back from the sheet into Supabase.
//
// Runs on a schedule (see 20261015010000_schedule_inventory_sheet_sync.sql)
// and can also be called by hand. Each run:
//   - 'Zostel Inventory' sheet: for every website pickup location, finds
//     its row by column K (Website ID), falling back to an exact name match
//     (whitespace/case-insensitive) and writing the ID into K so the link
//     survives later renames. Writes JOY/EXTROVERT/REST/FOCUS into F:I and,
//     for locations active on the site, sets Status (E) to "Listed".
//     An active location with no row yet is appended at the bottom with
//     the next No. and the same Total formula — so properties listed on the
//     website later show up in the sheet automatically.
//   - 'Bhopal Office' sheet: B2:B5 = the central (delivery) stock.
// Stock cells are left blank when the website has no inventory row for
// that variant/location, and 0 only when the stock is genuinely 0 — the
// convention the sheet's Notes tab asks for.
//
// Secrets (Supabase Dashboard → Edge Functions → Secrets):
//   GOOGLE_SERVICE_ACCOUNT_JSON — full JSON key of a Google service account
//   INVENTORY_SHEET_ID          — the spreadsheet ID from its URL
// The sheet must be shared with the service account's email as an Editor.
import { serviceRoleClient } from "../_shared/supabaseClients.ts";
import { jsonResponse } from "../_shared/cors.ts";

const INVENTORY_TAB = "Zostel Inventory";
const OFFICE_TAB = "Bhopal Office";
// Column order F, G, H, I on the sheet — matched to website products by name.
const VARIANT_COLUMNS = ["joy", "extrovert", "rest", "focus"] as const;
const LAST_ROW = 500; // the Overview formulas read rows 2..500

type ServiceAccount = { client_email: string; private_key: string };

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function googleAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const header = base64Url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64Url(
    encoder.encode(
      JSON.stringify({
        iss: account.client_email,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    ),
  );
  const pem = account.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(`${header}.${claims}`)));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${base64Url(signature)}`,
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.access_token) throw new Error(`Google auth failed: ${JSON.stringify(body)}`);
  return body.access_token as string;
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

Deno.serve(async () => {
  const accountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  const sheetId = Deno.env.get("INVENTORY_SHEET_ID");
  if (!accountJson || !sheetId) {
    return jsonResponse({ error: "GOOGLE_SERVICE_ACCOUNT_JSON and INVENTORY_SHEET_ID must be set" }, 500);
  }

  try {
    const sb = serviceRoleClient();

    // --- Website side ---
    const { data: products, error: productsError } = await sb
      .from("products")
      .select("name, is_bundle, product_variants(id)");
    if (productsError) throw productsError;
    const columnByVariantId = new Map<string, number>();
    for (const product of products ?? []) {
      if (product.is_bundle) continue;
      const column = VARIANT_COLUMNS.indexOf(product.name.trim().toLowerCase() as (typeof VARIANT_COLUMNS)[number]);
      if (column === -1) continue;
      for (const variant of product.product_variants ?? []) columnByVariantId.set(variant.id, column);
    }

    const { data: inventory, error: inventoryError } = await sb
      .from("inventory")
      .select("variant_id, location_id, quantity_available")
      .in("variant_id", [...columnByVariantId.keys()]);
    if (inventoryError) throw inventoryError;
    // location id ("central" for location_id null) → [joy, extrovert, rest, focus]
    const stockByLocation = new Map<string, (number | "")[]>();
    for (const row of inventory ?? []) {
      const key = row.location_id ?? "central";
      const stock = stockByLocation.get(key) ?? ["", "", "", ""];
      const column = columnByVariantId.get(row.variant_id)!;
      stock[column] = (stock[column] === "" ? 0 : (stock[column] as number)) + row.quantity_available;
      stockByLocation.set(key, stock);
    }

    const { data: locations, error: locationsError } = await sb
      .from("pickup_locations")
      .select("id, name, city, is_active")
      .order("created_at");
    if (locationsError) throw locationsError;

    // --- Sheet side ---
    const token = await googleAccessToken(JSON.parse(accountJson) as ServiceAccount);
    const api = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
    const auth = { Authorization: `Bearer ${token}` };

    const readRange = encodeURIComponent(`'${INVENTORY_TAB}'!A2:K${LAST_ROW}`);
    const readRes = await fetch(`${api}/values/${readRange}?valueRenderOption=UNFORMATTED_VALUE`, { headers: auth });
    const readBody = await readRes.json();
    if (!readRes.ok) throw new Error(`Sheet read failed: ${JSON.stringify(readBody)}`);
    const rows: unknown[][] = readBody.values ?? [];

    const rowByWebsiteId = new Map<string, number>();
    const rowByName = new Map<string, number>();
    let maxNo = 0;
    let lastFilledRow = 1;
    rows.forEach((row, index) => {
      const sheetRow = index + 2;
      if (row[1]) lastFilledRow = sheetRow;
      if (typeof row[0] === "number") maxNo = Math.max(maxNo, row[0]);
      if (row[10]) rowByWebsiteId.set(String(row[10]), sheetRow);
      if (row[1]) rowByName.set(normalizeName(String(row[1])), sheetRow);
    });

    const data: { range: string; values: unknown[][] }[] = [];
    const appended: string[] = [];
    const unmatchedInactive: string[] = [];

    for (const location of locations ?? []) {
      const stock = stockByLocation.get(location.id) ?? ["", "", "", ""];
      let sheetRow = rowByWebsiteId.get(location.id) ?? rowByName.get(normalizeName(location.name));

      if (!sheetRow) {
        if (!location.is_active) {
          unmatchedInactive.push(location.name);
          continue;
        }
        sheetRow = ++lastFilledRow;
        maxNo += 1;
        data.push({
          range: `'${INVENTORY_TAB}'!A${sheetRow}:K${sheetRow}`,
          values: [[maxNo, location.name.trim().replace(/\s+/g, " "), "", "", "Listed", ...stock, `=SUM(F${sheetRow}:I${sheetRow})`, location.id]],
        });
        appended.push(location.name);
        continue;
      }

      const status = location.is_active ? "Listed" : (rows[sheetRow - 2]?.[4] ?? "");
      data.push({ range: `'${INVENTORY_TAB}'!E${sheetRow}:I${sheetRow}`, values: [[status, ...stock]] });
      data.push({ range: `'${INVENTORY_TAB}'!K${sheetRow}`, values: [[location.id]] });
    }

    const central = stockByLocation.get("central") ?? ["", "", "", ""];
    data.push({ range: `'${OFFICE_TAB}'!B2:B5`, values: central.map((value) => [value]) });

    const writeRes = await fetch(`${api}/values:batchUpdate`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
    });
    const writeBody = await writeRes.json();
    if (!writeRes.ok) throw new Error(`Sheet write failed: ${JSON.stringify(writeBody)}`);

    return jsonResponse({
      synced: (locations ?? []).length - unmatchedInactive.length,
      appended,
      unmatched_inactive: unmatchedInactive,
      updated_cells: writeBody.totalUpdatedCells ?? 0,
    });
  } catch (error) {
    console.error("sync-inventory-sheet failed", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
