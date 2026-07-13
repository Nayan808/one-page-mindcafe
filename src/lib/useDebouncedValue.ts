import { useEffect, useState } from "react";

// Used by the two server-paginated admin search boxes (orders,
// appointments) so each keystroke doesn't fire its own network request —
// every other /admin/* search box filters an already-loaded list
// client-side and doesn't need this.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
