import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

export type AdminColumn<T> = { key: string; label: string; render: (row: T) => ReactNode };

// Generic list view reused by every /admin/* page — one table shell so
// each page only has to describe its columns, not reimplement borders/
// loading/empty states/row actions every time.
export function AdminTable<T>({
  columns,
  rows,
  getRowId,
  isLoading,
  emptyLabel = "Nothing here yet.",
  onEdit,
  onDelete,
}: {
  columns: AdminColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  emptyLabel?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}) {
  if (isLoading) return <p className="py-8 text-center text-sm text-ink/60">Loading…</p>;
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-ink/60">{emptyLabel}</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-ink/15 bg-white">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-[11px] uppercase tracking-label text-ink/50">
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)} className="border-b border-ink/5 last:border-0 hover:bg-cream/60">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-top">
                  {col.render(row)}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right align-top">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <button type="button" onClick={() => onEdit(row)} aria-label="Edit" className="text-ink/60 hover:text-ink">
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                    {onDelete && (
                      <button type="button" onClick={() => onDelete(row)} aria-label="Delete" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
