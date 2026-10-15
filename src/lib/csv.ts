type Cell = string | number | boolean | null | undefined;

// Cells that open with one of these are treated as formulas by Excel and
// Sheets. Order data includes customer-typed text (names, addresses, notes),
// so a value like "=HYPERLINK(...)" would otherwise run when the export is
// opened — prefixing a quote makes it plain text.
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;
// Phone numbers (+91 98…) and plain negatives start with + or - too, but
// can't carry a formula, so they're left alone instead of gaining a quote.
const PLAIN_NUMBER = /^[+-]?[\d\s()-]+$/;

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && FORMULA_TRIGGERS.test(text) && !PLAIN_NUMBER.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

// Leading BOM so Excel reads the file as UTF-8 (₹, names in Indian scripts)
// instead of mangling it.
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
