"use client";

import { useEffect, useState } from "react";
import { Lock, LogOut, Package, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { QrScanner } from "@/components/staff/QrScanner";
import { formatInr } from "@/lib/utils";

type StaffOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  pickup_code: string | null;
  pickup_code_collected_at: string | null;
  created_at: string;
  customer_name: string;
  guest_phone: string | null;
  pickup_slot: string | null;
  total: number;
  order_items: {
    quantity: number;
    unit_price: number;
    product_variants: { variant_label: string; products: { name: string } };
  }[];
  pickup_locations: { name: string; city: string } | null;
};

const SESSION_KEY = "feelz_staff_password";

// Two ways to unlock, one input box: the shared dashboard password (sees
// every location), or a single location's staff_pin (sees only that
// location's pickups). Whatever's typed gets sent as both `password` and
// `pin` — the Edge Function tries the password check first, falls back to
// a PIN lookup, so this page never has to know in advance which kind of
// credential it was handed. This page never trusts client state as
// authorization either way — every action re-checks server-side.
export default function StaffDashboard() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [scopedLocation, setScopedLocation] = useState<{ id: string; name: string; city: string } | null>(null);

  const [pending, setPending] = useState<StaffOrder[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  const [code, setCode] = useState("");
  const [lookedUpOrder, setLookedUpOrder] = useState<StaffOrder | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);

  async function call(action: "lookup" | "collect" | "list_pending", extra: Record<string, string> = {}, pw = password) {
    const sb = createClient();
    const { data, error } = await sb.functions.invoke("staff-pickup", { body: { action, password: pw, pin: pw, ...extra } });
    if (error) {
      const detail = await (error as { context?: Response }).context?.json?.().catch(() => null);
      throw new Error(detail?.error ?? error.message);
    }
    return data;
  }

  async function loadPending(pw = password) {
    setIsLoadingPending(true);
    try {
      const data = await call("list_pending", {}, pw);
      setPending(data.orders ?? []);
      setScopedLocation(data.location ?? null);
    } finally {
      setIsLoadingPending(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return;
    setPassword(saved);
    call("list_pending", {}, saved)
      .then((data) => {
        setAuthed(true);
        setPending(data.orders ?? []);
        setScopedLocation(data.location ?? null);
      })
      .catch(() => sessionStorage.removeItem(SESSION_KEY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUnlock() {
    setIsCheckingPassword(true);
    setAuthError(null);
    try {
      await loadPending(password);
      sessionStorage.setItem(SESSION_KEY, password);
      setAuthed(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsCheckingPassword(false);
    }
  }

  async function handleLookup(rawCode: string) {
    const trimmed = rawCode.trim();
    if (!trimmed) return;
    setIsLookingUp(true);
    setLookupError(null);
    setLookedUpOrder(null);
    try {
      const data = await call("lookup", { code: trimmed });
      setLookedUpOrder(data.order);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleCollect(orderId: string) {
    setIsCollecting(true);
    try {
      await call("collect", { order_id: orderId });
      setLookedUpOrder((prev) => (prev ? { ...prev, status: "picked_up" } : prev));
      void loadPending();
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Failed to mark collected");
    } finally {
      setIsCollecting(false);
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="w-full max-w-sm rounded-3xl border border-ink/10 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-cream">
            <Lock className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="font-display mt-4 text-2xl font-bold lowercase">feelz staff</h1>
          <p className="mt-1 text-sm text-ink/60">Enter the dashboard password, or your location&apos;s staff PIN.</p>

          <div className="mt-6 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void handleUnlock()}
              placeholder="Password or location PIN"
              className="input"
              autoFocus
            />
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isCheckingPassword || !password}
              className="pill-btn w-full gap-2"
            >
              <Lock className="h-4 w-4" aria-hidden />
              {isCheckingPassword ? "checking…" : "unlock"}
            </button>
          </div>
          {authError && <p className="mt-3 text-sm text-red-600">{authError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg space-y-8 bg-cream px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold lowercase">feelz staff</h1>
          <p className="text-xs text-ink/50">
            {scopedLocation ? `pickup desk — ${scopedLocation.name}, ${scopedLocation.city}` : "pickup desk — all locations"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(SESSION_KEY);
            setAuthed(false);
            setPassword("");
            setScopedLocation(null);
          }}
          className="pill-btn-outline gap-1.5 !py-2 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          lock
        </button>
      </header>

      <section className="space-y-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/60">look up an order</h2>
        <QrScanner onDecode={(text) => { setCode(text); void handleLookup(text); }} />
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            onKeyDown={(event) => event.key === "Enter" && void handleLookup(code)}
            placeholder="Or type the pickup code"
            className="input uppercase"
          />
          <button type="button" onClick={() => void handleLookup(code)} disabled={isLookingUp} className="pill-btn shrink-0">
            {isLookingUp ? "…" : "look up"}
          </button>
        </div>
        {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}

        {lookedUpOrder && (
          <div className="space-y-3 rounded-xl border border-ink/15 bg-cream/60 p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold">{lookedUpOrder.order_number}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${lookedUpOrder.status === "picked_up" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
              >
                {lookedUpOrder.status === "picked_up" ? "collected" : "ready for pickup"}
              </span>
            </div>
            <p>
              <span className="text-ink/60">Customer: </span>
              {lookedUpOrder.customer_name}
              {lookedUpOrder.guest_phone ? ` · ${lookedUpOrder.guest_phone}` : ""}
            </p>
            <p>
              <span className="text-ink/60">Payment: </span>
              {lookedUpOrder.payment_status}
            </p>
            <ul className="space-y-1">
              {lookedUpOrder.order_items.map((item, i) => (
                <li key={i}>
                  {item.quantity} × {item.product_variants.products.name} ({item.product_variants.variant_label})
                </li>
              ))}
            </ul>
            <p className="font-medium">{formatInr(lookedUpOrder.total)}</p>

            <button
              type="button"
              onClick={() => void handleCollect(lookedUpOrder.id)}
              disabled={isCollecting || lookedUpOrder.status === "picked_up"}
              className="pill-btn w-full"
            >
              {lookedUpOrder.status === "picked_up" ? "already collected" : isCollecting ? "marking…" : "mark as collected"}
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink/60">
            pending pickups
            <span className="badge-pill !px-2 !py-0.5 normal-case tracking-normal text-ink">{pending.length}</span>
          </h2>
          <button
            type="button"
            onClick={() => void loadPending()}
            disabled={isLoadingPending}
            className="pill-btn-outline gap-1.5 !py-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPending ? "animate-spin" : ""}`} aria-hidden />
            refresh
          </button>
        </div>

        {pending.length === 0 ? (
          <p className="flex flex-col items-center gap-2 py-6 text-center text-sm text-ink/50">
            <Package className="h-6 w-6 opacity-40" aria-hidden />
            Nothing waiting right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.map((order) => (
              <li key={order.id} className="rounded-xl border border-ink/15 bg-cream/60 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{order.order_number}</span>
                  <span className="font-display font-bold tracking-[0.15em] text-ink/70">{order.pickup_code}</span>
                </div>
                <p className="text-ink/60">{order.customer_name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
