"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { CartProvider } from "@/contexts/CartContext";
import { GuestPhoneProvider } from "@/contexts/GuestPhoneContext";
import { ScrollRestoreOnAuthReturn } from "@/components/ScrollRestoreOnAuthReturn";

export function Providers({ children }: { children: ReactNode }) {
  // useState (not useMemo) so the QueryClient instance survives fast
  // refresh and is created exactly once per mount.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Remembers a guest's phone number (30-day cookie) once they
            place their first order, so FulfillmentAndPayment.tsx can
            pre-fill it on a return visit instead of asking again. */}
        <GuestPhoneProvider>
          <AuthModalProvider>
            <CartProvider>
              <ScrollRestoreOnAuthReturn />
              {children}
            </CartProvider>
          </AuthModalProvider>
        </GuestPhoneProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
