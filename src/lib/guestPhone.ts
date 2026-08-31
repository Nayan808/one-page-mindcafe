"use client";

// Feelz's phone-only guest identity — same accepted tradeoff as
// guestSession.ts's cart cookie: a plain client-side value, not
// cryptographically verified. Captured once (via the phone-only popup
// AuthModal shows while on /feelz) and reused for the rest of the
// session so the customer is never asked for it twice.
const COOKIE_NAME = "mc_guest_phone";
const COOKIE_MAX_AGE_DAYS = 30;

export function readGuestPhone(): string | null {
  return readCookie(COOKIE_NAME);
}

export function writeGuestPhone(phone: string): void {
  writeCookie(COOKIE_NAME, phone, COOKIE_MAX_AGE_DAYS);
}

export function clearGuestPhone(): void {
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
