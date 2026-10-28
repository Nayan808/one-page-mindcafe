"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

// Shared building blocks for the signed-in dashboards (/account and
// /expert/dashboard): a sticky sidebar of in-page sections, white cards on
// a soft grey canvas, navy sans headings and mauve accents. Only the
// content between the site header and footer — both stay as they are.

export type DashboardNavItem = {
  id: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  /** Runs before scrolling — e.g. to expand a collapsed section first. */
  onSelect?: () => void;
};

const HEADING_FONT = "font-[family-name:var(--font-display)]";

export function DashboardShell({
  workspaceLabel,
  items,
  children,
}: {
  workspaceLabel: string;
  items: DashboardNavItem[];
  children: ReactNode;
}) {
  const [activeId, setActiveId] = useState(items[0]?.id);

  // Highlights the last section whose top has scrolled past the sticky
  // header — or the final one once the page is scrolled to the bottom.
  const ids = items.map((item) => item.id).join("|");
  useEffect(() => {
    const sectionIds = ids.split("|");
    let frame = 0;
    function update() {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = sectionIds[0];
      for (const sectionId of sectionIds) {
        const el = document.getElementById(sectionId);
        if (el && el.getBoundingClientRect().top <= 160) current = sectionId;
      }
      if (atBottom && window.scrollY > 0) current = sectionIds[sectionIds.length - 1];
      setActiveId(current);
    }
    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ids]);

  function select(item: DashboardNavItem) {
    item.onSelect?.();
    setActiveId(item.id);
    // Let a just-expanded section render before scrolling to it.
    window.requestAnimationFrame(() =>
      document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  return (
    <div className="bg-[#f7f5f6]">
      <div className="mx-auto max-w-[88rem] px-4 pb-20 pt-6 sm:px-6 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8 lg:pt-10">
        <aside className="hidden lg:block" aria-label="Dashboard navigation">
          <div className="sticky top-28 flex max-h-[calc(100svh-8.5rem)] flex-col rounded-[18px] border border-[#eee4e9] bg-white p-4">
            <p className="px-3 pb-3 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">{workspaceLabel}</p>
            <nav className="grid gap-1">
              {items.map((item) => {
                const active = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => select(item)}
                    aria-current={active ? "true" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-[13px] font-semibold transition-colors ${
                      active ? "bg-[#f6eef2] text-brand" : "text-[#68768b] hover:bg-[#f6eef2] hover:text-brand"
                    }`}
                  >
                    <item.Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-[#eee4e9] px-3 pb-1 pt-4 text-[11px] leading-relaxed text-[#7f8794]">
              <strong className="mb-0.5 block text-xs text-brand-navy">Need a hand?</strong>
              Contact mindcafe support
              <br />
              <a href="mailto:team@mindcafe.app" className="text-brand hover:underline">
                team@mindcafe.app
              </a>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Phones and tablets: the same sections as a scrollable tab row. */}
          <nav className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden" aria-label="Dashboard sections">
            {items.map((item) => {
              const active = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                    active ? "border-brand/30 bg-[#f6eef2] text-brand" : "border-[#eee4e9] bg-white text-[#68768b]"
                  }`}
                >
                  <item.Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PageHead({
  id,
  eyebrow,
  title,
  description,
  action,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div id={id} className="mb-6 flex scroll-mt-28 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className={`${HEADING_FONT} text-[1.75rem] font-bold leading-tight tracking-[-0.025em] text-brand-navy sm:text-4xl`}>
          {title}
        </h1>
        {description && <p className="mt-1.5 text-[13px] text-[#718096]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand ${className}`}>{children}</p>
  );
}

export function DashCard({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 rounded-[18px] border border-[#eee4e9] bg-white p-5 shadow-[0_14px_36px_rgba(45,65,96,0.08)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className={`${HEADING_FONT} text-[19px] font-bold tracking-[-0.015em] text-brand-navy`}>{title}</h2>
        {description && <p className="mt-1 text-xs leading-relaxed text-[#718096]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className={`${HEADING_FONT} mb-3 mt-8 text-xl font-bold text-brand-navy`}>{children}</h2>;
}

export function StatCard({ label, value, foot }: { label: string; value: ReactNode; foot?: string }) {
  return (
    <div className="rounded-[18px] border border-[#eee4e9] bg-white px-5 py-4 shadow-[0_14px_36px_rgba(45,65,96,0.08)]">
      <p className="text-[11px] text-[#758196]">{label}</p>
      <p className={`${HEADING_FONT} mb-1 mt-2 text-[29px] font-bold leading-tight text-brand-navy`}>{value}</p>
      {foot && <p className="text-[10px] text-[#708274]">{foot}</p>}
    </div>
  );
}

export type PillTone = "green" | "amber" | "red" | "grey" | "mauve";

const PILL_TONES: Record<PillTone, string> = {
  green: "bg-[#eaf3ee] text-[#477d67]",
  amber: "bg-[#faf2df] text-[#92703d]",
  red: "bg-red-50 text-red-700",
  grey: "bg-ink/[0.05] text-ink/55",
  mauve: "bg-[#f6eef2] text-brand",
};

export function StatusPill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${PILL_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function IconTile({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#f5edf1] text-brand ${className}`}>
      {children}
    </span>
  );
}

/** "18 Oct" and "3:30 pm" — for the compact agenda rows. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function shortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}
