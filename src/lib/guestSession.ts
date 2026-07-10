"use client";

// Guest cart identity: a plain client-generated UUID in a cookie, merged
// into the account cart on login. Not cryptographically scoped — same
// accepted tradeoff as the main Mindcafe app.
const COOKIE_NAME = "mc_guest_session_id";
const COOKIE_MAX_AGE_DAYS = 30;

export function getOrCreateGuestSessionId(): string {
  const existing = readCookie(COOKIE_NAME);
  if (existing) return existing;

  const id = crypto.randomUUID();
  writeCookie(COOKIE_NAME, id, COOKIE_MAX_AGE_DAYS);
  return id;
}

export function readGuestSessionId(): string | null {
  return readCookie(COOKIE_NAME);
}

export function clearGuestSessionId(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}
