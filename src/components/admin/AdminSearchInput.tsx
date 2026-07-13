import { Search, X } from "lucide-react";

// Shared search box for /admin/* list pages — plain client-side filter on
// pages that already load every row (most of them), or a controlled input
// wired to a server-side query on the two paginated ones (orders,
// appointments). Kept dumb on purpose: each page owns its own filter
// predicate, this just renders the box consistently.
export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative mb-4 max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input !pl-9 !pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
