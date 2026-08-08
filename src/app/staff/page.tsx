"use client";

import { useEffect, useState } from "react";
import { Lock, LogOut, Package, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { QrScanner } from "@/components/staff/QrScanner";
import { formatInr } from "@/lib/utils";

type StaffInventoryProduct = {
  variantId: string;
  productName: string;
  variantLabel: string;
  price: number;
  unitsRemaining: number;
  unitsSold: number;
  revenue: number;
  commission: number;
};

type StaffInventoryData = {
  location: { id: string; name: string; city: string } | null;
  products: StaffInventoryProduct[];
  totals: { unitsRemaining: number; unitsSold: number; revenue: number; commissionRate: number; commission: number };
};

type DateRange = "24h" | "today" | "3d" | "7d" | "all";
const RANGE_LABELS: Record<DateRange, string> = {
  "24h": "24 hours",
  today: "today",
  "3d": "last 3 days",
  "7d": "last week",
  all: "overall",
};

// Computed client-side (local device time — the staff member is
// physically at the property) rather than the server guessing a
// timezone. null means "all time", i.e. no filter at all.
function sinceForRange(range: DateRange): string | null {
  const now = new Date();
  switch (range) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    case "3d":
      return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "all":
      return null;
  }
}

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

  const [activeTab, setActiveTab] = useState<"orders" | "inventory">("orders");
  const [inventory, setInventory] = useState<StaffInventoryData | null>(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>("today");

  async function call(action: "lookup" | "collect" | "list_pending" | "inventory", extra: Record<string, string> = {}, pw = password) {
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

  // View-only, on purpose — this dashboard never edits stock. Editing
  // lives in /admin/inventory, for real admins only. Units remaining is
  // always a live snapshot (there's no "remaining as of 3 days ago");
  // only sold/revenue/commission are affected by the range.
  async function loadInventory(pw = password, r = range) {
    setIsLoadingInventory(true);
    setInventoryError(null);
    try {
      const since = sinceForRange(r);
      const data = await call("inventory", since ? { since } : {}, pw);
      setInventory(data);
    } catch (err) {
      setInventoryError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setIsLoadingInventory(false);
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

  // Lazily fetched — only pulled the first time the tab is actually
  // opened, not on every unlock, since most visits are just "scan and
  // collect" and never touch it.
  useEffect(() => {
    if (authed && activeTab === "inventory" && !inventory && !isLoadingInventory) {
      void loadInventory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, activeTab]);

  function handleRangeChange(next: DateRange) {
    setRange(next);
    void loadInventory(password, next);
  }

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
            setInventory(null);
            setActiveTab("orders");
          }}
          className="pill-btn-outline gap-1.5 !py-2 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          lock
        </button>
      </header>

      <div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-ink/10 bg-white p-3 text-center shadow-sm">
            <p className="font-display text-xl font-bold text-ink">{inventory ? inventory.totals.unitsSold : "—"}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-label text-ink/50">units sold</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white p-3 text-center shadow-sm">
            <p className="font-display text-xl font-bold text-ink">{inventory ? inventory.totals.unitsRemaining : "—"}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-label text-ink/50">units remaining</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white p-3 text-center shadow-sm">
            <p className="font-display text-xl font-bold text-ink">{inventory ? formatInr(inventory.totals.revenue) : "—"}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-label text-ink/50">revenue</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white p-3 text-center shadow-sm">
            <p className="font-display text-xl font-bold text-ink">{inventory ? formatInr(inventory.totals.commission) : "—"}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-label text-ink/50">
              commission ({inventory ? `${Math.round(inventory.totals.commissionRate * 100)}%` : "10%"})
            </p>
          </div>
        </div>
        {inventory && <p className="mt-1.5 text-center text-[11px] text-ink/40">sold, revenue &amp; commission — {RANGE_LABELS[range]} · remaining is live</p>}
      </div>

      <div className="flex gap-1 border-b border-ink/10">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`px-1 pb-2.5 text-sm font-semibold ${activeTab === "orders" ? "border-b-2 border-ink text-ink" : "text-ink/50"}`}
        >
          orders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={`ml-5 px-1 pb-2.5 text-sm font-semibold ${activeTab === "inventory" ? "border-b-2 border-ink text-ink" : "text-ink/50"}`}
        >
          inventory
        </button>
      </div>

      {activeTab === "orders" && (
        <>
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
        </>
      )}

      {activeTab === "inventory" && (
        <section className="space-y-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/60">
              inventory {inventory?.location ? `— ${inventory.location.name}` : ""}
            </h2>
            <button
              type="button"
              onClick={() => void loadInventory()}
              disabled={isLoadingInventory}
              className="pill-btn-outline gap-1.5 !py-2 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingInventory ? "animate-spin" : ""}`} aria-hidden />
              refresh
            </button>
          </div>
          <p className="text-xs text-ink/50">View only — real stock, updated live. Editing happens in admin.</p>

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRangeChange(r)}
                disabled={isLoadingInventory}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                  range === r ? "bg-ink text-cream" : "border border-ink/15 text-ink/60 hover:border-ink/30"
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>

          {inventoryError && <p className="text-sm text-red-600">{inventoryError}</p>}

          {isLoadingInventory && !inventory ? (
            <p className="py-6 text-center text-sm text-ink/50">Loading…</p>
          ) : !inventory || inventory.products.length === 0 ? (
            <p className="flex flex-col items-center gap-2 py-6 text-center text-sm text-ink/50">
              <Package className="h-6 w-6 opacity-40" aria-hidden />
              No stock recorded yet.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2.5">
              {inventory.products.map((p) => (
                <li key={p.variantId} className="rounded-xl border border-ink/15 bg-cream/60 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-ink">{p.productName}</span>
                    <span className="font-mono text-xs text-ink/50">{formatInr(p.price)}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                    <div>
                      <p className="text-ink/50">sold</p>
                      <p className="font-semibold text-ink">{p.unitsSold}</p>
                    </div>
                    <div>
                      <p className="text-ink/50">remaining</p>
                      <p className="font-semibold text-ink">{p.unitsRemaining}</p>
                    </div>
                    <div>
                      <p className="text-ink/50">revenue</p>
                      <p className="font-semibold text-ink">{formatInr(p.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-ink/50">commission</p>
                      <p className="font-semibold text-ink">{formatInr(p.commission)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
