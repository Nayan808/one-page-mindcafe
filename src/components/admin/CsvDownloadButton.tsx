"use client";

import { useState } from "react";
import { downloadCsv, toCsv } from "@/lib/csv";

type Cell = string | number | boolean | null | undefined;

// Turns one row (including joined objects like `experts: { name }`) into
// flat "column → value" pairs: nested fields become `experts.name`, lists
// of plain values are joined with "; ", lists of objects become JSON.
function flatten(value: unknown, prefix: string, out: Record<string, Cell>): void {
  if (value === null || value === undefined) {
    out[prefix] = "";
  } else if (Array.isArray(value)) {
    out[prefix] = value.some((item) => typeof item === "object" && item !== null) ? JSON.stringify(value) : value.join("; ");
  } else if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, out);
  } else {
    out[prefix] = value as Cell;
  }
}

function isExcluded(column: string, exclude: string[]): boolean {
  return exclude.some((name) => column === name || column.startsWith(`${name}.`));
}

// Exports every field of every row (not just the columns on screen) so the
// file is useful for analysis. `rows` is either the rows already loaded —
// pass the filtered list, so a search carries through to the export — or a
// function that fetches them, for pages that load one page at a time.
// `exclude` keeps secrets and sensitive fields out of the file.
export function CsvDownloadButton<T extends object>({
  filename,
  rows,
  exclude = [],
}: {
  filename: string;
  rows: T[] | (() => Promise<T[]>);
  exclude?: string[];
}) {
  const [isExporting, setIsExporting] = useState(false);
  const count = Array.isArray(rows) ? rows.length : null;

  async function handleClick() {
    setIsExporting(true);
    try {
      const data = Array.isArray(rows) ? rows : await rows();
      const flatRows = data.map((row) => {
        const out: Record<string, Cell> = {};
        flatten(row, "", out);
        return out;
      });

      const header: string[] = [];
      const seen = new Set<string>();
      for (const row of flatRows) {
        for (const column of Object.keys(row)) {
          if (!seen.has(column) && !isExcluded(column, exclude)) {
            seen.add(column);
            header.push(column);
          }
        }
      }
      // A joined object that is null on some rows ("experts": "") but filled
      // on others ("experts.name") would otherwise add an empty column.
      const columns = header.filter((column) => !header.some((other) => other.startsWith(`${column}.`)));

      const csv = toCsv(columns, flatRows.map((row) => columns.map((column) => row[column])));
      downloadCsv(`${filename}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } catch (error) {
      console.error("CSV export failed", error);
      window.alert("Couldn't export — please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isExporting || count === 0}
      className="pill-btn-outline !py-2 text-xs disabled:opacity-40"
      title="Download these rows as a CSV file"
    >
      {isExporting ? "exporting…" : count === null ? "download csv" : `download csv (${count})`}
    </button>
  );
}
