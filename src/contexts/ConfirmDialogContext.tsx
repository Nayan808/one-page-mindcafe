"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/Modal";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button + warning icon, for destructive actions (the only kind this app currently confirms). */
  danger?: boolean;
};

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn | null>(null);

// Themed replacement for window.confirm() — every admin "delete this?"
// prompt was a bare browser confirm() dialog, which looks nothing like
// the rest of the app and can't carry any styling. Mounted once here
// (in admin/layout.tsx) so every page just calls the hook instead of
// rendering its own Modal for a yes/no prompt.
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((input) => {
    const normalized = typeof input === "string" ? { message: input } : input;
    setOptions(normalized);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function settle(result: boolean) {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  }

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}

      <Modal isOpen={Boolean(options)} onClose={() => settle(false)} title={options?.title ?? "Are you sure?"}>
        <div className="space-y-5 text-center">
          {options?.danger && (
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </div>
          )}
          <p className="text-sm text-ink/70">{options?.message}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => settle(false)} className="pill-btn-outline flex-1 !py-2 text-xs">
              {options?.cancelLabel ?? "cancel"}
            </button>
            <button
              type="button"
              onClick={() => settle(true)}
              className={`pill-btn flex-1 !py-2 text-xs ${options?.danger ? "!bg-red-600 !text-white hover:!bg-red-700" : ""}`}
            >
              {options?.confirmLabel ?? (options?.danger ? "delete" : "confirm")}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog(): ConfirmFn {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  return ctx;
}
