"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

export function Providers({ children }: { children: ReactNode }) {
  // useState (not useMemo) so the QueryClient instance survives fast
  // refresh and is created exactly once per mount.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
