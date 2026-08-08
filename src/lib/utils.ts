import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    amount,
  );
}

// Explicit en-GB locale, not the visitor's own — plain `toLocaleDateString()`
// with no locale argument follows the browser/OS locale, which is why the
// same date could render as dd/mm/yyyy for one visitor and mm/dd/yyyy (US)
// for another. en-GB always formats as dd/mm/yyyy, so this stays
// consistent everywhere regardless of who's looking at it.
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Quotes a field for CSV only when it actually needs it (comma/quote/
// newline) — keeps plain numbers and short strings from the sales report
// unnecessarily wrapped, which is what most spreadsheet apps expect.
function csvField(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// Builds a CSV Blob from row objects and triggers a browser download —
// used by the admin dashboard's report export. No library needed for
// something this small, and it keeps the admin bundle from pulling one in.
export function downloadCsv(filename: string, rows: Record<string, string | number>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(csvField).join(","),
    ...rows.map((row) => headers.map((h) => csvField(row[h])).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
