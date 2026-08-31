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
        {/* Above AuthModalProvider — the modal's Feelz-only phone form
            (FeelzPhoneForm) and Hero.tsx's add-to-cart gate both read
            this, so it has to be an ancestor of both. */}
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
