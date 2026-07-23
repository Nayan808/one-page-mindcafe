// One-time import: creates a real Supabase Auth account for every valid,
// deduped email from the legacy mindcafe.app `users` export
// (legacy_users.json, 1395 rows — already cleaned: invalid emails and
// duplicates removed).
//
// Run this YOURSELF, not me — it needs your project's service_role key,
// which is a secret that should never be pasted into a chat/AI context.
//
// Usage:
//   cd supabase/data-imports
//   SUPABASE_URL=https://<project-ref>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service role key from Project Settings > API> \
//   node import_legacy_users.mjs
//
// What it does per user:
//   1. auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name } })
//      - No password set — this site is OTP-only, so none is needed. The
//        person signs in later the same way anyone else does: request a
//        code by email.
//      - email_confirm: true means they can sign in immediately via OTP,
//        no separate "confirm your email" step first.
//      - This insert alone already triggers handle_new_user() (see
//        setup.sql), which auto-creates the matching profiles row with
//        full_name pulled from user_metadata — no separate profiles
//        insert needed for that part.
//   2. A follow-up update to fill in phone/gender on that profiles row
//      (handle_new_user() doesn't set those, only full_name/avatar_url).
//
// Safe to re-run: if an email already has an account (either from a
// previous partial run, or because that person already signed up for
// real on the current site), createUser fails with "already registered"
// and this script just logs it as skipped and moves on — never
// overwrites an existing real account.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables first — see the comment at the top of this file.");
  process.exit(1);
}

// This script never uses Realtime, but supabase-js's client constructor
// initializes a RealtimeClient unconditionally regardless — which throws
// on Node < 22 without a WebSocket polyfill. `ws` supplies that; installed
// with --no-save below so it never touches this project's package.json.
import ws from "ws";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

const users = JSON.parse(readFileSync(join(__dirname, "legacy_users.json"), "utf-8"));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const results = { created: [], skipped: [], failed: [] };

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    process.stdout.write(`\r[${i + 1}/${users.length}] ${u.email.padEnd(40)}`);

    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      email_confirm: true,
      user_metadata: u.name ? { full_name: u.name } : undefined,
    });

    if (error) {
      if (/already.*registered|already.*exists/i.test(error.message)) {
        results.skipped.push({ email: u.email, reason: error.message });
      } else {
        results.failed.push({ email: u.email, reason: error.message });
      }
      continue;
    }

    // Fill in phone/gender — handle_new_user() only sets full_name/avatar_url.
    if (u.phone || u.gender) {
      const { error: profileError } = await sb
        .from("profiles")
        .update({ ...(u.phone ? { phone: u.phone } : {}), ...(u.gender ? { gender: u.gender } : {}) })
        .eq("id", data.user.id);
      if (profileError) {
        results.failed.push({ email: u.email, reason: `created but profile update failed: ${profileError.message}` });
        continue;
      }
    }

    results.created.push(u.email);
    // Gentle pacing — avoids hammering the Admin API on a free/small project.
    await sleep(120);
  }

  console.log("\n\nDone.");
  console.log(`  created: ${results.created.length}`);
  console.log(`  skipped (already existed): ${results.skipped.length}`);
  console.log(`  failed: ${results.failed.length}`);

  const logPath = join(__dirname, `import_legacy_users_result_${Date.now()}.json`);
  writeFileSync(logPath, JSON.stringify(results, null, 2));
  console.log(`Full results written to ${logPath}`);
}

run();
