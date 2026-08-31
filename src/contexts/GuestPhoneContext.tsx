"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearGuestPhone, readGuestPhone, writeGuestPhone } from "@/lib/guestPhone";

type GuestPhoneContextValue = {
  /** null until the Feelz phone popup has been completed this session
   * (or a previous one — it's a 30-day cookie, same as the guest cart). */
  guestPhone: string | null;
  setGuestPhone: (phone: string) => void;
  clearGuestPhoneValue: () => void;
};

const GuestPhoneContext = createContext<GuestPhoneContextValue | null>(null);

export function GuestPhoneProvider({ children }: { children: ReactNode }) {
  // Starts null (not the cookie's value) so server and first client render
  // match — cookies aren't available during SSR/hydration. The effect
  // below picks up whatever was already stored the moment the component
  // mounts client-side.
  const [guestPhone, setGuestPhoneState] = useState<string | null>(null);

  useEffect(() => {
    setGuestPhoneState(readGuestPhone());
  }, []);

  const setGuestPhone = useCallback((phone: string) => {
    writeGuestPhone(phone);
    setGuestPhoneState(phone);
  }, []);

  const clearGuestPhoneValue = useCallback(() => {
    clearGuestPhone();
    setGuestPhoneState(null);
  }, []);

  const value = useMemo(
    () => ({ guestPhone, setGuestPhone, clearGuestPhoneValue }),
    [guestPhone, setGuestPhone, clearGuestPhoneValue],
  );

  return <GuestPhoneContext.Provider value={value}>{children}</GuestPhoneContext.Provider>;
}

export function useGuestPhone(): GuestPhoneContextValue {
  const ctx = useContext(GuestPhoneContext);
  if (!ctx) throw new Error("useGuestPhone must be used within GuestPhoneProvider");
  return ctx;
}
